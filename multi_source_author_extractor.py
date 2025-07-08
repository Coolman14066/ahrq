#!/usr/bin/env python3
"""
Multi-source author extraction using various academic APIs
Implements extraction methods for Scopus, CrossRef, OpenAlex, and Semantic Scholar
"""

import requests
import json
import time
import logging
from urllib.parse import quote
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

class MultiSourceAuthorExtractor:
    def __init__(self, scopus_api_key=None):
        self.scopus_api_key = scopus_api_key or '7cb67bc87041113e16b3604ec1d33cd6'
        
        # API endpoints
        self.endpoints = {
            'scopus_search': 'https://api.elsevier.com/content/search/scopus',
            'scopus_abstract': 'https://api.elsevier.com/content/abstract/doi/',
            'crossref': 'https://api.crossref.org/works/',
            'openalex': 'https://api.openalex.org/works/doi:',
            'semantic_scholar': 'https://api.semanticscholar.org/v1/paper/'
        }
        
        # Request headers
        self.headers = {
            'scopus': {
                'X-ELS-APIKey': self.scopus_api_key,
                'Accept': 'application/json'
            },
            'crossref': {
                'User-Agent': 'AHRQ-Research/1.0 (mailto:research@ahrq.gov)'
            },
            'default': {
                'User-Agent': 'AHRQ-Author-Extractor/1.0'
            }
        }
    
    def extract_from_scopus(self, doi: str) -> Optional[Dict]:
        """Extract authors using Scopus API"""
        try:
            # First, search for the document to get EID
            search_url = self.endpoints['scopus_search']
            params = {
                'query': f'DOI({doi})',
                'field': 'eid,title,author,affilname,authid,authname,given-name,surname'
            }
            
            response = requests.get(
                search_url,
                params=params,
                headers=self.headers['scopus'],
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                entries = data.get('search-results', {}).get('entry', [])
                
                if entries and len(entries) > 0:
                    entry = entries[0]
                    authors = []
                    
                    # Extract author information
                    if 'author' in entry:
                        for author in entry['author']:
                            author_name = author.get('authname', '')
                            given_name = author.get('given-name', '')
                            surname = author.get('surname', '')
                            
                            # Prefer full name construction
                            if surname and given_name:
                                full_name = f"{surname}, {given_name}"
                            elif author_name:
                                full_name = author_name
                            else:
                                continue
                            
                            authors.append(full_name)
                    
                    if authors:
                        return {
                            'authors': authors,
                            'confidence': 95,  # Scopus is highly reliable
                            'source': 'scopus',
                            'metadata': {
                                'title': entry.get('dc:title', ''),
                                'eid': entry.get('eid', '')
                            }
                        }
            
            # If search fails, try abstract retrieval API
            abstract_url = f"{self.endpoints['scopus_abstract']}{doi}"
            response = requests.get(
                abstract_url,
                headers=self.headers['scopus'],
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                authors = self._parse_scopus_abstract_authors(data)
                if authors:
                    return {
                        'authors': authors,
                        'confidence': 95,
                        'source': 'scopus_abstract'
                    }
            
        except Exception as e:
            logger.error(f"Scopus extraction error for DOI {doi}: {str(e)}")
        
        return None
    
    def _parse_scopus_abstract_authors(self, data: Dict) -> List[str]:
        """Parse authors from Scopus abstract retrieval response"""
        authors = []
        
        try:
            # Navigate through the response structure
            coredata = data.get('abstracts-retrieval-response', {}).get('coredata', {})
            author_group = data.get('abstracts-retrieval-response', {}).get('authors', {})
            
            if 'author' in author_group:
                for author in author_group['author']:
                    given_name = author.get('given-name', '')
                    surname = author.get('surname', '')
                    
                    if surname:
                        if given_name:
                            authors.append(f"{surname}, {given_name}")
                        else:
                            authors.append(surname)
        except:
            pass
        
        return authors
    
    def extract_from_crossref(self, doi: str) -> Optional[Dict]:
        """Extract authors using CrossRef API"""
        try:
            url = f"{self.endpoints['crossref']}{doi}"
            response = requests.get(
                url,
                headers=self.headers['crossref'],
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', {})
                authors = []
                
                for author in message.get('author', []):
                    given = author.get('given', '')
                    family = author.get('family', '')
                    
                    if family:
                        if given:
                            authors.append(f"{family}, {given}")
                        else:
                            authors.append(family)
                
                if authors:
                    return {
                        'authors': authors,
                        'confidence': 90,  # CrossRef is reliable
                        'source': 'crossref',
                        'metadata': {
                            'title': message.get('title', [''])[0],
                            'published': message.get('published-print', {}).get('date-parts', [[]])[0]
                        }
                    }
            
        except Exception as e:
            logger.error(f"CrossRef extraction error for DOI {doi}: {str(e)}")
        
        return None
    
    def extract_from_openalex(self, doi: str) -> Optional[Dict]:
        """Extract authors using OpenAlex API"""
        try:
            url = f"{self.endpoints['openalex']}{doi}"
            response = requests.get(
                url,
                headers=self.headers['default'],
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                authors = []
                
                for authorship in data.get('authorships', []):
                    author = authorship.get('author', {})
                    display_name = author.get('display_name', '')
                    
                    if display_name:
                        authors.append(display_name)
                
                if authors:
                    return {
                        'authors': authors,
                        'confidence': 85,  # OpenAlex is good but newer
                        'source': 'openalex',
                        'metadata': {
                            'title': data.get('title', ''),
                            'publication_year': data.get('publication_year'),
                            'open_access': data.get('open_access', {}).get('is_oa', False)
                        }
                    }
            
        except Exception as e:
            logger.error(f"OpenAlex extraction error for DOI {doi}: {str(e)}")
        
        return None
    
    def extract_from_semantic_scholar(self, doi: str) -> Optional[Dict]:
        """Extract authors using Semantic Scholar API"""
        try:
            # Semantic Scholar uses different formats
            url = f"{self.endpoints['semantic_scholar']}{doi}"
            response = requests.get(
                url,
                headers=self.headers['default'],
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                authors = []
                
                for author in data.get('authors', []):
                    name = author.get('name', '')
                    if name:
                        authors.append(name)
                
                if authors:
                    return {
                        'authors': authors,
                        'confidence': 80,  # Good for CS papers
                        'source': 'semantic_scholar',
                        'metadata': {
                            'title': data.get('title', ''),
                            'year': data.get('year'),
                            'paper_id': data.get('paperId')
                        }
                    }
            
        except Exception as e:
            logger.error(f"Semantic Scholar extraction error for DOI {doi}: {str(e)}")
        
        return None
    
    def extract_all_sources(self, doi: str) -> Dict:
        """Try all sources and return combined results"""
        results = {
            'doi': doi,
            'sources_tried': [],
            'successful_sources': [],
            'all_authors': {},
            'best_result': None
        }
        
        # Define extraction methods in priority order
        methods = [
            ('scopus', self.extract_from_scopus),
            ('crossref', self.extract_from_crossref),
            ('openalex', self.extract_from_openalex),
            ('semantic_scholar', self.extract_from_semantic_scholar)
        ]
        
        for source_name, method in methods:
            results['sources_tried'].append(source_name)
            
            try:
                result = method(doi)
                if result and result.get('authors'):
                    results['successful_sources'].append(source_name)
                    results['all_authors'][source_name] = result
                    
                    # Use first successful result as best
                    if not results['best_result']:
                        results['best_result'] = result
                    
                    # If we have high confidence result, we can stop
                    if result.get('confidence', 0) >= 90:
                        break
                        
            except Exception as e:
                logger.error(f"Error in {source_name}: {str(e)}")
            
            # Rate limiting between API calls
            time.sleep(0.5)
        
        return results

def format_author_list(authors: List[str], separator: str = '; ') -> str:
    """Format author list with specified separator"""
    return separator.join(authors)

def standardize_author_name(name: str) -> str:
    """Standardize author name format"""
    # Remove extra spaces
    name = ' '.join(name.split())
    
    # Handle "Last, First" format
    if ',' in name:
        parts = name.split(',', 1)
        if len(parts) == 2:
            last = parts[0].strip()
            first = parts[1].strip()
            # Keep format as "Last, First"
            return f"{last}, {first}"
    
    return name

# Integration with master script
def enhance_master_extractor():
    """Enhance the master extractor with API methods"""
    import extract_authors_master
    
    extractor = MultiSourceAuthorExtractor()
    
    # Replace placeholder methods in master
    extract_authors_master.AuthorExtractionMaster.extract_from_scopus = lambda self, doi: extractor.extract_from_scopus(doi)
    extract_authors_master.AuthorExtractionMaster.extract_from_crossref = lambda self, doi: extractor.extract_from_crossref(doi)
    extract_authors_master.AuthorExtractionMaster.extract_from_openalex = lambda self, doi: extractor.extract_from_openalex(doi)
    extract_authors_master.AuthorExtractionMaster.extract_from_semantic_scholar = lambda self, doi: extractor.extract_from_semantic_scholar(doi)

if __name__ == "__main__":
    # Test with a sample DOI
    test_doi = "10.1001/jama.2020.13136"
    
    extractor = MultiSourceAuthorExtractor()
    
    print(f"Testing author extraction for DOI: {test_doi}\n")
    
    # Test individual sources
    print("=== Testing Scopus ===")
    result = extractor.extract_from_scopus(test_doi)
    if result:
        print(f"Authors: {result['authors']}")
        print(f"Confidence: {result['confidence']}%\n")
    
    print("=== Testing CrossRef ===")
    result = extractor.extract_from_crossref(test_doi)
    if result:
        print(f"Authors: {result['authors']}")
        print(f"Confidence: {result['confidence']}%\n")
    
    print("=== Testing All Sources ===")
    all_results = extractor.extract_all_sources(test_doi)
    print(f"Sources tried: {all_results['sources_tried']}")
    print(f"Successful sources: {all_results['successful_sources']}")
    
    if all_results['best_result']:
        print(f"\nBest result from {all_results['best_result']['source']}:")
        print(f"Authors: {format_author_list(all_results['best_result']['authors'])}")