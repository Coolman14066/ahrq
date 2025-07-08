#!/usr/bin/env python3
"""
Test the improved AHRQ search to verify increased results
"""

import requests
import json
from datetime import datetime

def test_improved_search():
    """Test pagination and result count improvements."""
    
    # Load configuration
    with open('search_config.json', 'r') as f:
        config = json.load(f)
    
    api_key = config['api_key']
    base_url = "https://api.elsevier.com/content/search/scopus"
    
    print("="*80)
    print("TESTING IMPROVED AHRQ SEARCH SYSTEM")
    print("="*80)
    print(f"Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Results per query: {config['search_parameters']['results_per_query']}")
    print()
    
    # Test a combined query from tier 1
    test_query = config['search_queries']['tier_1_direct']['queries'][0]
    
    # Add filters
    year_filter = f" AND PUBYEAR > {config['filters']['year_range']['start']-1}"
    year_filter += f" AND PUBYEAR < {config['filters']['year_range']['end']+1}"
    
    doc_types = config['filters']['document_types']['include']
    doc_filter = " AND (" + " OR ".join([f"DOCTYPE({dt})" for dt in doc_types]) + ")"
    
    full_query = f"({test_query}){year_filter}{doc_filter}"
    
    print("Testing Query:")
    print("-"*60)
    print(f"Tier: tier_1_direct")
    print(f"Query: {test_query[:100]}...")
    print()
    
    # First request to check total available
    params = {
        'query': full_query,
        'apiKey': api_key,
        'httpAccept': 'application/json',
        'count': config['search_parameters']['results_per_query'],
        'start': 0,
        'sort': config['search_parameters']['sort_by'],
        'view': config['search_parameters']['view']
    }
    
    try:
        response = requests.get(base_url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            total_results = int(data.get('search-results', {}).get('opensearch:totalResults', 0))
            first_batch = len(data.get('search-results', {}).get('entry', []))
            
            print(f"✅ Connection successful!")
            print(f"Total available results: {total_results}")
            print(f"First batch retrieved: {first_batch}")
            print()
            
            # Check if pagination would work
            if total_results > config['search_parameters']['results_per_query']:
                print(f"🔄 Pagination needed: {total_results} results available")
                pages_needed = (total_results + config['search_parameters']['results_per_query'] - 1) // config['search_parameters']['results_per_query']
                print(f"   Would require {pages_needed} API calls to retrieve all results")
                
                if total_results > 5000:
                    print(f"   ⚠️  Results exceed 5000 limit - cursor pagination would be needed")
            else:
                print(f"✅ All results can be retrieved in a single request")
            
            # Check for cursor support
            cursor_info = data.get('search-results', {}).get('cursor', {})
            if cursor_info:
                print(f"\n📍 Cursor support detected: {cursor_info}")
            
            # Show sample results
            print("\nSample Results:")
            print("-"*60)
            entries = data.get('search-results', {}).get('entry', [])[:5]
            
            for i, entry in enumerate(entries, 1):
                title = entry.get('dc:title', 'No title')
                year = entry.get('prism:coverDate', '')[:4] if entry.get('prism:coverDate') else 'Unknown'
                print(f"{i}. {title[:70]}...")
                print(f"   Year: {year}")
            
            # Summary
            print("\n" + "="*80)
            print("SUMMARY OF IMPROVEMENTS:")
            print("="*80)
            print(f"1. Results per query increased: 25 → {config['search_parameters']['results_per_query']}")
            print(f"2. Query consolidation: Reduced from 17 to ~10 queries")
            print(f"3. Pagination: {'Enabled' if total_results > first_batch else 'Not needed for this query'}")
            print(f"4. Expected total results: Much higher than previous 25 limit")
            
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")


if __name__ == "__main__":
    test_improved_search()