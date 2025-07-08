#!/usr/bin/env python3
"""
Scopus Article Availability Checker
Checks all articles in AHRQ_NEWLY_DISCOVERED CSV for availability via Scopus API
Tests multiple retrieval methods: DOI and EID
"""

import requests
import pandas as pd
from datetime import datetime
import time
import os
from typing import Dict, List, Tuple

class ScopusAvailabilityChecker:
    def __init__(self, api_key: str):
        """Initialize with Scopus API key."""
        self.api_key = api_key
        self.base_url = "https://api.elsevier.com/content/article/"
        self.results = []
        self.session = requests.Session()
        self.session.headers.update({
            'X-ELS-APIKey': self.api_key,
            'Accept': 'text/xml'
        })
        
    def check_article_availability(self, row: pd.Series) -> Dict:
        """Check if an article is available via Scopus API using multiple methods."""
        result = {
            'Found_By_Query': row.get('Found_By_Query', ''),
            'eid': row.get('eid', ''),
            'title': row.get('title', ''),
            'authors': row.get('authors', ''),
            'year': row.get('year', ''),
            'journal': row.get('journal', ''),
            'doi': row.get('doi', ''),
            'citations': row.get('citations', ''),
            'scopus_available': 'NO',
            'retrieval_method': 'NONE',
            'status_code': '',
            'full_text_size': 0,
            'error_message': '',
            'checked_timestamp': datetime.now().isoformat()
        }
        
        # Try DOI first
        if pd.notna(row.get('doi')) and row['doi']:
            doi_result = self._try_doi(row['doi'])
            if doi_result[0]:
                result['scopus_available'] = 'YES'
                result['retrieval_method'] = 'DOI'
                result['status_code'] = doi_result[1]
                result['full_text_size'] = doi_result[2]
                return result
            else:
                result['status_code'] = f"DOI:{doi_result[1]}"
        
        # Try EID if DOI failed
        if pd.notna(row.get('eid')) and row['eid']:
            eid_result = self._try_eid(row['eid'])
            if eid_result[0]:
                result['scopus_available'] = 'YES'
                result['retrieval_method'] = 'EID'
                result['status_code'] = f"{result['status_code']},EID:{eid_result[1]}"
                result['full_text_size'] = eid_result[2]
                return result
            else:
                result['status_code'] = f"{result['status_code']},EID:{eid_result[1]}"
        
        # Both methods failed
        result['error_message'] = 'Article not found via DOI or EID'
        return result
    
    def _try_doi(self, doi: str) -> Tuple[bool, int, int]:
        """Try to retrieve article by DOI."""
        try:
            url = f"{self.base_url}doi/{doi}"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                return True, response.status_code, len(response.text)
            else:
                return False, response.status_code, 0
                
        except requests.RequestException as e:
            return False, -1, 0
    
    def _try_eid(self, eid: str) -> Tuple[bool, int, int]:
        """Try to retrieve article by EID."""
        try:
            url = f"{self.base_url}eid/{eid}"
            response = self.session.get(url, timeout=30)
            
            if response.status_code == 200:
                return True, response.status_code, len(response.text)
            else:
                return False, response.status_code, 0
                
        except requests.RequestException as e:
            return False, -1, 0
    
    def check_all_articles(self, csv_path: str, output_path: str = None):
        """Check availability for all articles in the CSV."""
        print("="*80)
        print("SCOPUS ARTICLE AVAILABILITY CHECKER")
        print("="*80)
        
        # Read CSV
        df = pd.read_csv(csv_path)
        total_articles = len(df)
        print(f"\nFound {total_articles} articles to check")
        
        # Process each article
        for idx, row in df.iterrows():
            print(f"\n[{idx+1}/{total_articles}] Checking: {row['title'][:60]}...")
            print(f"  DOI: {row.get('doi', 'N/A')}")
            print(f"  EID: {row.get('eid', 'N/A')}")
            
            result = self.check_article_availability(row)
            self.results.append(result)
            
            # Print result
            if result['scopus_available'] == 'YES':
                print(f"  ✅ AVAILABLE via {result['retrieval_method']} ({result['full_text_size']} chars)")
            else:
                print(f"  ❌ NOT AVAILABLE (Status: {result['status_code']})")
            
            # Rate limiting
            if idx < total_articles - 1:
                time.sleep(1.5)  # 1.5 seconds between requests
            
            # Save intermediate results every 10 articles
            if (idx + 1) % 10 == 0:
                self._save_results(output_path, intermediate=True)
        
        # Save final results
        self._save_results(output_path)
        self._print_summary()
    
    def _save_results(self, output_path: str = None, intermediate: bool = False):
        """Save results to CSV."""
        if not self.results:
            return
            
        df = pd.DataFrame(self.results)
        
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"scopus_availability_results_{timestamp}.csv"
        
        df.to_csv(output_path, index=False, encoding='utf-8-sig')
        
        if not intermediate:
            print(f"\n✅ Results saved to: {output_path}")
    
    def _print_summary(self):
        """Print summary statistics."""
        if not self.results:
            return
            
        df = pd.DataFrame(self.results)
        
        print("\n" + "="*80)
        print("SUMMARY STATISTICS")
        print("="*80)
        
        total = len(df)
        available = len(df[df['scopus_available'] == 'YES'])
        not_available = len(df[df['scopus_available'] == 'NO'])
        
        print(f"\nTotal articles checked: {total}")
        print(f"Available in Scopus: {available} ({available/total*100:.1f}%)")
        print(f"Not available: {not_available} ({not_available/total*100:.1f}%)")
        
        # Breakdown by retrieval method
        if available > 0:
            print("\nAvailable articles by retrieval method:")
            method_counts = df[df['scopus_available'] == 'YES']['retrieval_method'].value_counts()
            for method, count in method_counts.items():
                print(f"  {method}: {count} articles")
        
        # Breakdown by year
        print("\nAvailability by year:")
        year_summary = df.groupby('year')['scopus_available'].value_counts().unstack(fill_value=0)
        print(year_summary)
        
        # Save summary
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        summary_path = f"availability_summary_{timestamp}.txt"
        with open(summary_path, 'w') as f:
            f.write("SCOPUS AVAILABILITY CHECK SUMMARY\n")
            f.write("="*50 + "\n")
            f.write(f"Checked on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Total articles: {total}\n")
            f.write(f"Available: {available} ({available/total*100:.1f}%)\n")
            f.write(f"Not available: {not_available} ({not_available/total*100:.1f}%)\n")
            f.write("\nBreakdown by year:\n")
            f.write(str(year_summary))
        
        print(f"\n📊 Summary saved to: {summary_path}")


