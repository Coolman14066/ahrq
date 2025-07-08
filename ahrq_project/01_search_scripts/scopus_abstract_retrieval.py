#!/usr/bin/env python3
"""
Agent 1: Scopus Abstract Retrieval
Retrieves full article details using Scopus Abstract Retrieval API
"""

import requests
import json
import pandas as pd
import time
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging

class ScopusAbstractRetriever:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.elsevier.com/content/abstract"
        self.results = []
        self.failed_retrievals = []
        
        # Setup logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs("../04_results/article_details", exist_ok=True)
        
        logging.basicConfig(
            filename=f'../04_results/article_details/abstract_retrieval_{timestamp}.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        self.timestamp = timestamp
        
    def retrieve_by_eid(self, eid: str) -> Optional[Dict]:
        """Retrieve article details by EID"""
        url = f"{self.base_url}/eid/{eid}"
        
        params = {
            'apiKey': self.api_key,
            'httpAccept': 'application/json',
            'view': 'META_ABS'  # Use META_ABS view which doesn't require special authorization
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self.logger.info(f"Successfully retrieved EID: {eid}")
                return self._parse_abstract_response(data, eid)
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
    
    def _parse_abstract_response(self, data: Dict, eid: str) -> Dict:
        """Parse the abstract retrieval response"""
        # Navigate through the response structure
        abs_retrieval = data.get('abstracts-retrieval-response', {})
        
        # Extract core information
        coredata = abs_retrieval.get('coredata', {})
        
        # Extract authors
        authors = []
        author_group = abs_retrieval.get('authors', {})
        if 'author' in author_group:
            author_list = author_group['author']
            if isinstance(author_list, list):
                authors = [self._parse_author(a) for a in author_list]
            else:
                authors = [self._parse_author(author_list)]
        
        # Extract affiliations
        affiliations = []
        affil_data = abs_retrieval.get('affiliation', [])
        if isinstance(affil_data, list):
            affiliations = [a.get('affilname', '') for a in affil_data]
        elif isinstance(affil_data, dict):
            affiliations = [affil_data.get('affilname', '')]
        
        # Extract funding information
        funding_info = []
        fund_data = abs_retrieval.get('item', {}).get('xocs:meta', {}).get('xocs:funding-list', {})
        if 'xocs:funding' in fund_data:
            funding_list = fund_data['xocs:funding']
            if isinstance(funding_list, list):
                funding_info = [self._parse_funding(f) for f in funding_list]
            else:
                funding_info = [self._parse_funding(funding_list)]
        
        # Extract references
        references = []
        biblio = abs_retrieval.get('item', {}).get('bibrecord', {}).get('tail', {}).get('bibliography', {})
        if 'reference' in biblio:
            ref_list = biblio['reference']
            if isinstance(ref_list, list):
                references = [self._parse_reference(r) for r in ref_list]
            else:
                references = [self._parse_reference(ref_list)]
        
        # Extract keywords
        keywords = []
        if 'authkeywords' in abs_retrieval:
            auth_keywords = abs_retrieval['authkeywords']
            if 'author-keyword' in auth_keywords:
                kw_list = auth_keywords['author-keyword']
                if isinstance(kw_list, list):
                    keywords = [k.get('$', '') for k in kw_list]
                else:
                    keywords = [kw_list.get('$', '')]
        
        # Compile all information
        article_details = {
            'eid': eid,
            'doi': coredata.get('prism:doi', ''),
            'title': coredata.get('dc:title', ''),
            'publication_year': coredata.get('prism:coverDate', '')[:4] if coredata.get('prism:coverDate') else '',
            'journal': coredata.get('prism:publicationName', ''),
            'volume': coredata.get('prism:volume', ''),
            'issue': coredata.get('prism:issueIdentifier', ''),
            'pages': coredata.get('prism:pageRange', ''),
            'abstract': coredata.get('dc:description', ''),
            'citation_count': coredata.get('citedby-count', 0),
            'authors': authors,
            'author_count': len(authors),
            'affiliations': affiliations,
            'keywords': keywords,
            'funding_info': funding_info,
            'funding_text': self._extract_funding_text(abs_retrieval),
            'references': references,
            'reference_count': len(references),
            'ahrq_mentions_in_references': self._check_ahrq_in_references(references),
            'ahrq_mentions_in_funding': self._check_ahrq_in_funding(funding_info, self._extract_funding_text(abs_retrieval)),
            'retrieved_timestamp': datetime.now().isoformat()
        }
        
        return article_details
    
    def _parse_author(self, author: Dict) -> Dict:
        """Parse author information"""
        return {
            'given_name': author.get('given-name', ''),
            'surname': author.get('surname', ''),
            'initials': author.get('initials', ''),
            'author_id': author.get('@auid', ''),
            'seq': author.get('@seq', '')
        }
    
    def _parse_funding(self, funding: Dict) -> Dict:
        """Parse funding information"""
        return {
            'agency': funding.get('xocs:funding-agency', ''),
            'agency_id': funding.get('xocs:funding-agency-id', ''),
            'grant_number': funding.get('xocs:funding-id', ''),
            'acronym': funding.get('xocs:funding-agency-acronym', '')
        }
    
    def _parse_reference(self, ref: Dict) -> Dict:
        """Parse reference information"""
        ref_info = ref.get('ref-info', {})
        
        # Extract title from ref-title
        title = ''
        ref_title = ref_info.get('ref-title', {})
        if 'ref-titletext' in ref_title:
            title = ref_title['ref-titletext']
        
        # Extract authors
        authors = ''
        ref_authors = ref_info.get('ref-authors', {})
        if 'author' in ref_authors:
            author_list = ref_authors['author']
            if isinstance(author_list, list):
                authors = '; '.join([f"{a.get('surname', '')} {a.get('initials', '')}" for a in author_list])
            else:
                authors = f"{author_list.get('surname', '')} {author_list.get('initials', '')}"
        
        # Extract source title
        source = ''
        ref_source = ref_info.get('ref-sourcetitle', '')
        if ref_source:
            source = ref_source
        
        return {
            'ref_id': ref.get('@id', ''),
            'title': title,
            'authors': authors,
            'year': ref_info.get('ref-publicationyear', {}).get('@first', ''),
            'source': source,
            'volume': ref_info.get('ref-volisspag', {}).get('voliss', {}).get('@volume', ''),
            'pages': ref_info.get('ref-volisspag', {}).get('pagerange', {}).get('@first', ''),
            'doi': ref_info.get('refd-itemidlist', {}).get('itemid', {}).get('$', '') if ref_info.get('refd-itemidlist', {}).get('itemid', {}).get('@idtype') == 'DOI' else '',
            'full_text': ref_info.get('ref-text', '')
        }
    
    def _extract_funding_text(self, abs_retrieval: Dict) -> str:
        """Extract funding acknowledgment text"""
        # Try multiple locations for funding text
        item = abs_retrieval.get('item', {})
        
        # Check in xocs:meta
        xocs_meta = item.get('xocs:meta', {})
        if 'xocs:funding-text' in xocs_meta:
            return xocs_meta['xocs:funding-text']
        
        # Check in bibrecord
        bibrecord = item.get('bibrecord', {})
        head = bibrecord.get('head', {})
        if 'grantlist' in head:
            grant_text = head.get('grantlist', {}).get('grant-text', '')
            if grant_text:
                return grant_text
        
        return ''
    
    def _check_ahrq_in_references(self, references: List[Dict]) -> List[Dict]:
        """Check for AHRQ mentions in references"""
        ahrq_refs = []
        
        for ref in references:
            # Check all text fields for AHRQ or Compendium mentions
            ref_text = ' '.join([
                ref.get('title', ''),
                ref.get('authors', ''),
                ref.get('source', ''),
                ref.get('full_text', '')
            ]).lower()
            
            if 'ahrq' in ref_text or 'agency for healthcare research' in ref_text or 'compendium' in ref_text:
                ahrq_refs.append({
                    'ref_id': ref.get('ref_id', ''),
                    'title': ref.get('title', ''),
                    'year': ref.get('year', ''),
                    'match_text': ref_text[:200]
                })
        
        return ahrq_refs
    
    def _check_ahrq_in_funding(self, funding_info: List[Dict], funding_text: str) -> Dict:
        """Check for AHRQ mentions in funding"""
        result = {
            'has_ahrq_funding': False,
            'ahrq_grants': [],
            'funding_text_mentions': False
        }
        
        # Check structured funding
        for fund in funding_info:
            agency = fund.get('agency', '').lower()
            if 'ahrq' in agency or 'agency for healthcare research' in agency:
                result['has_ahrq_funding'] = True
                result['ahrq_grants'].append(fund)
        
        # Check funding text
        if funding_text:
            funding_lower = funding_text.lower()
            if 'ahrq' in funding_lower or 'agency for healthcare research' in funding_lower or 'compendium' in funding_lower:
                result['funding_text_mentions'] = True
        
        return result
    
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
            time.sleep(1)
        
        self.logger.info(f"Successfully retrieved {len(self.results)} articles")
        self.logger.info(f"Failed to retrieve {len(self.failed_retrievals)} articles")
    
    def save_results(self):
        """Save retrieval results"""
        output_dir = "../04_results/article_details"
        
        # Save successful retrievals
        if self.results:
            # Full JSON with all details
            json_path = os.path.join(output_dir, f"scopus_full_details_{self.timestamp}.json")
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
                    'reference_count': article['reference_count'],
                    'ahrq_refs_found': len(article['ahrq_mentions_in_references']),
                    'has_ahrq_funding': article['ahrq_mentions_in_funding']['has_ahrq_funding'],
                    'original_confidence': article['original_confidence']
                })
            
            summary_df = pd.DataFrame(summary_data)
            summary_path = os.path.join(output_dir, f"retrieval_summary_{self.timestamp}.csv")
            summary_df.to_csv(summary_path, index=False, encoding='utf-8-sig')
            print(f"✅ Summary saved to: {summary_path}")
            
            # Articles with AHRQ in references
            ahrq_ref_articles = [a for a in self.results if a['ahrq_mentions_in_references']]
            if ahrq_ref_articles:
                ahrq_path = os.path.join(output_dir, f"articles_with_ahrq_refs_{self.timestamp}.json")
                with open(ahrq_path, 'w', encoding='utf-8') as f:
                    json.dump(ahrq_ref_articles, f, indent=2, ensure_ascii=False)
                print(f"✅ Articles with AHRQ references: {ahrq_path} ({len(ahrq_ref_articles)} articles)")
        
        # Save failed retrievals
        if self.failed_retrievals:
            failed_df = pd.DataFrame(self.failed_retrievals)
            failed_path = os.path.join(output_dir, f"failed_retrievals_{self.timestamp}.csv")
            failed_df.to_csv(failed_path, index=False, encoding='utf-8-sig')
            print(f"⚠️  Failed retrievals saved to: {failed_path}")


def main():
    """Run the abstract retrieval"""
    # Initialize retriever
    api_key = "7cb67bc87041113e16b3604ec1d33cd6"
    retriever = ScopusAbstractRetriever(api_key)
    
    # Process the high-confidence articles
    csv_path = "../04_results/compendium_search/compendium_high_confidence_20250625_212553.csv"
    
    if not os.path.exists(csv_path):
        print(f"Error: Could not find {csv_path}")
        print("Please run the compendium search first.")
        return
    
    print("="*80)
    print("SCOPUS ABSTRACT RETRIEVAL - AGENT 1")
    print("="*80)
    print(f"Processing articles from: {csv_path}")
    
    # Process articles
    retriever.process_article_list(csv_path)
    
    # Save results
    retriever.save_results()
    
    print("\n" + "="*80)
    print("RETRIEVAL COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()