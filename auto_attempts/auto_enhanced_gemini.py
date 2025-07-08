#!/usr/bin/env python3
"""
AHRQ Enhanced Analysis Engine (v3.0 - Direct Gemini)
Using Google Gemini API directly

Objective: Comprehensive analysis pipeline for AHRQ Compendium usage in scholarly articles
"""

import requests
import pandas as pd
from datetime import datetime
import time
import os
import xml.etree.ElementTree as ET
import google.generativeai as genai
import json
import re
from typing import Dict, List, Optional, Tuple

class AHRQ_Enhanced_Pipeline:
    def __init__(self, scopus_api_key: str, gemini_api_key: str):
        """Initializes the enhanced pipeline with API keys."""
        self.scopus_api_key = scopus_api_key
        self.gemini_api_key = gemini_api_key
        
        self.article_retrieval_url = "https://api.elsevier.com/content/article/doi/"
        self.analysis_results = []
        self.failed_articles = []
        
        # Define valid options for categorical fields
        self.valid_publication_types = ["ACADEMIC", "POLICY", "GOVERNMENT", "OTHER"]
        self.valid_usage_types = ["PRIMARY_ANALYSIS", "RESEARCH_ENABLER", "CONTEXTUAL_REFERENCE"]
        self.valid_research_domains = [
            "Consolidation & Mergers", "Market Power & Pricing", "Quality & Outcomes",
            "Health Equity & Access", "Payment & Reimbursement", "Vertical Integration",
            "Methodology & Data Quality", "Rural Health"
        ]
        
        self._validate_gemini_key()

    def _validate_gemini_key(self):
        """Validates the Gemini API key."""
        print("--- Validating Gemini API Key ---")
        try:
            genai.configure(api_key=self.gemini_api_key)
            genai.list_models()
            print("✅ Gemini API Key is valid and authenticated.")
        except Exception as e:
            print(f"❌ CRITICAL ERROR: Gemini API Key is invalid: {e}")
            raise

    def create_enhanced_system_prompt(self) -> str:
        """Returns the comprehensive system prompt for AHRQ analysis."""
        return """You are an expert research analyst specializing in healthcare policy and AHRQ Compendium usage analysis. 
Your sole function is to analyze the provided document and return a single, valid JSON object with the exact structure specified below.

CRITICAL: Return ONLY a valid JSON object. No markdown, no explanations, no additional text.

The JSON must contain these exact keys in this order:
"Publication_Type", "Title", "Authors_Standardized", "Publication_Year", "Journal_Venue", "Publisher", 
"Usage_Type", "Usage_Justification", "Usage_Description", "Research_Domain", "Geographic_Focus", 
"Data_Years_Used", "Key_Findings", "Policy_Implications", "DOI_URL", "Notes"

=== DETAILED INSTRUCTIONS ===

1. **Publication_Type**: Must be EXACTLY one of: ACADEMIC, POLICY, GOVERNMENT, OTHER
   - ACADEMIC: Peer-reviewed journal articles
   - POLICY: Reports/briefs from think tanks, foundations, associations
   - GOVERNMENT: Federal/state agency reports or testimony
   - OTHER: Theses, dissertations, conference abstracts/posters

2. **Title**: The exact, complete title as it appears in the document

3. **Authors_Standardized**: 
   - Single author: "Last Name F."
   - Multiple authors: "Last Name F.; [+ others]"
   - Organization as author: "[Organization Name]"

4. **Publication_Year**: Four-digit year (e.g., "2024")

5. **Journal_Venue**: Name of journal, conference, or publication series

6. **Publisher**: Primary publishing entity or institution

7. **Usage_Type** - THE MOST CRITICAL FIELD. Choose EXACTLY one:

   A) PRIMARY_ANALYSIS
      - The paper's MAIN PURPOSE is analyzing AHRQ Compendium data itself
      - Core findings are statistics ABOUT the Compendium (e.g., "76% of hospitals are in systems")
      - Removing AHRQ data would eliminate the paper's reason for existence
      
   B) RESEARCH_ENABLER
      - AHRQ provides foundational structure/methodology for studying something else
      - Used for: linking hospitals to systems, defining cohorts, creating variables
      - The main finding is NOT about AHRQ data itself
      
   C) CONTEXTUAL_REFERENCE
      - AHRQ cited for background context or to support an argument
      - Appears in introduction/discussion, not core methods
      - Single statistics cited from AHRQ or indirect citations

8. **Usage_Justification**: 1-2 sentences explaining WHY you chose this Usage_Type

9. **Usage_Description**: MUST contain THREE distinct parts in ONE paragraph:
   - Action Statement: "Used [year] AHRQ Compendium to [specific action]..."
   - Purpose Clause: "...for the purpose of [immediate goal]..."
   - Research Context: "...This [usage type] was essential for [ultimate study objective]."

10. **Research_Domain**: Must be EXACTLY one of:
    "Consolidation & Mergers", "Market Power & Pricing", "Quality & Outcomes", 
    "Health Equity & Access", "Payment & Reimbursement", "Vertical Integration", 
    "Methodology & Data Quality", "Rural Health"

11. **Geographic_Focus**: Geographic scope (e.g., "USA", "California", "Multi-state")

12. **Data_Years_Used**: 
    - List specific years mentioned (e.g., "2018", "2016, 2018", "2018-2022")
    - If not specified: "Not specified in document"

13. **Key_Findings**: The SINGLE most important quantifiable result enabled by AHRQ:
    - For PRIMARY_ANALYSIS: Quote the main AHRQ data finding
    - For RESEARCH_ENABLER: State the cohort/variable statistic AHRQ helped create
    - For CONTEXTUAL_REFERENCE: Quote the specific AHRQ statistic cited
    - If no number exists: "No AHRQ-derived statistic is presented; its role was limited to [specific use]"

14. **Policy_Implications**: Connect the finding to real-world policy action. 
    Answer: "Because of this finding, policymakers should..."

15. **DOI_URL**: Full DOI link (https://doi.org/...) or stable URL

16. **Notes**: Optional analyst insights (e.g., "Indirect citation via Smith et al.")

=== DOCUMENT TEXT TO ANALYZE ===
{document_text}"""

    def extract_enhanced_xml_content(self, xml_text: str) -> Dict[str, str]:
        """Enhanced XML parsing to extract structured content."""
        content = {
            'title': '',
            'authors': '',
            'abstract': '',
            'body': '',
            'doi': '',
            'year': '',
            'journal': '',
            'ahrq_mentions': []
        }
        
        try:
            # Define namespaces
            namespaces = {
                'ce': 'http://www.elsevier.com/xml/common/dtd',
                'bk': 'http://www.elsevier.com/xml/bk/dtd',
                'dc': 'http://purl.org/dc/elements/1.1/',
                'prism': 'http://prismstandard.org/namespaces/basic/2.0/',
                'xocs': 'http://www.elsevier.com/xml/xocs/dtd'
            }
            
            root = ET.fromstring(xml_text)
            
            # Extract metadata
            title_elem = root.find('.//dc:title', namespaces)
            if title_elem is not None and title_elem.text:
                content['title'] = title_elem.text
            
            # Extract DOI
            doi_elem = root.find('.//prism:doi', namespaces)
            if doi_elem is not None and doi_elem.text:
                content['doi'] = f"https://doi.org/{doi_elem.text}"
            
            # Extract year
            year_elem = root.find('.//prism:coverDate', namespaces)
            if year_elem is not None and year_elem.text:
                content['year'] = year_elem.text[:4]
            
            # Extract journal
            journal_elem = root.find('.//prism:publicationName', namespaces)
            if journal_elem is not None and journal_elem.text:
                content['journal'] = journal_elem.text
            
            # Extract authors
            authors = []
            for author in root.findall('.//dc:creator', namespaces):
                if author.text:
                    authors.append(author.text)
            content['authors'] = '; '.join(authors)
            
            # Extract abstract
            abstract_elems = root.findall('.//ce:abstract//ce:para', namespaces)
            if abstract_elems:
                content['abstract'] = ' '.join([p.text for p in abstract_elems if p.text])
            
            # Extract body paragraphs
            paragraphs = []
            for para in root.findall('.//ce:para', namespaces):
                if para.text:
                    text = para.text
                    # Highlight AHRQ mentions
                    if any(term in text for term in ['AHRQ', 'Agency for Healthcare Research', 'Compendium', 'Health Systems']):
                        content['ahrq_mentions'].append(text)
                    paragraphs.append(text)
            
            # Also check for text in other elements
            for elem in root.findall('.//{http://www.elsevier.com/xml/common/dtd}*'):
                if elem.text and elem.text.strip() and len(elem.text) > 50:
                    text = elem.text.strip()
                    if any(term in text for term in ['AHRQ', 'Agency for Healthcare Research', 'Compendium']):
                        if text not in content['ahrq_mentions']:
                            content['ahrq_mentions'].append(text)
                    paragraphs.append(text)
            
            content['body'] = '\n\n'.join(paragraphs)
            
            # If basic extraction failed, try alternative approach
            if not content['body']:
                # Try to get all text content
                all_text = []
                for elem in root.iter():
                    if elem.text and elem.text.strip():
                        all_text.append(elem.text.strip())
                content['body'] = '\n'.join(all_text)
            
        except ET.ParseError as e:
            content['error'] = f"XML Parse Error: {str(e)}"
        except Exception as e:
            content['error'] = f"Extraction Error: {str(e)}"
        
        return content

    def analyze_with_gemini(self, document_content: Dict[str, str]) -> dict:
        """Sends structured content to Gemini for analysis."""
        print("      Sending to Gemini 2.5 Flash for analysis...")
        
        # Prepare document text with structure
        structured_text = f"""
TITLE: {document_content.get('title', 'Not found')}
AUTHORS: {document_content.get('authors', 'Not found')}
YEAR: {document_content.get('year', 'Not found')}
JOURNAL: {document_content.get('journal', 'Not found')}
DOI: {document_content.get('doi', 'Not found')}

ABSTRACT:
{document_content.get('abstract', 'Not found')}

AHRQ/COMPENDIUM MENTIONS FOUND ({len(document_content.get('ahrq_mentions', []))} mentions):
{chr(10).join(document_content.get('ahrq_mentions', ['None found']))}

FULL TEXT:
{document_content.get('body', 'Not found')[:15000]}  # Limit to prevent token overflow
"""
        
        system_prompt = self.create_enhanced_system_prompt()
        prompt_with_text = system_prompt.format(document_text=structured_text)
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            
            # Request JSON response
            generation_config = genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
            
            response = model.generate_content(prompt_with_text, generation_config=generation_config)
            
            print("      ...Received response from Gemini.")
            
            # Parse and validate the JSON response
            parsed_json = json.loads(response.text)
            
            # Validate required fields
            required_fields = [
                "Publication_Type", "Title", "Authors_Standardized", "Publication_Year",
                "Journal_Venue", "Publisher", "Usage_Type", "Usage_Justification",
                "Usage_Description", "Research_Domain", "Geographic_Focus", "Data_Years_Used",
                "Key_Findings", "Policy_Implications", "DOI_URL", "Notes"
            ]
            
            for field in required_fields:
                if field not in parsed_json:
                    parsed_json[field] = ""
            
            # Validate categorical fields
            if parsed_json.get("Publication_Type") not in self.valid_publication_types:
                parsed_json["Publication_Type"] = "OTHER"
            
            if parsed_json.get("Usage_Type") not in self.valid_usage_types:
                parsed_json["Usage_Type"] = "CONTEXTUAL_REFERENCE"
            
            if parsed_json.get("Research_Domain") not in self.valid_research_domains:
                parsed_json["Research_Domain"] = "Methodology & Data Quality"
            
            return parsed_json

        except Exception as e:
            print(f"      ❌ Error during Gemini analysis: {e}")
            return {"error": str(e)}

    def save_to_csv(self, filename: str = "ahrq_analysis_results.csv"):
        """Saves analysis results to CSV in the exact format of ahrq_reference.csv."""
        if not self.analysis_results:
            print("No results to save.")
            return
        
        # Convert to DataFrame
        df = pd.DataFrame(self.analysis_results)
        
        # Ensure correct column order
        column_order = [
            "Publication_Type", "Title", "Authors_Standardized", "Publication_Year",
            "Journal_Venue", "Publisher", "Usage_Type", "Usage_Justification",
            "Usage_Description", "Research_Domain", "Geographic_Focus", "Data_Years_Used",
            "Key_Findings", "Policy_Implications", "DOI_URL", "Notes"
        ]
        
        # Reorder columns and fill missing ones
        for col in column_order:
            if col not in df.columns:
                df[col] = ""
        
        df = df[column_order]
        
        # Save to CSV
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\n✅ Results saved to {filename}")

    def save_failed_articles(self, filename: str = "failed_articles.csv"):
        """Saves failed article retrievals for manual review."""
        if not self.failed_articles:
            print("No failed articles to save.")
            return
        
        df = pd.DataFrame(self.failed_articles)
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"❌ Failed articles saved to {filename}")

    def process_article(self, doi: str, title: str = "Unknown") -> dict:
        """Processes a single article through the complete pipeline."""
        print(f"\n📄 Processing: {title[:70]}...")
        print(f"   DOI: {doi}")
        
        result = {
            'doi': doi,
            'title': title,
            'timestamp': datetime.now().isoformat()
        }
        
        if not doi:
            result['error'] = 'No DOI provided'
            self.failed_articles.append(result)
            return result
        
        # Retrieve article from Scopus
        url = f"{self.article_retrieval_url}{doi}"
        headers = {
            'Accept': 'text/xml',
            'X-ELS-APIKey': self.scopus_api_key
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=45)
            
            if response.status_code == 200:
                print("   ✅ Scopus: Full text retrieved successfully.")
                
                # Extract content with enhanced parser
                extracted_content = self.extract_enhanced_xml_content(response.text)
                
                if 'error' in extracted_content:
                    print(f"   ⚠️  XML Parsing Warning: {extracted_content['error']}")
                    result['error'] = extracted_content['error']
                    self.failed_articles.append(result)
                else:
                    # Check if AHRQ is mentioned
                    full_text = f"{extracted_content.get('title', '')} {extracted_content.get('abstract', '')} {extracted_content.get('body', '')}"
                    
                    if not any(term in full_text for term in ['AHRQ', 'Agency for Healthcare Research', 'Compendium']):
                        print("   ℹ️  Note: No AHRQ mentions found in text")
                    
                    # Analyze with Gemini
                    analysis = self.analyze_with_gemini(extracted_content)
                    
                    if 'error' in analysis:
                        result['error'] = analysis['error']
                        self.failed_articles.append(result)
                    else:
                        # Update with extracted metadata if available
                        if extracted_content.get('title') and not analysis.get('Title'):
                            analysis['Title'] = extracted_content['title']
                        if extracted_content.get('doi') and not analysis.get('DOI_URL'):
                            analysis['DOI_URL'] = extracted_content['doi']
                        if extracted_content.get('year') and not analysis.get('Publication_Year'):
                            analysis['Publication_Year'] = extracted_content['year']
                        if extracted_content.get('journal') and not analysis.get('Journal_Venue'):
                            analysis['Journal_Venue'] = extracted_content['journal']
                        
                        self.analysis_results.append(analysis)
                        print("   ✅ Analysis completed successfully.")
            
            elif response.status_code == 404:
                print(f"   ❌ Scopus: Article not found (404)")
                result['error'] = 'Article not found in Scopus'
                self.failed_articles.append(result)
            
            elif response.status_code == 401:
                print(f"   ❌ Scopus: Authentication failed (401)")
                result['error'] = 'Scopus API authentication failed'
                self.failed_articles.append(result)
            
            else:
                print(f"   ❌ Scopus: HTTP {response.status_code}")
                result['error'] = f'Scopus HTTP {response.status_code}'
                self.failed_articles.append(result)
                
        except requests.exceptions.Timeout:
            print(f"   ❌ Network timeout")
            result['error'] = 'Network timeout'
            self.failed_articles.append(result)
            
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Network error: {e}")
            result['error'] = f'Network error: {str(e)}'
            self.failed_articles.append(result)
            
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
            result['error'] = f'Unexpected error: {str(e)}'
            self.failed_articles.append(result)
        
        return result

    def run_batch_analysis(self, articles: List[Dict[str, str]]):
        """Runs analysis on a batch of articles."""
        print("\n" + "="*80)
        print(f"Starting Enhanced AHRQ Analysis on {len(articles)} articles")
        print("="*80)
        
        for i, article in enumerate(articles, 1):
            print(f"\n[{i}/{len(articles)}]", end="")
            self.process_article(
                doi=article.get('doi', ''),
                title=article.get('title', 'Unknown')
            )
            
            # Rate limiting
            if i < len(articles):
                time.sleep(20)  # 20 seconds between requests for Gemini
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.save_to_csv(f"ahrq_analysis_results_{timestamp}.csv")
        self.save_failed_articles(f"failed_articles_{timestamp}.csv")
        
        # Summary
        print("\n" + "="*80)
        print("ANALYSIS COMPLETE")
        print(f"✅ Successful analyses: {len(self.analysis_results)}")
        print(f"❌ Failed retrievals: {len(self.failed_articles)}")
        print("="*80)


