#!/usr/bin/env python3
"""
Analyze AHRQ reference CSV to identify patterns for search strategies
"""

import csv
from collections import Counter
import re

def analyze_ahrq_reference():
    csv_path = '/mnt/c/Users/pedro/OneDrive/Desktop/Apps/Bond Attempt/herewegoagain/ahrq_project/02_data_sources/ahrq_reference.csv'
    
    # Initialize counters
    journal_counter = Counter()
    author_counter = Counter()
    keyword_counter = Counter()
    usage_type_counter = Counter()
    domain_counter = Counter()
    citation_phrases = []
    
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Count journals
            journal = row.get('Journal_Venue', '').strip()
            if journal:
                journal_counter[journal] += 1
            
            # Count usage types
            usage_type = row.get('Usage_Type', '').strip()
            if usage_type:
                usage_type_counter[usage_type] += 1
                
            # Count research domains
            domain = row.get('Research_Domain', '').strip()
            if domain:
                domain_counter[domain] += 1
            
            # Extract individual authors
            authors = row.get('Authors_Standardized', '').strip()
            if authors:
                # Simple split on semicolon or "and"
                author_list = re.split(r'[;,]|\sand\s', authors)
                for author in author_list:
                    author = author.strip().strip('[').strip(']')
                    if author and author != '+ others' and len(author) > 3:
                        author_counter[author] += 1
            
            # Analyze usage descriptions for citation patterns
            usage_desc = row.get('Usage_Description', '')
            if usage_desc:
                citation_phrases.append(usage_desc)
                # Extract keywords from usage description
                words = re.findall(r'\b[a-zA-Z]{4,}\b', usage_desc.lower())
                for word in words:
                    if word not in ['ahrq', 'used', 'data', 'from', 'with', 'that', 'this', 'were', 'which']:
                        keyword_counter[word] += 1
    
    # Print results
    print("=== TOP JOURNALS PUBLISHING AHRQ COMPENDIUM CITATIONS ===")
    for journal, count in journal_counter.most_common(15):
        print(f"{count:3d} - {journal}")
    
    print("\n=== TOP AUTHORS USING AHRQ COMPENDIUM ===")
    for author, count in author_counter.most_common(20):
        if count > 1:  # Only show authors appearing multiple times
            print(f"{count:3d} - {author}")
    
    print("\n=== USAGE TYPE DISTRIBUTION ===")
    for usage_type, count in usage_type_counter.most_common():
        print(f"{count:3d} - {usage_type}")
        
    print("\n=== RESEARCH DOMAIN DISTRIBUTION ===")
    for domain, count in domain_counter.most_common():
        print(f"{count:3d} - {domain}")
    
    print("\n=== COMMON KEYWORDS IN USAGE DESCRIPTIONS ===")
    for keyword, count in keyword_counter.most_common(30):
        if count > 5:  # Only show frequent keywords
            print(f"{count:3d} - {keyword}")
    
    print("\n=== COMMON CITATION PHRASES ===")
    # Look for patterns in how AHRQ is cited
    citation_patterns = {
        'compendium': 0,
        'health system': 0,
        'hospital': 0,
        'physician': 0,
        'affiliation': 0,
        'consolidation': 0,
        'merger': 0,
        'vertical integration': 0,
        'linkage file': 0,
        'identify': 0,
        'define': 0,
        'characterize': 0
    }
    
    for phrase in citation_phrases:
        phrase_lower = phrase.lower()
        for pattern in citation_patterns:
            if pattern in phrase_lower:
                citation_patterns[pattern] += 1
    
    print("\nFrequency of key terms in citation descriptions:")
    for pattern, count in sorted(citation_patterns.items(), key=lambda x: x[1], reverse=True):
        print(f"{count:3d} - {pattern}")

if __name__ == "__main__":
    analyze_ahrq_reference()