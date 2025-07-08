#!/usr/bin/env python3
"""
Agents 2-4: Multi-Source Aggregator
Queries multiple databases in parallel for comprehensive coverage
"""

import requests
import json
import pandas as pd
import time
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import quote

class CrossRefAgent:
    """Agent 2: CrossRef Citation Hunter"""
    def __init__(self):
        self.base_url = "https://api.crossref.org/works"
        self.email = "ahrq_research@example.com"  # Polite pool
        self.results = []
        
    def get_citations(self, doi: str) -> Dict:
        """Get citation information for a DOI"""
        if not doi:
            return None
            
        # Clean DOI
        doi = doi.strip()
        if doi.startswith('http'):
            doi = doi.split('doi.org/')[-1]
        
        url = f"{self.base_url}/{doi}"
        headers = {'User-Agent': f'AHRQ-Research/1.0 (mailto:{self.email})'}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', {})
                
                # Extract citation data
                result = {
                    'doi': doi,
                    'is-referenced-by-count': message.get('is-referenced-by-count', 0),
                    'references-count': message.get('references-count', 0),
                    'title': message.get('title', [''])[0] if message.get('title') else '',
                    'publisher': message.get('publisher', ''),
                    'type': message.get('type', ''),
                    'subject': message.get('subject', []),
                    'funder': message.get('funder', [])
                }
                
                # Check if funded by AHRQ
                ahrq_funded = False
                for funder in result['funder']:
                    if 'ahrq' in str(funder).lower() or 'agency for healthcare' in str(funder).lower():
                        ahrq_funded = True
                        break
                
                result['ahrq_funded'] = ahrq_funded
                return result
                
        except Exception as e:
            logging.error(f"CrossRef error for {doi}: {e}")
            return None
    
    def get_citing_works(self, doi: str, limit: int = 20) -> List[Dict]:
        """Get works that cite this DOI"""
        if not doi:
            return []
            
        # Clean DOI
        doi = doi.strip()
        if doi.startswith('http'):
            doi = doi.split('doi.org/')[-1]
        
        # CrossRef doesn't have a direct citing works endpoint
        # We would need to use a different service or search for references
        # For now, return empty - this would require OpenCitations or similar
        return []


class COREAgent:
    """Agent 3: CORE Open Access Full Text"""
    def __init__(self, api_key: str = None):
        self.base_url = "https://api.core.ac.uk/v3"
        self.api_key = api_key  # Optional for basic access
        self.results = []
        
    def search_by_doi(self, doi: str) -> Optional[Dict]:
        """Search CORE for open access version"""
        if not doi:
            return None
            
        url = f"{self.base_url}/search/works"
        params = {
            'q': f'doi:"{doi}"',
            'limit': 1
        }
        
        headers = {}
        if self.api_key:
            headers['Authorization'] = f'Bearer {self.api_key}'
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('totalHits', 0) > 0:
                    work = data['results'][0]
                    
                    # Check if full text is available
                    has_full_text = work.get('fullText') is not None
                    
                    return {
                        'core_id': work.get('id'),
                        'title': work.get('title'),
                        'abstract': work.get('abstract'),
                        'has_full_text': has_full_text,
                        'download_url': work.get('downloadUrl'),
                        'full_text_snippet': work.get('fullText', '')[:500] if has_full_text else '',
                        'year': work.get('yearPublished'),
                        'publisher': work.get('publisher'),
                        'oai': work.get('oai')
                    }
        except Exception as e:
            logging.error(f"CORE error for {doi}: {e}")
            
        return None


