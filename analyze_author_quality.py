#!/usr/bin/env python3
"""
Analyze the quality of existing author data in ahrq_check.csv
"""

import csv
import re

def analyze_author_quality(file_path):
    """Analyze the quality and completeness of author data"""
    
    issues = {
        'abbreviated': [],  # Has [+ others] or et al.
        'single_author': [],  # Only one author listed
        'bracket_format': [],  # Uses brackets for listing
        'needs_validation': [],  # Potentially incomplete or incorrect
        'good_format': []  # Appears complete with proper formatting
    }
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for idx, row in enumerate(reader):
            row_num = idx + 2
            authors = row.get('Authors_Standardized', '').strip()
            doi = row.get('DOI_URL', '').strip()
            title = row.get('Title', '')[:50]
            
            # Check for abbreviated author lists
            if '[+ others]' in authors or 'et al' in authors.lower():
                issues['abbreviated'].append({
                    'row': row_num,
                    'authors': authors,
                    'doi': doi,
                    'title': title
                })
            
            # Check for single author
            elif ';' not in authors and authors.count('.') <= 2:
                issues['single_author'].append({
                    'row': row_num,
                    'authors': authors,
                    'doi': doi,
                    'title': title
                })
            
            # Check for bracket format (full list in brackets)
            elif authors.startswith('[') and authors.endswith(']'):
                issues['bracket_format'].append({
                    'row': row_num,
                    'authors': authors,
                    'doi': doi,
                    'title': title
                })
            
            # Check for other potential issues
            elif len(authors) < 10 or authors.count(';') == 0:
                issues['needs_validation'].append({
                    'row': row_num,
                    'authors': authors,
                    'doi': doi,
                    'title': title
                })
            
            else:
                issues['good_format'].append({
                    'row': row_num,
                    'authors': authors[:50] + '...' if len(authors) > 50 else authors
                })
    
    return issues

def print_quality_report(issues):
    """Print quality analysis report"""
    
    print("=== AUTHOR DATA QUALITY ANALYSIS ===\n")
    
    total_rows = sum(len(v) for v in issues.values())
    
    print(f"Total rows analyzed: {total_rows}")
    print(f"\n=== Issue Categories ===")
    print(f"Abbreviated (has '[+ others]'): {len(issues['abbreviated'])}")
    print(f"Single author only: {len(issues['single_author'])}")
    print(f"Bracket format: {len(issues['bracket_format'])}")
    print(f"Needs validation: {len(issues['needs_validation'])}")
    print(f"Good format: {len(issues['good_format'])}")
    
    print(f"\n=== Rows Needing Full Author Extraction ===")
    rows_needing_extraction = len(issues['abbreviated'])
    print(f"Total: {rows_needing_extraction} rows")
    
    if issues['abbreviated']:
        print("\nSample of abbreviated entries:")
        for item in issues['abbreviated'][:5]:
            print(f"  Row {item['row']}: {item['authors']}")
            print(f"    Title: {item['title']}")
            print(f"    DOI: {item['doi']}\n")
    
    print(f"\n=== Action Required ===")
    print(f"1. Extract full author lists for {len(issues['abbreviated'])} abbreviated entries")
    print(f"2. Validate {len(issues['single_author'])} single-author entries")
    print(f"3. Standardize {len(issues['bracket_format'])} bracket-format entries")
    print(f"4. Review {len(issues['needs_validation'])} entries needing validation")
    
    # Save rows needing extraction
    with open('rows_needing_authors.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['row', 'current_authors', 'doi', 'title'])
        
        for item in issues['abbreviated']:
            writer.writerow([item['row'], item['authors'], item['doi'], item['title']])
    
    print(f"\nRows needing author extraction saved to: rows_needing_authors.csv")

if __name__ == "__main__":
    file_path = "/mnt/c/Users/pedro/OneDrive/Desktop/Apps/Bond Attempt/herewegoagain/public/ahrq_check.csv"
    
    print("Analyzing author data quality...")
    issues = analyze_author_quality(file_path)
    print_quality_report(issues)