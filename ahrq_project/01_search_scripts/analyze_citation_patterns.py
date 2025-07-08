#!/usr/bin/env python3
"""
Analyze Citation Patterns in AHRQ Reference CSV
Identify common patterns, variations, and opportunities for improved search strategies
"""

import pandas as pd
import re
from collections import Counter, defaultdict
from typing import List, Dict, Set, Tuple
import json

class CitationPatternAnalyzer:
    def __init__(self, csv_path: str):
        """Initialize with reference CSV path."""
        self.df = pd.read_csv(csv_path)
        self.patterns = defaultdict(list)
        self.variations = set()
        
    def extract_ahrq_mentions(self, text: str) -> List[str]:
        """Extract all AHRQ-related mentions from text."""
        if pd.isna(text):
            return []
        
        text = str(text)
        mentions = []
        
        # Patterns to search for
        patterns = [
            r'(\d{4}\s+)?AHRQ\s+Compendium',
            r'AHRQ\s+(?:Health\s+)?System\s+Compendi[au]m?',
            r'AHRQ.*?Hospital\s+Linkage\s+File',
            r'Agency\s+for\s+Healthcare.*?Compendium',
            r'AHRQ\s+Compendium\s+of\s+U\.?S\.?\s+Health\s+Systems',
            r'Compendium\s+of\s+U\.?S\.?\s+Health\s+Systems.*?AHRQ',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                mentions.append(match.group(0))
        
        return mentions
    
    def analyze_year_patterns(self):
        """Analyze year-specific citation patterns."""
        year_mentions = []
        
        for col in ['Usage_Description', 'Key_Findings', 'Usage_Justification']:
            for text in self.df[col]:
                mentions = self.extract_ahrq_mentions(text)
                for mention in mentions:
                    # Extract years
                    year_match = re.search(r'(\d{4})\s+AHRQ', mention)
                    if year_match:
                        year_mentions.append(year_match.group(1))
        
        year_counter = Counter(year_mentions)
        return dict(year_counter.most_common())
    
    def analyze_usage_types(self):
        """Analyze how AHRQ Compendium is used."""
        usage_patterns = defaultdict(list)
        
        for idx, row in self.df.iterrows():
            usage_type = row['Usage_Type']
            description = str(row['Usage_Description'])
            
            if usage_type and not pd.isna(usage_type):
                # Extract key phrases around AHRQ mentions
                if 'link' in description.lower():
                    usage_patterns[usage_type].append('linking hospitals to systems')
                if 'defin' in description.lower():
                    usage_patterns[usage_type].append('defining health systems')
                if 'identif' in description.lower():
                    usage_patterns[usage_type].append('identifying systems/hospitals')
                if 'affiliat' in description.lower():
                    usage_patterns[usage_type].append('determining affiliations')
                if 'character' in description.lower():
                    usage_patterns[usage_type].append('system characteristics')
        
        return dict(usage_patterns)
    
    def find_key_citing_papers(self):
        """Identify papers that are frequently cited alongside AHRQ Compendium."""
        citing_papers = []
        
        for idx, row in self.df.iterrows():
            # Look for specific influential papers
            description = str(row['Usage_Description']) + ' ' + str(row['Key_Findings'])
            
            if 'Contreary' in description:
                citing_papers.append({
                    'author': 'Contreary',
                    'year': row['Publication_Year'],
                    'journal': row['Journal_Venue'],
                    'title_snippet': row['Title'][:50]
                })
            
            if 'Furukawa' in description:
                citing_papers.append({
                    'author': 'Furukawa',
                    'year': row['Publication_Year'],
                    'journal': row['Journal_Venue'],
                    'title_snippet': row['Title'][:50]
                })
        
        return citing_papers
    
    def analyze_journal_patterns(self):
        """Analyze which journals frequently publish AHRQ Compendium citations."""
        journal_counter = Counter(self.df['Journal_Venue'].dropna())
        return dict(journal_counter.most_common(10))
    
    def extract_search_keywords(self):
        """Extract common keywords and phrases associated with AHRQ Compendium usage."""
        keywords = []
        
        for col in ['Usage_Description', 'Key_Findings']:
            for text in self.df[col].dropna():
                text = str(text).lower()
                if 'ahrq' in text:
                    # Extract phrases around AHRQ
                    sentences = text.split('.')
                    for sentence in sentences:
                        if 'ahrq' in sentence:
                            # Extract key phrases
                            if 'hospital' in sentence and 'system' in sentence:
                                keywords.append('hospital system')
                            if 'linkage' in sentence:
                                keywords.append('linkage file')
                            if 'affiliation' in sentence:
                                keywords.append('affiliation')
                            if 'ownership' in sentence:
                                keywords.append('ownership')
                            if 'merger' in sentence or 'consolidation' in sentence:
                                keywords.append('consolidation')
        
        keyword_counter = Counter(keywords)
        return dict(keyword_counter.most_common(10))
    
    def identify_false_positive_patterns(self):
        """Identify patterns that might lead to false positives."""
        false_patterns = []
        
        # Look for AHRQ mentions that aren't about the Compendium
        for text in self.df['Notes'].dropna():
            text = str(text).lower()
            if 'ahrq' in text and 'compendium' not in text:
                if 'quality indicator' in text:
                    false_patterns.append('quality indicators')
                if 'patient safety' in text:
                    false_patterns.append('patient safety')
                if 'prevention quality' in text:
                    false_patterns.append('prevention quality')
        
        return list(set(false_patterns))
    
    def generate_search_recommendations(self):
        """Generate specific search query recommendations based on analysis."""
        recommendations = []
        
        # Based on year patterns
        year_patterns = self.analyze_year_patterns()
        if year_patterns:
            years = list(year_patterns.keys())
            year_query = ' OR '.join([f'"{year} AHRQ Compendium"' for year in years])
            recommendations.append({
                'strategy': 'Year-specific searches',
                'query': f'TITLE-ABS-KEY({year_query})',
                'rationale': f'Found {len(years)} different years mentioned in references'
            })
        
        # Based on usage patterns
        usage_keywords = self.extract_search_keywords()
        if usage_keywords:
            top_keywords = list(usage_keywords.keys())[:5]
            keyword_query = ' OR '.join([f'"{kw}"' for kw in top_keywords])
            recommendations.append({
                'strategy': 'Usage-focused searches',
                'query': f'TITLE-ABS-KEY(AHRQ AND ({keyword_query}))',
                'rationale': f'Top usage contexts: {", ".join(top_keywords)}'
            })
        
        # Based on journal patterns
        journals = self.analyze_journal_patterns()
        if journals:
            top_journals = list(journals.keys())[:3]
            journal_query = ' OR '.join([f'EXACTSRCTITLE("{j}")' for j in top_journals])
            recommendations.append({
                'strategy': 'Journal-focused searches',
                'query': f'({journal_query}) AND TITLE-ABS-KEY(AHRQ AND "health system*")',
                'rationale': f'Top journals citing AHRQ: {", ".join(top_journals)}'
            })
        
        return recommendations
    
    def generate_report(self, output_path: str):
        """Generate comprehensive analysis report."""
        report = {
            'analysis_summary': {
                'total_references': len(self.df),
                'unique_journals': self.df['Journal_Venue'].nunique(),
                'year_range': f"{self.df['Publication_Year'].min()} - {self.df['Publication_Year'].max()}"
            },
            'year_patterns': self.analyze_year_patterns(),
            'usage_types': self.analyze_usage_types(),
            'top_journals': self.analyze_journal_patterns(),
            'common_keywords': self.extract_search_keywords(),
            'key_citing_papers': self.find_key_citing_papers(),
            'false_positive_patterns': self.identify_false_positive_patterns(),
            'search_recommendations': self.generate_search_recommendations()
        }
        
        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Print summary
        print("CITATION PATTERN ANALYSIS SUMMARY")
        print("="*70)
        print(f"\nTotal references analyzed: {report['analysis_summary']['total_references']}")
        print(f"Year range: {report['analysis_summary']['year_range']}")
        print(f"Unique journals: {report['analysis_summary']['unique_journals']}")
        
        print("\nYear-specific mentions:")
        for year, count in report['year_patterns'].items():
            print(f"  {year}: {count} mentions")
        
        print("\nTop keywords associated with AHRQ Compendium:")
        for keyword, count in report['common_keywords'].items():
            print(f"  {keyword}: {count} occurrences")
        
        print("\nRecommended search strategies:")
        for i, rec in enumerate(report['search_recommendations'], 1):
            print(f"\n{i}. {rec['strategy']}")
            print(f"   Query: {rec['query']}")
            print(f"   Rationale: {rec['rationale']}")
        
        return report

if __name__ == "__main__":
    analyzer = CitationPatternAnalyzer(
        "/mnt/c/Users/pedro/OneDrive/Desktop/Apps/Bond Attempt/herewegoagain/ahrq_project/02_data_sources/ahrq_reference.csv"
    )
    
    output_path = "/mnt/c/Users/pedro/OneDrive/Desktop/Apps/Bond Attempt/herewegoagain/ahrq_project/04_results/search_results/citation_pattern_analysis.json"
    analyzer.generate_report(output_path)