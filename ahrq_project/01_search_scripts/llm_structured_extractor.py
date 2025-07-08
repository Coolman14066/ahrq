#!/usr/bin/env python3
"""
Agent 7: LLM Structured Extractor
Sends article text to OpenRouter/Gemini for structured extraction
"""

import json
import pandas as pd
import time
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging
from openai import OpenAI

class LLMStructuredExtractor:
    def __init__(self, api_key: str):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
        self.model = "google/gemini-2.0-flash-exp:free"
        self.results = []
        self.failed_extractions = []
        
        # Setup logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs("../04_results/llm_extraction", exist_ok=True)
        
        logging.basicConfig(
            filename=f'../04_results/llm_extraction/extraction_{timestamp}.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        self.timestamp = timestamp
    
    def create_extraction_prompt(self, article_data: Dict) -> str:
        """Create prompt for structured extraction"""
        prompt = f"""You are analyzing an academic article for mentions of the AHRQ Compendium of U.S. Health Systems.

Article Information:
Title: {article_data.get('title', 'N/A')}
Authors: {', '.join([f"{a.get('given_name', '')} {a.get('surname', '')}" for a in article_data.get('authors', [])])}
Year: {article_data.get('publication_year', 'N/A')}
Journal: {article_data.get('journal', 'N/A')}
DOI: {article_data.get('doi', 'N/A')}

Abstract:
{article_data.get('abstract', 'No abstract available')}

Funding Information:
{article_data.get('funding_text', 'No funding information available')}

References mentioning AHRQ/Compendium:
{json.dumps(article_data.get('ahrq_mentions_in_references', []), indent=2)}

Please extract the following information in JSON format:

{{
  "usage_type": "Primary/Secondary/Context/None",
  "usage_description": "Brief description of how AHRQ Compendium is used",
  "key_findings": "Main findings related to health systems (2-3 sentences)",
  "data_years_used": ["List of AHRQ Compendium years mentioned, e.g., 2018, 2022"],
  "health_system_count": "Number of health systems studied (if mentioned)",
  "study_population": "Description of study population",
  "methodology_mentions_ahrq": true/false,
  "ahrq_compendium_location": ["Abstract", "Methods", "References", "Funding", "None"],
  "confidence_score": 0-100,
  "confidence_rationale": "Why this confidence score",
  "additional_notes": "Any other relevant information"
}}

Usage Type Definitions:
- Primary: AHRQ Compendium is the main data source for analysis
- Secondary: AHRQ Compendium supplements other data sources
- Context: AHRQ Compendium is mentioned for context/comparison only
- None: No clear usage of AHRQ Compendium found

Base your analysis on the provided information. If information is not available, use "Not specified" or null."""
        
        return prompt
    
    def extract_structured_data(self, article_data: Dict) -> Optional[Dict]:
        """Extract structured data using LLM"""
        try:
            prompt = self.create_extraction_prompt(article_data)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a research assistant specializing in health systems research and data extraction."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent extraction
                max_tokens=1000
            )
            
            # Extract JSON from response
            response_text = response.choices[0].message.content
            
            # Try to parse JSON from response
            try:
                # Find JSON block in response
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                
                if start_idx != -1 and end_idx > start_idx:
                    json_text = response_text[start_idx:end_idx]
                    extracted_data = json.loads(json_text)
                    
                    # Add metadata
                    extracted_data['extraction_timestamp'] = datetime.now().isoformat()
                    extracted_data['eid'] = article_data.get('eid', '')
                    extracted_data['doi'] = article_data.get('doi', '')
                    extracted_data['title'] = article_data.get('title', '')
                    
                    return extracted_data
                else:
                    raise ValueError("No JSON found in response")
                    
            except json.JSONDecodeError as e:
                self.logger.error(f"JSON parse error for {article_data.get('eid', 'unknown')}: {e}")
                self.logger.error(f"Response text: {response_text[:500]}")
                return None
                
        except Exception as e:
            self.logger.error(f"Extraction error for {article_data.get('eid', 'unknown')}: {e}")
            self.failed_extractions.append({
                'eid': article_data.get('eid', ''),
                'error': str(e)
            })
            return None
    
    def process_scopus_details(self, json_path: str):
        """Process Scopus abstract retrieval results"""
        with open(json_path, 'r', encoding='utf-8') as f:
            articles = json.load(f)
        
        self.logger.info(f"Processing {len(articles)} articles from {json_path}")
        
        for idx, article in enumerate(articles):
            print(f"Processing {idx+1}/{len(articles)}: {article.get('title', '')[:50]}...")
            
            # Extract structured data
            extracted = self.extract_structured_data(article)
            
            if extracted:
                # Merge with original data
                result = {
                    'original_data': {
                        'eid': article.get('eid'),
                        'doi': article.get('doi'),
                        'title': article.get('title'),
                        'year': article.get('publication_year'),
                        'journal': article.get('journal'),
                        'authors': len(article.get('authors', [])),
                        'references': article.get('reference_count', 0),
                        'ahrq_refs': len(article.get('ahrq_mentions_in_references', [])),
                        'has_ahrq_funding': article.get('ahrq_mentions_in_funding', {}).get('has_ahrq_funding', False)
                    },
                    'extracted_data': extracted
                }
                
                self.results.append(result)
            
            # Rate limiting for API
            time.sleep(2)
        
        self.logger.info(f"Successfully extracted {len(self.results)} articles")
    
    def create_reference_csv_format(self):
        """Format results to match ahrq_reference.csv structure"""
        if not self.results:
            return None
        
        formatted_data = []
        
        for result in self.results:
            orig = result['original_data']
            ext = result['extracted_data']
            
            # Map to reference CSV format
            formatted_row = {
                'Title': orig['title'],
                'Authors_Standardized': f"{orig['authors']} authors",  # Would need full author list
                'Publication_Year': orig['year'],
                'Journal_Venue': orig['journal'],
                'DOI_URL': f"https://doi.org/{orig['doi']}" if orig['doi'] else '',
                'Usage_Type': ext.get('usage_type', 'Unknown'),
                'Usage_Description': ext.get('usage_description', ''),
                'Key_Findings': ext.get('key_findings', ''),
                'Data_Years': ', '.join(ext.get('data_years_used', [])),
                'Health_System_Count': ext.get('health_system_count', ''),
                'Study_Population': ext.get('study_population', ''),
                'AHRQ_Location': ', '.join(ext.get('ahrq_compendium_location', [])),
                'Confidence_Score': ext.get('confidence_score', 0),
                'Has_AHRQ_Funding': 'Yes' if orig['has_ahrq_funding'] else 'No',
                'Reference_Count': orig['references'],
                'AHRQ_Reference_Count': orig['ahrq_refs'],
                'EID': orig['eid'],
                'Extraction_Notes': ext.get('additional_notes', '')
            }
            
            formatted_data.append(formatted_row)
        
        return pd.DataFrame(formatted_data)
    
    def save_results(self):
        """Save extraction results"""
        output_dir = "../04_results/llm_extraction"
        
        if self.results:
            # Full extraction results
            json_path = os.path.join(output_dir, f"llm_extraction_full_{self.timestamp}.json")
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            print(f"✅ Full extraction results saved to: {json_path}")
            
            # Reference CSV format
            ref_df = self.create_reference_csv_format()
            if ref_df is not None:
                ref_path = os.path.join(output_dir, f"extracted_for_reference_{self.timestamp}.csv")
                ref_df.to_csv(ref_path, index=False, encoding='utf-8-sig')
                print(f"✅ Reference-formatted CSV saved to: {ref_path}")
                
                # High confidence only
                high_conf = ref_df[ref_df['Confidence_Score'] >= 80]
                if len(high_conf) > 0:
                    high_path = os.path.join(output_dir, f"high_confidence_extracted_{self.timestamp}.csv")
                    high_conf.to_csv(high_path, index=False, encoding='utf-8-sig')
                    print(f"✅ High confidence extractions: {high_path} ({len(high_conf)} articles)")
            
            # Summary statistics
            summary_path = os.path.join(output_dir, f"extraction_summary_{self.timestamp}.txt")
            with open(summary_path, 'w') as f:
                f.write("LLM EXTRACTION SUMMARY\n")
                f.write("="*50 + "\n")
                f.write(f"Total articles processed: {len(self.results)}\n")
                f.write(f"Failed extractions: {len(self.failed_extractions)}\n\n")
                
                # Usage type distribution
                usage_types = {}
                for r in self.results:
                    usage = r['extracted_data'].get('usage_type', 'Unknown')
                    usage_types[usage] = usage_types.get(usage, 0) + 1
                
                f.write("Usage Type Distribution:\n")
                for usage, count in usage_types.items():
                    f.write(f"  {usage}: {count}\n")
                
                # Confidence distribution
                f.write("\nConfidence Score Distribution:\n")
                conf_ranges = {'90-100': 0, '80-89': 0, '70-79': 0, '<70': 0}
                for r in self.results:
                    conf = r['extracted_data'].get('confidence_score', 0)
                    if conf >= 90:
                        conf_ranges['90-100'] += 1
                    elif conf >= 80:
                        conf_ranges['80-89'] += 1
                    elif conf >= 70:
                        conf_ranges['70-79'] += 1
                    else:
                        conf_ranges['<70'] += 1
                
                for range_name, count in conf_ranges.items():
                    f.write(f"  {range_name}: {count}\n")
            
            print(f"✅ Summary saved to: {summary_path}")
        
        # Save failed extractions
        if self.failed_extractions:
            failed_df = pd.DataFrame(self.failed_extractions)
            failed_path = os.path.join(output_dir, f"failed_extractions_{self.timestamp}.csv")
            failed_df.to_csv(failed_path, index=False, encoding='utf-8-sig')
            print(f"⚠️  Failed extractions saved to: {failed_path}")


def main():
    """Run LLM extraction"""
    print("="*80)
    print("LLM STRUCTURED EXTRACTOR - AGENT 7")
    print("="*80)
    
    # Get OpenRouter API key from environment or config
    api_key = os.getenv('OPENROUTER_API_KEY', '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')
    
    extractor = LLMStructuredExtractor(api_key)
    
    # Find the most recent Scopus details file
    detail_dir = "../04_results/article_details"
    if os.path.exists(detail_dir):
        files = [f for f in os.listdir(detail_dir) if f.startswith('scopus_full_details_') and f.endswith('.json')]
        if files:
            # Use the most recent file
            files.sort()
            json_path = os.path.join(detail_dir, files[-1])
            
            print(f"Processing Scopus details from: {json_path}")
            print(f"Using model: {extractor.model}")
            
            # Process articles
            extractor.process_scopus_details(json_path)
            
            # Save results
            extractor.save_results()
        else:
            print("Error: No Scopus detail files found. Run scopus_abstract_retrieval.py first.")
    else:
        print(f"Error: Directory {detail_dir} not found.")
    
    print("\n" + "="*80)
    print("EXTRACTION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()