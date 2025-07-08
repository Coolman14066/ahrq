#!/usr/bin/env python3
"""
Alternative approach using Scopus Search API to get article details
Since Abstract Retrieval API requires special permissions, we'll use Search API with specific fields
"""

import requests
import json
import pandas as pd
import time
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging

class ScopusSearchDetailsRetriever:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.elsevier.com/content/search/scopus"
        self.results = []
        self.failed_retrievals = []
        
        # Setup logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs("../04_results/article_details", exist_ok=True)
        
        logging.basicConfig(
            filename=f'../04_results/article_details/search_details_{timestamp}.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        self.timestamp = timestamp
        
    def retrieve_by_eid(self, eid: str) -> Optional[Dict]:
        """Retrieve article details using Search API with EID"""
        
        # Define fields we want to retrieve
        fields = [
            "eid", "doi", "title", "publicationName", "volume", "issueIdentifier",
            "pageRange", "coverDate", "creator", "authname", "authid", "affilname",
            "affiliation-city", "affiliation-country", "citedby-count", "subtypeDescription",
            "authkeywords", "fund-acr", "fund-no", "fund-sponsor", "description",
            "sourceTitle", "sourceid", "source-id", "openaccess", "openaccessFlag"
        ]
        
        params = {
            'apiKey': self.api_key,
            'query': f'EID({eid})',
            'field': ','.join(fields),
            'view': 'STANDARD'  # Use STANDARD view which doesn't require special permissions
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                entries = data.get('search-results', {}).get('entry', [])
                
                if entries and len(entries) > 0:
                    self.logger.info(f"Successfully retrieved EID: {eid}")
                    return self._parse_search_entry(entries[0], eid)
                else:
                    self.logger.warning(f"No results found for EID: {eid}")
                    return None
            else:
                self.logger.error(f"Failed to retrieve EID {eid}: {response.status_code}")
                self.failed_retrievals.append({
                    'eid': eid,
                    'error': f"HTTP {response.status_code}",
                    'message': response.text[:200]
                })
                return None
                
        except Exception as e:
            self.logger.error(f"Exception retrieving EID {eid}: {str(e)}")
            self.failed_retrievals.append({
                'eid': eid,
                'error': 'Exception',
                'message': str(e)
            })
            return None
    
    def _parse_search_entry(self, entry: Dict, eid: str) -> Dict:
        """Parse the search API response entry"""
        
        # Extract authors
        authors = []
        creator = entry.get('dc:creator', '')
        if creator:
            authors.append({'name': creator, 'is_first': True})
        
        # Check for author list in authname field
        authname = entry.get('authname', '')
        if authname and authname != creator:
            # Split multiple authors if present
            if ';' in authname:
                for auth in authname.split(';'):
                    authors.append({'name': auth.strip(), 'is_first': False})
            else:
                authors.append({'name': authname, 'is_first': False})
        
        # Extract affiliations
        affiliations = []
        affilname = entry.get('affilname', '')
        if affilname:
            if ';' in affilname:
                affiliations = [a.strip() for a in affilname.split(';')]
            else:
                affiliations = [affilname]
        
        # Extract keywords
        keywords = []
        authkeywords = entry.get('authkeywords', '')
        if authkeywords:
            if '|' in authkeywords:
                keywords = [k.strip() for k in authkeywords.split('|')]
            elif ';' in authkeywords:
                keywords = [k.strip() for k in authkeywords.split(';')]
            else:
                keywords = [authkeywords]
        
        # Extract funding information
        funding_info = []
        fund_sponsor = entry.get('fund-sponsor', '')
        fund_acr = entry.get('fund-acr', '')
        fund_no = entry.get('fund-no', '')
        
        if fund_sponsor:
            sponsors = fund_sponsor.split(';') if ';' in fund_sponsor else [fund_sponsor]
            acronyms = fund_acr.split(';') if fund_acr and ';' in fund_acr else [fund_acr] if fund_acr else []
            numbers = fund_no.split(';') if fund_no and ';' in fund_no else [fund_no] if fund_no else []
            
            for i, sponsor in enumerate(sponsors):
                fund_item = {'agency': sponsor.strip()}
                if i < len(acronyms) and acronyms[i]:
                    fund_item['acronym'] = acronyms[i].strip()
                if i < len(numbers) and numbers[i]:
                    fund_item['grant_number'] = numbers[i].strip()
                funding_info.append(fund_item)
        
        # Check for AHRQ mentions in available text
        all_text = ' '.join([
            entry.get('dc:title', ''),
            entry.get('dc:description', ''),
            authkeywords,
            fund_sponsor,
            fund_acr
        ]).lower()
        
        has_ahrq_mention = any(term in all_text for term in ['ahrq', 'agency for healthcare research', 'compendium'])
        
        # Check for AHRQ in funding
        ahrq_funding = {'has_ahrq_funding': False, 'ahrq_grants': []}
        for fund in funding_info:
            agency_lower = fund.get('agency', '').lower()
            if 'ahrq' in agency_lower or 'agency for healthcare research' in agency_lower:
                ahrq_funding['has_ahrq_funding'] = True
                ahrq_funding['ahrq_grants'].append(fund)
        
        # Compile article details
        article_details = {
            'eid': eid,
            'doi': entry.get('prism:doi', ''),
            'title': entry.get('dc:title', ''),
            'publication_year': entry.get('prism:coverDate', '')[:4] if entry.get('prism:coverDate') else '',
            'journal': entry.get('prism:publicationName', ''),
            'volume': entry.get('prism:volume', ''),
            'issue': entry.get('prism:issueIdentifier', ''),
            'pages': entry.get('prism:pageRange', ''),
            'abstract': entry.get('dc:description', ''),
            'citation_count': int(entry.get('citedby-count', 0)),
            'authors': authors,
            'author_count': len(authors),
            'affiliations': affiliations,
            'keywords': keywords,
            'funding_info': funding_info,
            'ahrq_mentions_in_funding': ahrq_funding,
            'has_ahrq_mention': has_ahrq_mention,
            'open_access': entry.get('openaccess', '') == '1' or entry.get('openaccessFlag', False),
            'document_type': entry.get('subtypeDescription', ''),
            'source_id': entry.get('source-id', ''),
            'retrieved_timestamp': datetime.now().isoformat(),
            'retrieval_method': 'search_api'
        }
        
        return article_details
    
    def process_article_list(self, csv_path: str):
        """Process a list of articles from CSV"""
        # Read the CSV
        df = pd.read_csv(csv_path, encoding='utf-8-sig')
        
        self.logger.info(f"Processing {len(df)} articles from {csv_path}")
        
        # Process each article
        for idx, row in df.iterrows():
            eid = row.get('eid', '')
            if not eid:
                self.logger.warning(f"No EID for row {idx}")
                continue
            
            print(f"Processing {idx+1}/{len(df)}: {eid}")
            
            # Retrieve article details
            article_details = self.retrieve_by_eid(eid)
            
            if article_details:
                # Add original search information
                article_details['original_confidence'] = row.get('final_confidence', row.get('confidence', 0))
                article_details['original_search_type'] = row.get('search_type', '')
                
                self.results.append(article_details)
            
            # Rate limiting
            time.sleep(0.5)  # Shorter delay since this is a simpler API call
        
        self.logger.info(f"Successfully retrieved {len(self.results)} articles")
        self.logger.info(f"Failed to retrieve {len(self.failed_retrievals)} articles")
    
    def save_results(self):
        """Save retrieval results"""
        output_dir = "../04_results/article_details"
        
        # Save successful retrievals
        if self.results:
            # Full JSON with all details
            json_path = os.path.join(output_dir, f"search_api_details_{self.timestamp}.json")
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(self.results, f, indent=2, ensure_ascii=False)
            print(f"✅ Full details saved to: {json_path}")
            
            # Summary CSV
            summary_data = []
            for article in self.results:
                summary_data.append({
                    'eid': article['eid'],
                    'doi': article['doi'],
                    'title': article['title'],
                    'year': article['publication_year'],
                    'journal': article['journal'],
                    'author_count': article['author_count'],
                    'citation_count': article['citation_count'],
                    'has_ahrq_mention': article['has_ahrq_mention'],
                    'has_ahrq_funding': article['ahrq_mentions_in_funding']['has_ahrq_funding'],
                    'keywords_count': len(article['keywords']),
                    'open_access': article['open_access'],
                    'original_confidence': article['original_confidence']
                })
            
            summary_df = pd.DataFrame(summary_data)
            summary_path = os.path.join(output_dir, f"search_retrieval_summary_{self.timestamp}.csv")
            summary_df.to_csv(summary_path, index=False, encoding='utf-8-sig')
            print(f"✅ Summary saved to: {summary_path}")
            
            # Articles with AHRQ mentions
            ahrq_articles = [a for a in self.results if a['has_ahrq_mention']]
            if ahrq_articles:
                ahrq_path = os.path.join(output_dir, f"articles_with_ahrq_mentions_{self.timestamp}.json")
                with open(ahrq_path, 'w', encoding='utf-8') as f:
                    json.dump(ahrq_articles, f, indent=2, ensure_ascii=False)
                print(f"✅ Articles with AHRQ mentions: {ahrq_path} ({len(ahrq_articles)} articles)")
            
            # Create a detailed CSV for LLM processing
            detailed_data = []
            for article in self.results:
                detailed_data.append({
                    'eid': article['eid'],
                    'doi': article['doi'],
                    'title': article['title'],
                    'year': article['publication_year'],
                    'journal': article['journal'],
                    'authors': '; '.join([a['name'] for a in article['authors']]),
                    'affiliations': '; '.join(article['affiliations']),
                    'abstract': article['abstract'],
                    'keywords': '; '.join(article['keywords']),
                    'funding_agencies': '; '.join([f['agency'] for f in article['funding_info']]),
                    'citation_count': article['citation_count'],
                    'has_ahrq_mention': article['has_ahrq_mention'],
                    'has_ahrq_funding': article['ahrq_mentions_in_funding']['has_ahrq_funding'],
                    'open_access': article['open_access'],
                    'document_type': article['document_type'],
                    'original_confidence': article['original_confidence']
                })
            
            detailed_df = pd.DataFrame(detailed_data)
            detailed_path = os.path.join(output_dir, f"articles_for_llm_processing_{self.timestamp}.csv")
            detailed_df.to_csv(detailed_path, index=False, encoding='utf-8-sig')
            print(f"✅ Detailed CSV for LLM processing: {detailed_path}")
        
        # Save failed retrievals
        if self.failed_retrievals:
            failed_df = pd.DataFrame(self.failed_retrievals)
            failed_path = os.path.join(output_dir, f"search_failed_retrievals_{self.timestamp}.csv")
            failed_df.to_csv(failed_path, index=False, encoding='utf-8-sig')
            print(f"⚠️  Failed retrievals saved to: {failed_path}")


def main():
    """Run the search-based retrieval"""
    # Initialize retriever
    api_key = "7cb67bc87041113e16b3604ec1d33cd6"
    retriever = ScopusSearchDetailsRetriever(api_key)
    
    # Process the high-confidence articles
    csv_path = "../04_results/compendium_search/compendium_high_confidence_20250625_212553.csv"
    
    if not os.path.exists(csv_path):
        print(f"Error: Could not find {csv_path}")
        print("Please run the compendium search first.")
        return
    
    print("="*80)
    print("SCOPUS SEARCH API DETAILS RETRIEVAL")
    print("="*80)
    print(f"Processing articles from: {csv_path}")
    print("Using Search API instead of Abstract API to avoid authorization issues")
    
    # Process articles
    retriever.process_article_list(csv_path)
    
    # Save results
    retriever.save_results()
    
    print("\n" + "="*80)
    print("RETRIEVAL COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()