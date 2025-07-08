#!/usr/bin/env python3
"""
Debug script to understand why searches are returning 0 results
"""

import requests
import json
from pprint import pprint

def debug_search():
    """Debug a simple search to see what's being returned."""
    
    api_key = "7cb67bc87041113e16b3604ec1d33cd6"
    base_url = "https://api.elsevier.com/content/search/scopus"
    
    # Simple query that should return results
    query = 'TITLE-ABS-KEY("AHRQ Compendium") AND PUBYEAR > 2020 AND PUBYEAR < 2026'
    
    params = {
        'query': query,
        'apiKey': api_key,
        'httpAccept': 'application/json',
        'count': 10,
        'view': 'STANDARD'
    }
    
    print(f"Query: {query}")
    print(f"URL: {base_url}")
    print(f"Params: {params}\n")
    
    try:
        response = requests.get(base_url, params=params, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}\n")
        
        if response.status_code == 200:
            data = response.json()
            
            # Print the structure
            print("Response Structure:")
            print(f"Keys: {list(data.keys())}")
            
            if 'search-results' in data:
                search_results = data['search-results']
                print(f"\nSearch Results Keys: {list(search_results.keys())}")
                print(f"Total Results: {search_results.get('opensearch:totalResults', 'N/A')}")
                print(f"Items Per Page: {search_results.get('opensearch:itemsPerPage', 'N/A')}")
                
                entries = search_results.get('entry', [])
                print(f"\nNumber of entries: {len(entries)}")
                
                if entries:
                    print("\nFirst entry structure:")
                    print(f"Keys: {list(entries[0].keys())}")
                    
                    # Print first entry details
                    print("\nFirst entry details:")
                    entry = entries[0]
                    print(f"EID: {entry.get('eid', 'N/A')}")
                    print(f"Title: {entry.get('dc:title', 'N/A')}")
                    print(f"DOI: {entry.get('prism:doi', 'N/A')}")
                    print(f"Year: {entry.get('prism:coverDate', 'N/A')[:4] if entry.get('prism:coverDate') else 'N/A'}")
                    
                    # Check for error messages
                    if 'error' in entry:
                        print(f"\nERROR IN ENTRY: {entry['error']}")
                        
            # Save full response for inspection
            with open('debug_response.json', 'w') as f:
                json.dump(data, f, indent=2)
            print("\nFull response saved to debug_response.json")
            
        else:
            print(f"Error Response: {response.text}")
            
    except Exception as e:
        print(f"Exception: {type(e).__name__}: {e}")

if __name__ == "__main__":
    debug_search()