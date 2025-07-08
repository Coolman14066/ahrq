#!/usr/bin/env python3
"""
Test author extraction with sample DOIs from ahrq_check.csv
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from multi_source_author_extractor import MultiSourceAuthorExtractor
import csv
import json

def test_single_doi():
    """Test extraction with a single DOI"""
    print("=== Testing Single DOI Extraction ===\n")
    
    extractor = MultiSourceAuthorExtractor()
    
    # Test with a known DOI from the dataset
    test_doi = "10.1001/jama.2020.13136"
    
    print(f"Testing DOI: {test_doi}")
    print("-" * 50)
    
    # Test each source individually
    sources = [
        ('CrossRef', extractor.extract_from_crossref),
        ('OpenAlex', extractor.extract_from_openalex),
        ('Semantic Scholar', extractor.extract_from_semantic_scholar),
        ('Scopus', extractor.extract_from_scopus)
    ]
    
    for source_name, method in sources:
        print(f"\n{source_name}:")
        try:
            result = method(test_doi)
            if result:
                print(f"  Success! Found {len(result['authors'])} authors")
                print(f"  Authors: {'; '.join(result['authors'][:3])}{'...' if len(result['authors']) > 3 else ''}")
                print(f"  Confidence: {result['confidence']}%")
            else:
                print("  No results found")
        except Exception as e:
            print(f"  Error: {str(e)}")

def test_sample_dois():
    """Test with sample DOIs from the dataset"""
    print("\n\n=== Testing Sample DOIs from Dataset ===\n")
    
    # Read some sample DOIs that need extraction
    sample_dois = []
    with open('rows_needing_authors.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= 5:  # Test first 5
                break
            sample_dois.append({
                'row': row['row'],
                'doi': row['doi'],
                'title': row['title'],
                'current_authors': row['current_authors']
            })
    
    extractor = MultiSourceAuthorExtractor()
    results = []
    
    for item in sample_dois:
        print(f"\nRow {item['row']}: {item['title'][:50]}...")
        print(f"Current authors: {item['current_authors']}")
        print(f"DOI URL: {item['doi']}")
        
        # Extract DOI from URL
        import re
        doi_pattern = re.compile(r'10\.\d{4,}(?:\.\d+)*\/[-._;()\/:a-zA-Z0-9]+')
        doi_match = doi_pattern.search(item['doi'])
        
        if doi_match:
            doi = doi_match.group()
            print(f"Extracted DOI: {doi}")
            
            # Try all sources
            all_results = extractor.extract_all_sources(doi)
            
            if all_results['best_result']:
                best = all_results['best_result']
                print(f"✓ Success! Source: {best['source']}")
                print(f"  Found {len(best['authors'])} authors")
                print(f"  Full author list: {'; '.join(best['authors'])}")
                
                results.append({
                    'row': item['row'],
                    'doi': doi,
                    'title': item['title'],
                    'original_authors': item['current_authors'],
                    'extracted_authors': '; '.join(best['authors']),
                    'source': best['source'],
                    'confidence': best['confidence']
                })
            else:
                print("✗ Failed to extract authors from any source")
        else:
            print("✗ Could not extract valid DOI from URL")
    
    # Save test results
    if results:
        with open('test_extraction_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\n\nTest results saved to test_extraction_results.json")
        print(f"Successfully extracted authors for {len(results)}/{len(sample_dois)} DOIs")

def test_performance():
    """Test extraction performance and API response times"""
    print("\n\n=== Testing Performance ===\n")
    
    import time
    
    extractor = MultiSourceAuthorExtractor()
    test_doi = "10.1001/jama.2020.13136"
    
    sources = [
        ('CrossRef', extractor.extract_from_crossref),
        ('OpenAlex', extractor.extract_from_openalex),
        ('Semantic Scholar', extractor.extract_from_semantic_scholar),
        ('Scopus', extractor.extract_from_scopus)
    ]
    
    for source_name, method in sources:
        start_time = time.time()
        try:
            result = method(test_doi)
            elapsed = time.time() - start_time
            status = "Success" if result else "No data"
        except Exception as e:
            elapsed = time.time() - start_time
            status = f"Error: {str(e)[:30]}"
        
        print(f"{source_name:20} {elapsed:6.2f}s  {status}")

if __name__ == "__main__":
    print("AHRQ Author Extraction Test Suite")
    print("=" * 60)
    
    # Run tests
    test_single_doi()
    test_sample_dois()
    test_performance()