class OpenAlexAgent:
    """Agent 4: OpenAlex Alternative Database"""
    def __init__(self):
        self.base_url = "https://api.openalex.org"
        self.email = "ahrq_research@example.com"
        self.results = []
        
    def get_work_by_doi(self, doi: str) -> Optional[Dict]:
        """Get work details from OpenAlex"""
        if not doi:
            return None
            
        # Clean DOI
        doi = doi.strip()
        if doi.startswith('http'):
            doi = doi.split('doi.org/')[-1]
        
        url = f"{self.base_url}/works/doi:{doi}"
        params = {'mailto': self.email}
        
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                work = response.json()
                
                # Extract relevant information
                result = {
                    'openalex_id': work.get('id'),
                    'doi': work.get('doi'),
                    'title': work.get('title'),
                    'publication_year': work.get('publication_year'),
                    'cited_by_count': work.get('cited_by_count', 0),
                    'concepts': [c['display_name'] for c in work.get('concepts', [])[:5]],
                    'mesh_terms': [m['descriptor_name'] for m in work.get('mesh', [])],
                    'is_oa': work.get('open_access', {}).get('is_oa', False),
                    'oa_url': work.get('open_access', {}).get('oa_url'),
                    'abstract_inverted_index': work.get('abstract_inverted_index', {})
                }
                
                # Check for AHRQ mentions in abstract
                abstract_text = self._reconstruct_abstract(result['abstract_inverted_index'])
                result['abstract_text'] = abstract_text
                result['mentions_ahrq'] = 'ahrq' in abstract_text.lower() or 'compendium' in abstract_text.lower()
                
                # Get funders
                result['funders'] = [f.get('display_name', '') for f in work.get('funders', [])]
                result['ahrq_funded'] = any('ahrq' in f.lower() for f in result['funders'])
                
                return result
                
        except Exception as e:
            logging.error(f"OpenAlex error for {doi}: {e}")
            
        return None
    
    def _reconstruct_abstract(self, inverted_index: Dict) -> str:
        """Reconstruct abstract from inverted index"""
        if not inverted_index:
            return ""
            
        # Create position-word pairs
        words = []
        for word, positions in inverted_index.items():
            for pos in positions:
                words.append((pos, word))
        
        # Sort by position and join
        words.sort(key=lambda x: x[0])
        return ' '.join([word for pos, word in words])
    
    def search_citing_works(self, doi: str, limit: int = 20) -> List[Dict]:
        """Find works citing this DOI"""
        if not doi:
            return []
            
        # Clean DOI
        doi = doi.strip()
        if doi.startswith('http'):
            doi = doi.split('doi.org/')[-1]
        
        url = f"{self.base_url}/works"
        params = {
            'filter': f'cites:doi:{doi}',
            'per-page': limit,
            'mailto': self.email
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                citing_works = []
                
                for work in data.get('results', []):
                    citing_works.append({
                        'doi': work.get('doi'),
                        'title': work.get('title'),
                        'year': work.get('publication_year'),
                        'journal': work.get('host_venue', {}).get('display_name'),
                        'cited_by_count': work.get('cited_by_count', 0)
                    })
                
                return citing_works
                
        except Exception as e:
            logging.error(f"OpenAlex citing works error for {doi}: {e}")
            
        return []


class SemanticScholarAgent:
    """Additional Agent: Semantic Scholar"""
    def __init__(self):
        self.base_url = "https://api.semanticscholar.org/graph/v1"
        self.results = []
        
    def get_paper_by_doi(self, doi: str) -> Optional[Dict]:
        """Get paper details from Semantic Scholar"""
        if not doi:
            return None
            
        url = f"{self.base_url}/paper/DOI:{doi}"
        params = {
            'fields': 'title,abstract,year,authors,venue,citationCount,references,citations,influentialCitationCount,fieldsOfStudy'
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                paper = response.json()
                
                return {
                    'paper_id': paper.get('paperId'),
                    'title': paper.get('title'),
                    'abstract': paper.get('abstract'),
                    'year': paper.get('year'),
                    'venue': paper.get('venue'),
                    'citation_count': paper.get('citationCount', 0),
                    'influential_citations': paper.get('influentialCitationCount', 0),
                    'fields': paper.get('fieldsOfStudy', []),
                    'reference_count': len(paper.get('references', [])),
                    'mentions_ahrq': 'ahrq' in (paper.get('abstract', '') + paper.get('title', '')).lower()
                }
                
        except Exception as e:
            logging.error(f"Semantic Scholar error for {doi}: {e}")
            
        return None


class MultiSourceAggregator:
    """Orchestrates all source agents"""
    def __init__(self):
        self.crossref = CrossRefAgent()
        self.core = COREAgent()
        self.openalex = OpenAlexAgent()
        self.semantic = SemanticScholarAgent()
        self.results = []
        
        # Setup logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs("../04_results/multi_source", exist_ok=True)
        
        logging.basicConfig(
            filename=f'../04_results/multi_source/aggregation_{timestamp}.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        self.timestamp = timestamp
    
    def aggregate_for_article(self, doi: str, eid: str, title: str) -> Dict:
        """Aggregate data from all sources for one article"""
        result = {
            'doi': doi,
            'eid': eid,
            'title': title,
            'timestamp': datetime.now().isoformat()
        }
        
        # Query each source
        if doi:
            # CrossRef
            crossref_data = self.crossref.get_citations(doi)
            if crossref_data:
                result['crossref'] = crossref_data
            
            # CORE
            core_data = self.core.search_by_doi(doi)
            if core_data:
                result['core'] = core_data
            
            # OpenAlex
            openalex_data = self.openalex.get_work_by_doi(doi)
            if openalex_data:
                result['openalex'] = openalex_data
                
                # Get citing works
                citing = self.openalex.search_citing_works(doi, limit=10)
                if citing:
                    result['openalex_citing'] = citing
            
            # Semantic Scholar
            semantic_data = self.semantic.get_paper_by_doi(doi)
            if semantic_data:
                result['semantic_scholar'] = semantic_data
        
        # Aggregate findings
        result['aggregated'] = self._aggregate_findings(result)
        
        return result
    
    def _aggregate_findings(self, data: Dict) -> Dict:
        """Aggregate findings across sources"""
        agg = {
            'has_open_access': False,
            'total_citations': 0,
            'mentions_ahrq': False,
            'ahrq_funded': False,
            'full_text_available': False,
            'citing_works_found': 0
        }
        
        # Check each source
        if 'core' in data:
            agg['has_open_access'] = data['core'].get('has_full_text', False)
            agg['full_text_available'] = data['core'].get('has_full_text', False)
        
        if 'crossref' in data:
            agg['total_citations'] = max(agg['total_citations'], 
                                        data['crossref'].get('is-referenced-by-count', 0))
            agg['ahrq_funded'] = agg['ahrq_funded'] or data['crossref'].get('ahrq_funded', False)
        
        if 'openalex' in data:
            agg['total_citations'] = max(agg['total_citations'],
                                        data['openalex'].get('cited_by_count', 0))
            agg['mentions_ahrq'] = agg['mentions_ahrq'] or data['openalex'].get('mentions_ahrq', False)
            agg['ahrq_funded'] = agg['ahrq_funded'] or data['openalex'].get('ahrq_funded', False)
            agg['has_open_access'] = agg['has_open_access'] or data['openalex'].get('is_oa', False)
            
            if 'openalex_citing' in data:
                agg['citing_works_found'] = len(data['openalex_citing'])
        
        if 'semantic_scholar' in data:
            agg['total_citations'] = max(agg['total_citations'],
                                        data['semantic_scholar'].get('citation_count', 0))
            agg['mentions_ahrq'] = agg['mentions_ahrq'] or data['semantic_scholar'].get('mentions_ahrq', False)
        
        return agg
    
    def process_article_list(self, csv_path: str):
        """Process articles from CSV in parallel"""
        df = pd.read_csv(csv_path, encoding='utf-8-sig')
        
        self.logger.info(f"Processing {len(df)} articles from {csv_path}")
        
        # Process in parallel with thread pool
        with ThreadPoolExecutor(max_workers=4) as executor:
            # Submit all tasks
            future_to_article = {}
            
            for idx, row in df.iterrows():
                doi = row.get('doi', '')
                eid = row.get('eid', '')
                title = row.get('title', '')
                
                if doi or eid:
                    future = executor.submit(self.aggregate_for_article, doi, eid, title)
                    future_to_article[future] = (idx, row)
            
            # Process results as they complete
            for future in as_completed(future_to_article):
                idx, row = future_to_article[future]
                
                try:
                    result = future.result()
                    result['original_confidence'] = row.get('final_confidence', row.get('confidence', 0))
                    self.results.append(result)
                    
                    print(f"Processed {idx+1}/{len(df)}: {result['title'][:50]}...")
                    
                except Exception as e:
                    self.logger.error(f"Error processing article {idx}: {e}")
                
                # Brief pause between completions
                time.sleep(0.1)
    
    def save_results(self):
        """Save aggregated results"""
        output_dir = "../04_results/multi_source"
        
        if self.results:
            # Full JSON results
            json_path = os.path.join(output_dir, f"multi_source_data_{self.timestamp}.json")
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            print(f"✅ Full multi-source data saved to: {json_path}")
            
            # Summary CSV
            summary_data = []
            for article in self.results:
                agg = article.get('aggregated', {})
                summary_data.append({
                    'doi': article['doi'],
                    'eid': article['eid'],
                    'title': article['title'],
                    'has_open_access': agg.get('has_open_access', False),
                    'total_citations': agg.get('total_citations', 0),
                    'mentions_ahrq': agg.get('mentions_ahrq', False),
                    'ahrq_funded': agg.get('ahrq_funded', False),
                    'full_text_available': agg.get('full_text_available', False),
                    'citing_works_found': agg.get('citing_works_found', 0),
                    'sources_found': sum([1 for k in ['crossref', 'core', 'openalex', 'semantic_scholar'] if k in article])
                })
            
            summary_df = pd.DataFrame(summary_data)
            summary_path = os.path.join(output_dir, f"multi_source_summary_{self.timestamp}.csv")
            summary_df.to_csv(summary_path, index=False, encoding='utf-8-sig')
            print(f"✅ Summary saved to: {summary_path}")
            
            # Articles with AHRQ mentions
            ahrq_articles = [a for a in self.results if a.get('aggregated', {}).get('mentions_ahrq', False)]
            if ahrq_articles:
                print(f"✅ Found {len(ahrq_articles)} articles mentioning AHRQ in abstracts")
            
            # Open access articles
            oa_articles = [a for a in self.results if a.get('aggregated', {}).get('has_open_access', False)]
            print(f"✅ Found {len(oa_articles)} open access articles")


def main():
    """Run multi-source aggregation"""
    print("="*80)
    print("MULTI-SOURCE AGGREGATOR - AGENTS 2-4")
    print("="*80)
    
    aggregator = MultiSourceAggregator()
    
    # Process high-confidence articles
    csv_path = "../04_results/compendium_search/compendium_high_confidence_20250625_212553.csv"
    
    if not os.path.exists(csv_path):
        print(f"Error: Could not find {csv_path}")
        return
    
    print(f"Processing articles from: {csv_path}")
    print("Querying: CrossRef, CORE, OpenAlex, Semantic Scholar")
    
    # Process articles
    aggregator.process_article_list(csv_path)
    
    # Save results
    aggregator.save_results()
    
    print("\n" + "="*80)
    print("AGGREGATION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()