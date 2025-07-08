#!/usr/bin/env python3
"""
Test a single AHRQ search query to validate approach
"""

import requests
import json
from urllib.parse import quote

def test_query():
    """Test a single focused query."""
    api_key = "7cb67bc87041113e16b3604ec1d33cd6"
    base_url = "https://api.elsevier.com/content/search/scopus"
    
    # Test query - exact phrase
    query = 'TITLE-ABS-KEY("AHRQ Compendium") AND PUBYEAR > 2020'
    
    params = {
        'query': query,
        'apiKey': api_key,
        'httpAccept': 'application/json',
        'count': 25,
        'view': 'STANDARD'
    }
    
    print("="*60)
    print("TESTING SINGLE AHRQ QUERY")
    print("="*60)
    print(f"Query: {query}")
    print("\nSending request...")
    
    try:
        response = requests.get(base_url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            total_results = data.get('search-results', {}).get('opensearch:totalResults', 0)
            entries = data.get('search-results', {}).get('entry', [])
            
            print(f"\n✅ Success! Found {total_results} total results")
            print(f"Showing first {len(entries)} results:\n")
            
            for i, entry in enumerate(entries, 1):
                title = entry.get('dc:title', 'No title')
                year = entry.get('prism:coverDate', '')[:4] if entry.get('prism:coverDate') else 'Unknown'
                journal = entry.get('prism:publicationName', 'Unknown journal')
                doi = entry.get('prism:doi', 'No DOI')
                
                print(f"{i}. {title[:80]}...")
                print(f"   Year: {year} | Journal: {journal}")
                print(f"   DOI: {doi}")
                
                # Check abstract for AHRQ mentions
                abstract = entry.get('dc:description', '').lower()
                if 'ahrq' in abstract or 'compendium' in abstract:
                    print(f"   ✓ Contains AHRQ/Compendium in abstract")
                print()
            
        else:
            print(f"\n❌ Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Request failed: {e}")


if __name__ == "__main__":
    test_query()