def run_small_test():
    """Run a test with just 5 articles first."""
    api_key = "7cb67bc87041113e16b3604ec1d33cd6"
    checker = ScopusAvailabilityChecker(api_key)
    
    # Create a small test CSV
    test_data = pd.read_csv("AHRQ_NEWLY_DISCOVERED_Citations_20250623_163522.csv").head(5)
    test_csv = "test_articles.csv"
    test_data.to_csv(test_csv, index=False)
    
    print("Running small test with 5 articles...")
    checker.check_all_articles(test_csv, "test_availability_results.csv")
    
    # Clean up
    os.remove(test_csv)


def run_full_check():
    """Run the full availability check on all articles."""
    api_key = "7cb67bc87041113e16b3604ec1d33cd6"
    checker = ScopusAvailabilityChecker(api_key)
    
    csv_path = "AHRQ_NEWLY_DISCOVERED_Citations_20250623_163522.csv"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = f"scopus_availability_full_results_{timestamp}.csv"
    
    checker.check_all_articles(csv_path, output_path)


if __name__ == "__main__":
    # Run small test first
    print("STEP 1: Running small test with 5 articles")
    print("-"*80)
    run_small_test()
    
    print("\n\nSTEP 2: Would you like to run the full check? (Uncomment the line below)")
    print("-"*80)
    # Uncomment to run full check:
    # run_full_check()