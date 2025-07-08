#!/usr/bin/env python3
"""
Deduplication Module for AHRQ Search Results
Compares new search results against existing reference CSV
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
import re
from difflib import SequenceMatcher
from datetime import datetime
import json
import os

class AHRQDeduplicator:
    def __init__(self, reference_path: str, config_path: str = "search_config_enhanced.json"):
        """Initialize deduplicator with reference file and config."""
        self.reference_df = pd.read_csv(reference_path, encoding='utf-8-sig')
        
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.match_thresholds = self.config['deduplication']['match_thresholds']
        self.match_results = []
        
        # Normalize reference data for matching
        self._prepare_reference_data()
        
    def _prepare_reference_data(self):
        """Prepare reference data for efficient matching."""
        # Normalize DOIs
        self.reference_df['doi_normalized'] = self.reference_df['DOI_URL'].apply(self._normalize_doi)
        
        # Normalize titles
        self.reference_df['title_normalized'] = self.reference_df['Title'].apply(self._normalize_title)
        
        # Extract first author last name and year
        self.reference_df['first_author'] = self.reference_df['Authors_Standardized'].apply(self._extract_first_author)
        
        # Create lookup dictionaries for fast matching
        self.doi_lookup = dict(zip(self.reference_df['doi_normalized'], self.reference_df.index))
        self.title_year_lookup = {}
        
        for idx, row in self.reference_df.iterrows():
            key = (row['title_normalized'], str(row.get('Publication_Year', '')))
            if key not in self.title_year_lookup:
                self.title_year_lookup[key] = []
            self.title_year_lookup[key].append(idx)
    
    def _normalize_doi(self, doi: str) -> str:
        """Normalize DOI for matching."""
        if pd.isna(doi):
            return ''
        
        doi_str = str(doi).lower().strip()
        
        # Extract core DOI from various formats
        patterns = [
            r'10\.\d{4,}[/\.\-\w]+',  # Standard DOI pattern
            r'doi\.org/(10\.\d{4,}[/\.\-\w]+)',  # From URL  
            r'dx\.doi\.org/(10\.\d{4,}[/\.\-\w]+)'  # From dx.doi.org
        ]
        
        for pattern in patterns:
            match = re.search(pattern, doi_str)
            if match:
                # Check if pattern has capturing group
                if match.groups() and '/' in pattern and 'doi.org' in pattern:
                    return match.group(1)
                else:
                    return match.group(0)
        
        return doi_str
    
    def _normalize_title(self, title: str) -> str:
        """Normalize title for matching."""
        if pd.isna(title):
            return ''
        
        # Convert to lowercase
        title = str(title).lower()
        
        # Remove special characters and extra whitespace
        title = re.sub(r'[^\w\s]', ' ', title)
        title = re.sub(r'\s+', ' ', title)
        
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        words = title.split()
        title = ' '.join([w for w in words if w not in stop_words])
        
        return title.strip()
    
    def _extract_first_author(self, authors: str) -> str:
        """Extract first author's last name."""
        if pd.isna(authors):
            return ''
        
        authors_str = str(authors)
        
        # Try different separators
        if ';' in authors_str:
            first_author = authors_str.split(';')[0]
        elif ',' in authors_str and authors_str.count(',') > 1:
            first_author = authors_str.split(',')[0]
        else:
            first_author = authors_str.split()[0] if authors_str else ''
        
        # Extract last name (assume it's the last word)
        if first_author:
            parts = first_author.strip().split()
            return parts[-1] if parts else ''
        
        return ''
    
    def _calculate_title_similarity(self, title1: str, title2: str) -> float:
        """Calculate similarity between two titles."""
        # Use multiple similarity metrics
        
        # 1. Sequence matcher (character-based)
        seq_ratio = SequenceMatcher(None, title1, title2).ratio()
        
        # 2. Word overlap (token-based)
        words1 = set(title1.split())
        words2 = set(title2.split())
        
        if not words1 or not words2:
            word_overlap = 0
        else:
            intersection = len(words1 & words2)
            union = len(words1 | words2)
            word_overlap = intersection / union if union > 0 else 0
        
        # 3. N-gram similarity
        def get_ngrams(text, n=3):
            return set([text[i:i+n] for i in range(len(text)-n+1)])
        
        ngrams1 = get_ngrams(title1, 3)
        ngrams2 = get_ngrams(title2, 3)
        
        if not ngrams1 or not ngrams2:
            ngram_sim = 0
        else:
            intersection = len(ngrams1 & ngrams2)
            union = len(ngrams1 | ngrams2)
            ngram_sim = intersection / union if union > 0 else 0
        
        # Weighted average
        similarity = (seq_ratio * 0.4) + (word_overlap * 0.3) + (ngram_sim * 0.3)
        
        return similarity * 100  # Convert to percentage
    
    def find_matches(self, search_results_df: pd.DataFrame) -> pd.DataFrame:
        """Find matches between search results and reference data."""
        results = []
        
        for idx, row in search_results_df.iterrows():
            match_info = {
                'search_idx': idx,
                'search_eid': row.get('eid', ''),
                'search_doi': row.get('doi', ''),
                'search_title': row.get('title', ''),
                'search_authors': row.get('authors', ''),
                'search_year': row.get('year', ''),
                'match_status': 'no_match',
                'match_confidence': 0,
                'match_type': '',
                'reference_idx': None,
                'reference_title': '',
                'reference_doi': '',
                'match_details': ''
            }
            
            # Try EID matching (if we had EID in reference, which we don't currently)
            # This is a placeholder for future enhancement
            
            # Try DOI matching
            if row.get('doi'):
                doi_norm = self._normalize_doi(row['doi'])
                if doi_norm and doi_norm in self.doi_lookup:
                    ref_idx = self.doi_lookup[doi_norm]
                    match_info.update({
                        'match_status': 'definite_match',
                        'match_confidence': self.match_thresholds['doi'],
                        'match_type': 'doi',
                        'reference_idx': ref_idx,
                        'reference_title': self.reference_df.loc[ref_idx, 'Title'],
                        'reference_doi': self.reference_df.loc[ref_idx, 'DOI_URL'],
                        'match_details': f'DOI match: {doi_norm}'
                    })
                    results.append(match_info)
                    continue
            
            # Try title + year matching
            title_norm = self._normalize_title(row.get('title', ''))
            year = str(row.get('year', ''))
            
            if title_norm:
                # Check exact title + year match first
                key = (title_norm, year)
                if key in self.title_year_lookup:
                    ref_indices = self.title_year_lookup[key]
                    if ref_indices:
                        ref_idx = ref_indices[0]  # Take first match
                        match_info.update({
                            'match_status': 'very_likely_match',
                            'match_confidence': 90,
                            'match_type': 'title_year_exact',
                            'reference_idx': ref_idx,
                            'reference_title': self.reference_df.loc[ref_idx, 'Title'],
                            'reference_doi': self.reference_df.loc[ref_idx, 'DOI_URL'],
                            'match_details': 'Exact title and year match'
                        })
                        results.append(match_info)
                        continue
                
                # Fuzzy title matching
                best_match = None
                best_score = 0
                
                for ref_idx, ref_row in self.reference_df.iterrows():
                    # Skip if years are too different
                    ref_year = str(ref_row.get('Publication_Year', ''))
                    try:
                        if year and ref_year and abs(int(float(year)) - int(float(ref_year))) > 1:
                            continue
                    except ValueError:
                        # If can't parse years, skip comparison
                        continue
                    
                    # Calculate title similarity
                    ref_title_norm = ref_row['title_normalized']
                    similarity = self._calculate_title_similarity(title_norm, ref_title_norm)
                    
                    if similarity > best_score:
                        best_score = similarity
                        best_match = ref_idx
                
                # Check if best match exceeds threshold
                if best_score >= self.match_thresholds['title_fuzzy']:
                    ref_row = self.reference_df.loc[best_match]
                    
                    # Determine match status based on score
                    if best_score >= 90:
                        status = 'very_likely_match'
                    elif best_score >= 80:
                        status = 'probable_match'
                    else:
                        status = 'possible_match'
                    
                    match_info.update({
                        'match_status': status,
                        'match_confidence': best_score,
                        'match_type': 'title_fuzzy',
                        'reference_idx': best_match,
                        'reference_title': ref_row['Title'],
                        'reference_doi': ref_row['DOI_URL'],
                        'match_details': f'Title similarity: {best_score:.1f}%'
                    })
                    results.append(match_info)
                    continue
            
            # Try author + year matching
            search_first_author = self._extract_first_author(row.get('authors', ''))
            
            if search_first_author and year:
                for ref_idx, ref_row in self.reference_df.iterrows():
                    ref_year = str(ref_row.get('Publication_Year', ''))
                    ref_first_author = ref_row.get('first_author', '')
                    
                    if (search_first_author.lower() == ref_first_author.lower() and 
                        year == ref_year):
                        
                        # Additional check on journal if available
                        confidence = self.match_thresholds['author_year']
                        if row.get('journal', '').lower() == ref_row.get('Journal_Venue', '').lower():
                            confidence += 10
                        
                        match_info.update({
                            'match_status': 'possible_match',
                            'match_confidence': confidence,
                            'match_type': 'author_year',
                            'reference_idx': ref_idx,
                            'reference_title': ref_row['Title'],
                            'reference_doi': ref_row['DOI_URL'],
                            'match_details': f'Author + year match: {search_first_author} ({year})'
                        })
                        results.append(match_info)
                        break
            
            # If no match found, add as no_match
            if match_info['match_status'] == 'no_match':
                results.append(match_info)
        
        return pd.DataFrame(results)
    
    def generate_deduplication_report(self, search_results_df: pd.DataFrame, 
                                    match_results_df: pd.DataFrame) -> Dict:
        """Generate comprehensive deduplication report."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Merge search results with match results
        merged_df = pd.merge(
            search_results_df, 
            match_results_df, 
            left_index=True, 
            right_on='search_idx',
            how='left'
        )
        
        # Categorize results
        new_unique = merged_df[merged_df['match_status'] == 'no_match']
        definite_matches = merged_df[merged_df['match_status'] == 'definite_match']
        very_likely_matches = merged_df[merged_df['match_status'] == 'very_likely_match']
        probable_matches = merged_df[merged_df['match_status'] == 'probable_match']
        possible_matches = merged_df[merged_df['match_status'] == 'possible_match']
        
        # Save categorized results
        output_dir = "../04_results/deduplication"
        os.makedirs(output_dir, exist_ok=True)
        
        # Save new unique discoveries
        if len(new_unique) > 0:
            new_path = os.path.join(output_dir, f"ahrq_new_unique_discoveries_{timestamp}.csv")
            new_unique.to_csv(new_path, index=False, encoding='utf-8-sig')
            print(f"\n✅ New unique discoveries saved to: {new_path}")
            print(f"   Count: {len(new_unique)} articles")
        
        # Save matches requiring review
        review_needed = pd.concat([probable_matches, possible_matches])
        if len(review_needed) > 0:
            review_path = os.path.join(output_dir, f"ahrq_manual_review_needed_{timestamp}.csv")
            review_needed.to_csv(review_path, index=False, encoding='utf-8-sig')
            print(f"✅ Manual review needed saved to: {review_path}")
            print(f"   Count: {len(review_needed)} articles")
        
        # Save confirmed duplicates
        confirmed_dupes = pd.concat([definite_matches, very_likely_matches])
        if len(confirmed_dupes) > 0:
            dupes_path = os.path.join(output_dir, f"ahrq_confirmed_duplicates_{timestamp}.csv")
            confirmed_dupes.to_csv(dupes_path, index=False, encoding='utf-8-sig')
            print(f"✅ Confirmed duplicates saved to: {dupes_path}")
            print(f"   Count: {len(confirmed_dupes)} articles")
        
        # Generate summary report
        summary = {
            'timestamp': timestamp,
            'total_search_results': len(search_results_df),
            'reference_articles': len(self.reference_df),
            'new_unique_articles': len(new_unique),
            'definite_matches': len(definite_matches),
            'very_likely_matches': len(very_likely_matches),
            'probable_matches': len(probable_matches),
            'possible_matches': len(possible_matches),
            'match_type_distribution': match_results_df['match_type'].value_counts().to_dict()
        }
        
        # Save summary report
        summary_path = os.path.join(output_dir, f"ahrq_deduplication_summary_{timestamp}.json")
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        # Generate detailed text report
        report_path = os.path.join(output_dir, f"ahrq_deduplication_report_{timestamp}.txt")
        with open(report_path, 'w') as f:
            f.write("AHRQ DEDUPLICATION REPORT\n")
            f.write("="*60 + "\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("SUMMARY\n")
            f.write("-"*40 + "\n")
            f.write(f"Total search results analyzed: {summary['total_search_results']}\n")
            f.write(f"Reference articles in database: {summary['reference_articles']}\n\n")
            
            f.write("MATCH RESULTS\n")
            f.write("-"*40 + "\n")
            f.write(f"New unique discoveries: {summary['new_unique_articles']} ({summary['new_unique_articles']/summary['total_search_results']*100:.1f}%)\n")
            f.write(f"Definite matches (95-100%): {summary['definite_matches']}\n")
            f.write(f"Very likely matches (85-94%): {summary['very_likely_matches']}\n")
            f.write(f"Probable matches (70-84%): {summary['probable_matches']}\n")
            f.write(f"Possible matches (60-69%): {summary['possible_matches']}\n\n")
            
            f.write("MATCH TYPE DISTRIBUTION\n")
            f.write("-"*40 + "\n")
            for match_type, count in summary['match_type_distribution'].items():
                f.write(f"{match_type}: {count}\n")
            
            # Add examples of high-relevance new discoveries
            f.write("\n\nTOP NEW DISCOVERIES (by relevance score)\n")
            f.write("="*60 + "\n")
            
            new_sorted = new_unique.sort_values('relevance_score', ascending=False).head(10)
            for idx, row in new_sorted.iterrows():
                f.write(f"\n[{row['relevance_score']}] {row['title'][:80]}...\n")
                f.write(f"  Authors: {row['authors']}\n")
                f.write(f"  Year: {row['year']} | Journal: {row['journal']}\n")
                f.write(f"  DOI: {row['doi']}\n")
        
        print(f"✅ Deduplication report saved to: {report_path}")
        
        return summary


def deduplicate_search_results(search_results_path: str, 
                              reference_path: str = "../02_data_sources/ahrq_reference.csv") -> Dict:
    """Main function to deduplicate search results."""
    # Load search results
    search_df = pd.read_csv(search_results_path, encoding='utf-8-sig')
    
    # Initialize deduplicator
    dedup = AHRQDeduplicator(reference_path)
    
    print(f"\nAnalyzing {len(search_df)} search results against {len(dedup.reference_df)} reference articles...")
    
    # Find matches
    match_results = dedup.find_matches(search_df)
    
    # Generate report
    summary = dedup.generate_deduplication_report(search_df, match_results)
    
    print(f"\n{'='*60}")
    print("DEDUPLICATION COMPLETE")
    print(f"{'='*60}")
    print(f"New unique discoveries: {summary['new_unique_articles']}")
    print(f"Confirmed duplicates: {summary['definite_matches'] + summary['very_likely_matches']}")
    print(f"Manual review needed: {summary['probable_matches'] + summary['possible_matches']}")
    
    return summary


if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) > 1:
        search_results_path = sys.argv[1]
    else:
        # Use most recent search results
        results_dir = "../04_results/search_results"
        files = sorted([f for f in os.listdir(results_dir) if f.startswith('ahrq_enhanced_search_results')])
        if files:
            search_results_path = os.path.join(results_dir, files[-1])
        else:
            print("No search results found. Run ahrq_master_search_enhanced.py first.")
            sys.exit(1)
    
    deduplicate_search_results(search_results_path)