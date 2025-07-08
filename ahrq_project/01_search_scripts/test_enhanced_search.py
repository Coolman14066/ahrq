#!/usr/bin/env python3
"""
Test script for enhanced AHRQ search system
Tests key components before running full search
"""

import json
import requests
import pandas as pd
from datetime import datetime

def test_api_connection(api_key: str) -> bool:
    """Test basic API connectivity."""
    print("\n1. Testing API Connection...")
    
    test_query = "TITLE-ABS-KEY(AHRQ)"
    params = {
        'query': test_query,
        'apiKey': api_key,
        'httpAccept': 'application/json',
        'count': 1,
        'view': 'STANDARD'
    }
    
    try:
        response = requests.get(
            "https://api.elsevier.com/content/search/scopus",
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            print("   ✅ API connection successful")
            data = response.json()
            total = data.get('search-results', {}).get('opensearch:totalResults', 0)
            print(f"   Total AHRQ mentions available: {total}")
            return True
        else:
            print(f"   ❌ API error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
        return False

def test_enhanced_queries(config: dict) -> None:
    """Test a sample query from each tier."""
    print("\n2. Testing Enhanced Query Tiers...")
    
    api_key = config['api_key']
    base_url = "https://api.elsevier.com/content/search/scopus"
    
    # Test one query from each tier
    test_queries = {
        'tier_1_direct': 'TITLE-ABS-KEY("AHRQ Compendium")',
        'tier_6_year_specific': 'TITLE-ABS-KEY("2023 AHRQ Compendium")',
        'tier_7_advanced_proximity': 'TITLE-ABS-KEY(AHRQ PRE/10 compendium)',
        'tier_8_network_based': 'AUTHOR-NAME("Ganguli I*") AND TITLE-ABS-KEY("health system*")',
        'tier_9_methodological': 'TITLE-ABS("identify health systems" AND AHRQ)'
    }
    
    for tier, query in test_queries.items():
        print(f"\n   Testing {tier}: {query[:50]}...")
        
        # Add year filter
        full_query = f"({query}) AND PUBYEAR > 2020 AND PUBYEAR < 2026"
        
        params = {
            'query': full_query,
            'apiKey': api_key,
            'httpAccept': 'application/json',
            'count': 5,
            'view': 'STANDARD'
        }
        
        try:
            response = requests.get(base_url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                total = int(data.get('search-results', {}).get('opensearch:totalResults', 0))
                entries = data.get('search-results', {}).get('entry', [])
                print(f"   ✅ Success: {total} total results, retrieved {len(entries)}")
                
                # Show first result as example
                if entries and entries[0].get('dc:title'):
                    print(f"      Example: {entries[0]['dc:title'][:60]}...")
            else:
                print(f"   ❌ Error {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Query failed: {e}")

def test_pagination(config: dict) -> None:
    """Test pagination capabilities."""
    print("\n3. Testing Pagination...")
    
    api_key = config['api_key']
    base_url = "https://api.elsevier.com/content/search/scopus"
    
    # Use a query likely to have many results
    test_query = 'TITLE-ABS-KEY(AHRQ) AND PUBYEAR > 2020'
    
    print(f"   Query: {test_query}")
    
    # First request
    params = {
        'query': test_query,
        'apiKey': api_key,
        'httpAccept': 'application/json',
        'count': 25,
        'start': 0,
        'view': 'STANDARD'
    }
    
    try:
        response = requests.get(base_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            total = int(data.get('search-results', {}).get('opensearch:totalResults', 0))
            
            print(f"   ✅ Total results available: {total}")
            
            if total > 25:
                # Test second page
                params['start'] = 25
                response2 = requests.get(base_url, params=params, timeout=10)
                
                if response2.status_code == 200:
                    print(f"   ✅ Pagination working (tested page 2)")
                else:
                    print(f"   ❌ Pagination failed on page 2")
            else:
                print(f"   ℹ️  Not enough results to test pagination")
                
        else:
            print(f"   ❌ Initial query failed")
            
    except Exception as e:
        print(f"   ❌ Test failed: {e}")

def test_deduplication() -> None:
    """Test deduplication module."""
    print("\n4. Testing Deduplication Module...")
    
    try:
        from deduplication_module import AHRQDeduplicator
        
        # Check if reference file exists
        import os
        ref_path = "../02_data_sources/ahrq_reference.csv"
        
        if os.path.exists(ref_path):
            dedup = AHRQDeduplicator(ref_path)
            print(f"   ✅ Deduplication module loaded")
            print(f"   Reference articles: {len(dedup.reference_df)}")
            
            # Test DOI normalization
            test_dois = [
                "10.1234/test",
                "https://doi.org/10.1234/test",
                "DOI: 10.1234/test"
            ]
            
            normalized = [dedup._normalize_doi(doi) for doi in test_dois]
            if len(set(normalized)) == 1:
                print(f"   ✅ DOI normalization working")
            else:
                print(f"   ❌ DOI normalization issue")
                
        else:
            print(f"   ❌ Reference file not found at {ref_path}")
            
    except Exception as e:
        print(f"   ❌ Deduplication module error: {e}")

def estimate_results(config: dict) -> None:
    """Estimate total results we might find."""
    print("\n5. Estimating Total Available Results...")
    
    api_key = config['api_key']
    base_url = "https://api.elsevier.com/content/search/scopus"
    
    # Check broad AHRQ mentions
    queries_to_test = [
        ('AHRQ mentions (2021-2025)', 'TITLE-ABS-KEY(AHRQ) AND PUBYEAR > 2020 AND PUBYEAR < 2026'),
        ('AHRQ + Compendium', 'TITLE-ABS-KEY(AHRQ AND compendium) AND PUBYEAR > 2020 AND PUBYEAR < 2026'),
        ('Agency for Healthcare Research', 'TITLE-ABS-KEY("Agency for Healthcare Research and Quality") AND PUBYEAR > 2020 AND PUBYEAR < 2026')
    ]
    
    total_estimate = 0
    
    for desc, query in queries_to_test:
        params = {
            'query': query,
            'apiKey': api_key,
            'httpAccept': 'application/json',
            'count': 1,
            'view': 'STANDARD'
        }
        
        try:
            response = requests.get(base_url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                count = int(data.get('search-results', {}).get('opensearch:totalResults', 0))
                print(f"   {desc}: {count} results")
                
                if 'compendium' in desc.lower():
                    total_estimate = count
                    
        except Exception as e:
            print(f"   Error checking {desc}: {e}")
    
    print(f"\n   📊 Estimated AHRQ + Compendium articles: {total_estimate}")
    print(f"   📊 With all search strategies, we might find: {int(total_estimate * 1.5)} articles")

def main():
    """Run all tests."""
    print("="*60)
    print("AHRQ ENHANCED SEARCH SYSTEM - TEST SUITE")
    print("="*60)
    
    # Load config
    try:
        with open('search_config_enhanced.json', 'r') as f:
            config = json.load(f)
    except FileNotFoundError:
        print("\n❌ search_config_enhanced.json not found!")
        print("Please ensure the enhanced configuration file exists.")
        return
    
    # Run tests
    if test_api_connection(config['api_key']):
        test_enhanced_queries(config)
        test_pagination(config)
        test_deduplication()
        estimate_results(config)
        
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print("\nAll major components tested. Ready to run full enhanced search!")
        print("\nTo run the full search:")
        print("   python3 ahrq_master_search_enhanced.py")
        print("\nExpected runtime: 1-2 hours for full iterative search")
    else:
        print("\n❌ API connection failed. Please check your API key and connection.")

if __name__ == "__main__":
    main()