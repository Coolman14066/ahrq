#!/usr/bin/env python3
"""
Analyze ahrq_check.csv to understand the data structure and DOI distribution
"""

import csv
import re
from collections import Counter
from urllib.parse import urlparse

def analyze_csv(file_path):
    """Analyze the ahrq_check.csv file"""
    
    stats = {
        'total_rows': 0,
        'rows_with_doi': 0,
        'rows_with_authors': 0,
        'unique_dois': set(),
        'doi_formats': Counter(),
        'author_formats': Counter(),
        'missing_dois': [],
        'existing_authors': []
    }
    
    # DOI pattern
    doi_pattern = re.compile(r'10\.\d{4,}(?:\.\d+)*\/[-._;()\/:a-zA-Z0-9]+')
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for idx, row in enumerate(reader):
            stats['total_rows'] += 1
            
            # Check DOI
            doi_url = row.get('DOI_URL', '').strip()
            if doi_url:
                stats['rows_with_doi'] += 1
                
                # Extract DOI from URL
                if doi_url.startswith('http'):
                    # Parse URL
                    parsed = urlparse(doi_url)
                    path = parsed.path
                    
                    # Try to extract DOI from path
                    doi_match = doi_pattern.search(path)
                    if doi_match:
                        doi = doi_match.group()
                        stats['unique_dois'].add(doi)
                        stats['doi_formats']['url_format'] += 1
                    else:
                        stats['doi_formats']['url_no_doi'] += 1
                elif doi_pattern.match(doi_url):
                    # Direct DOI format
                    stats['unique_dois'].add(doi_url)
                    stats['doi_formats']['direct_doi'] += 1
                else:
                    stats['doi_formats']['unknown_format'] += 1
            else:
                stats['missing_dois'].append({
                    'row': idx + 2,  # +2 for header and 0-index
                    'title': row.get('Title', 'Unknown')[:50]
                })
            
            # Check existing authors
            authors = row.get('Authors_Standardized', '').strip()
            if authors:
                stats['rows_with_authors'] += 1
                
                # Analyze author format
                if '[+ others]' in authors:
                    stats['author_formats']['with_et_al'] += 1
                if ';' in authors:
                    stats['author_formats']['semicolon_separated'] += 1
                if ',' in authors:
                    stats['author_formats']['comma_in_names'] += 1
                
                stats['existing_authors'].append({
                    'row': idx + 2,
                    'authors': authors,
                    'doi': doi_url
                })
    
    return stats

def print_analysis(stats):
    """Print analysis results"""
    
    print("=== AHRQ_CHECK.CSV ANALYSIS ===\n")
    
    print(f"Total rows: {stats['total_rows']}")
    print(f"Rows with DOI: {stats['rows_with_doi']}")
    print(f"Rows with existing authors: {stats['rows_with_authors']}")
    print(f"Unique DOIs found: {len(stats['unique_dois'])}")
    
    print("\n=== DOI Format Distribution ===")
    for format_type, count in stats['doi_formats'].items():
        print(f"  {format_type}: {count}")
    
    print("\n=== Author Format Analysis ===")
    for format_type, count in stats['author_formats'].items():
        print(f"  {format_type}: {count}")
    
    print(f"\n=== Missing DOIs ===")
    print(f"Total rows without DOI: {len(stats['missing_dois'])}")
    if stats['missing_dois'][:5]:
        print("First 5 rows without DOI:")
        for item in stats['missing_dois'][:5]:
            print(f"  Row {item['row']}: {item['title']}")
    
    print(f"\n=== Existing Author Data ===")
    print(f"Rows that already have author data: {len(stats['existing_authors'])}")
    if stats['existing_authors'][:3]:
        print("Sample of existing author data:")
        for item in stats['existing_authors'][:3]:
            print(f"  Row {item['row']}: {item['authors'][:60]}...")
    
    print("\n=== Summary ===")
    print(f"DOIs to process: {len(stats['unique_dois'])}")
    print(f"Rows needing author extraction: {stats['total_rows'] - stats['rows_with_authors']}")
    print(f"Success rate potential: {stats['rows_with_doi'] / stats['total_rows'] * 100:.1f}%")

if __name__ == "__main__":
    file_path = "/mnt/c/Users/pedro/OneDrive/Desktop/Apps/Bond Attempt/herewegoagain/public/ahrq_check.csv"
    
    print("Analyzing ahrq_check.csv...")
    stats = analyze_csv(file_path)
    print_analysis(stats)
    
    # Save unique DOIs for processing
    with open('unique_dois.txt', 'w') as f:
        for doi in sorted(stats['unique_dois']):
            f.write(f"{doi}\n")
    
    print(f"\nUnique DOIs saved to unique_dois.txt")