if __name__ == "__main__":
    # API Keys
    scopus_key = "7cb67bc87041113e16b3604ec1d33cd6"
    gemini_key = "AIzaSyA6MGRUrhikVXRHVIJiqF3kZnzra1Ho5gU"
    
    # Test articles from AHRQ_NEWLY_DISCOVERED file
    test_articles = [
        {'doi': '10.1001/jamanetworkopen.2025.13274', 'title': 'Outcomes for Very Preterm Infants Across Health Systems'},
        {'doi': '10.1111/1468-0009.70019', 'title': 'State Health Care Cost Commissions: Their Priorities and How States\' Political Leanings, Commercial Hospital Prices, and Medicaid Spending Predict Their Establishment'},
        {'doi': '10.1097/PRS.0000000000012164', 'title': 'Private Equity Investment in Plastic Surgery Clinics: A Scoping Review'},
        {'doi': '10.1186/s13722-024-00477-3', 'title': 'Using 42 CFR part 2 revisions to integrate substance use disorder treatment information into electronic health records at a safety net health system'},
        {'doi': '10.1200/OP.23.00632', 'title': 'Private Payers and Cancer Care: Revisiting the Land of Opportunity'},
        {'doi': '10.1161/CIRCOUTCOMES.122.009573', 'title': 'Relationship Between In-Hospital Adverse Events and Hospital Performance on 30-Day All-cause Mortality and Readmission for Patients With Heart Failure'},
        {'doi': '10.1016/j.clindermatol.2025.02.007', 'title': 'Ethics of point-of-service collections in dermatology'},
        {'doi': '10.1097/JHM-D-23-00234', 'title': 'Advance Care Planning Billing Codes Associated With Decreased Healthcare Utilization in Neurological Disease'},
        {'doi': '10.1177/10499091251327191', 'title': 'Disparities in End-of-Life Care: A Retrospective Study on Intensive Care Utilization and Advance Care Planning in the Colorado All-Payer Claims Database'},
        {'doi': '10.1007/s11606-024-08604-1', 'title': 'Advance Care Planning (ACP) in Medicare Beneficiaries with Heart Failure'}
    ]
    
    try:
        pipeline = AHRQ_Enhanced_Pipeline(
            scopus_api_key=scopus_key,
            gemini_api_key=gemini_key
        )
        pipeline.run_batch_analysis(test_articles)
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")