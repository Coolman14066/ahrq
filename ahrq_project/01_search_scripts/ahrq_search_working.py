#!/usr/bin/env python3
"""
Working version of AHRQ search - simplified to ensure results
"""

import requests
import json
import pandas as pd
from datetime import datetime
import time
import os

class AHRQSearchWorking:
    def __init__(self):
        """Initialize with configuration."""
        self.api_key = "7cb67bc87041113e16b3604ec1d33cd6"
        self.base_url = "https://api.elsevier.com/content/search/scopus"
        self.results = []
        self.seen_eids = set()
        
    def search_scopus(self, query: str, max_results: int = 200) -> list:
        """Execute search with pagination."""
        all_entries = []
        start = 0
        
        while start < max_results:
            params = {
                'query': query,
                'apiKey': self.api_key,
                'httpAccept': 'application/json',
                'count': min(25, max_results - start),
                'start': start,
                'view': 'STANDARD'
            }
            
            try:
                response = requests.get(self.base_url, params=params, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    search_results = data.get('search-results', {})
                    
                    # Get total results
                    total = int(search_results.get('opensearch:totalResults', 0))
                    entries = search_results.get('entry', [])
                    
                    if not entries:
                        break
                        
                    all_entries.extend(entries)
                    
                    # Check if we have all results
                    if len(all_entries) >= total or len(entries) < params['count']:
                        break
                        
                    start += len(entries)
                    time.sleep(0.5)  # Rate limiting
                    
                else:
                    print(f"Error {response.status_code}: {response.text}")
                    break
                    
            except Exception as e:
                print(f"Request failed: {e}")
                break
                
        return all_entries
    
    def extract_info(self, entry: dict) -> dict:
        """Extract article information."""
        return {
            'eid': entry.get('eid', ''),
            'doi': entry.get('prism:doi', ''),
            'title': entry.get('dc:title', ''),
            'authors': entry.get('dc:creator', ''),
            'year': entry.get('prism:coverDate', '')[:4] if entry.get('prism:coverDate') else '',
            'journal': entry.get('prism:publicationName', ''),
            'citations': entry.get('citedby-count', 0),
            'scopus_link': ''
        }
    
    def run_comprehensive_search(self):
        """Run all search queries."""
        print("="*80)
        print("AHRQ COMPREHENSIVE SEARCH - WORKING VERSION")
        print("="*80)
        
        # Define comprehensive queries
        queries = [
            # Direct mentions
            ('Direct: AHRQ Compendium', 'TITLE-ABS-KEY("AHRQ Compendium")'),
            ('Direct: AHRQ + Compendium + health', 'TITLE-ABS-KEY(AHRQ AND compendium AND health)'),
            
            # Proximity searches
            ('Proximity: AHRQ near Compendium', 'TITLE-ABS-KEY(AHRQ W/10 compendium)'),
            ('Proximity: Agency near Compendium', 'TITLE-ABS-KEY("Agency for Healthcare Research" W/15 compendium)'),
            
            # Reference searches
            ('References: AHRQ Compendium', 'REF("AHRQ Compendium")'),
            ('References: Rich + Mathematica', 'REF(Rich AND Mathematica AND AHRQ)'),
            
            # Author searches
            ('Author: Ganguli', 'AUTHOR-NAME("Ganguli I*") AND TITLE-ABS-KEY("health system*")'),
            ('Author: Levinson', 'AUTHOR-NAME("Levinson Z*") AND TITLE-ABS-KEY("health system*")'),
            
            # Institution searches
            ('Institution: Kaiser', 'AFFIL("Kaiser Family Foundation") AND TITLE-ABS-KEY(AHRQ)'),
            ('Institution: Mathematica', 'AFFIL(Mathematica) AND TITLE-ABS-KEY("health system*")'),
            
            # Methodological searches
            ('Method: identify systems', 'TITLE-ABS("identify health systems" AND AHRQ)'),
            ('Method: system characteristics', 'TITLE-ABS("health system characteristics" AND AHRQ)'),
            
            # Broader AHRQ searches
            ('Broad: AHRQ mentions', 'TITLE-ABS-KEY(AHRQ)'),
            ('Broad: Agency mentions', 'TITLE-ABS-KEY("Agency for Healthcare Research and Quality")')
        ]
        
        # Add year filter to all queries
        year_filter = ' AND PUBYEAR > 2020 AND PUBYEAR < 2026'
        
        total_found = 0
        
        for desc, base_query in queries:
            query = base_query + year_filter
            print(f"\nSearching: {desc}")
            print(f"Query: {query[:100]}...")
            
            entries = self.search_scopus(query, max_results=200)
            
            new_count = 0
            for entry in entries:
                eid = entry.get('eid', '')
                if eid and eid not in self.seen_eids:
                    info = self.extract_info(entry)
                    info['search_desc'] = desc
                    info['query'] = base_query
                    
                    # Calculate relevance
                    info['relevance_score'] = self.calculate_relevance(info, desc)
                    
                    self.results.append(info)
                    self.seen_eids.add(eid)
                    new_count += 1
            
            print(f"Found: {len(entries)} total, {new_count} new unique")
            total_found += new_count
            
            time.sleep(1)  # Rate limiting
        
        print(f"\n{'='*80}")
        print(f"TOTAL UNIQUE ARTICLES FOUND: {total_found}")
        print(f"{'='*80}")
        
        # Filter for AHRQ Compendium mentions
        self.filter_compendium_mentions()
    
    def calculate_relevance(self, article: dict, search_desc: str) -> float:
        """Calculate relevance score."""
        score = 0.0
        
        # Base score by search type
        if 'Direct' in search_desc:
            score += 10
        elif 'Proximity' in search_desc:
            score += 8
        elif 'References' in search_desc:
            score += 6
        else:
            score += 4
        
        # Check title
        title = article['title'].lower()
        if 'ahrq' in title and 'compendium' in title:
            score += 5
        elif 'ahrq' in title or 'compendium' in title:
            score += 2
        
        # Year bonus
        year = article.get('year', '')
        if year:
            try:
                if int(year) >= 2024:
                    score += 2
                elif int(year) >= 2023:
                    score += 1
            except:
                pass
        
        return score
    
    def filter_compendium_mentions(self):
        """Filter results to only those mentioning AHRQ Compendium."""
        print("\nFiltering for AHRQ Compendium mentions...")
        
        # For now, keep all results but mark those that are confirmed
        for article in self.results:
            title_lower = article['title'].lower()
            
            # Mark confirmed AHRQ Compendium articles
            if ('ahrq' in title_lower and 'compendium' in title_lower) or \
               ('agency for healthcare research' in title_lower and 'compendium' in title_lower):
                article['confirmed_compendium'] = True
            else:
                article['confirmed_compendium'] = False
    
    def save_results(self):
        """Save search results."""
        if not self.results:
            print("No results to save.")
            return
        
        # Create DataFrame
        df = pd.DataFrame(self.results)
        
        # Sort by relevance
        df = df.sort_values('relevance_score', ascending=False)
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = "../04_results/search_results"
        os.makedirs(output_dir, exist_ok=True)
        
        # All results
        all_path = os.path.join(output_dir, f"ahrq_working_all_results_{timestamp}.csv")
        df.to_csv(all_path, index=False, encoding='utf-8-sig')
        print(f"\n✅ All results saved to: {all_path}")
        
        # Confirmed AHRQ Compendium only
        confirmed = df[df['confirmed_compendium'] == True]
        if len(confirmed) > 0:
            confirmed_path = os.path.join(output_dir, f"ahrq_working_confirmed_{timestamp}.csv")
            confirmed.to_csv(confirmed_path, index=False, encoding='utf-8-sig')
            print(f"✅ Confirmed AHRQ Compendium articles: {confirmed_path}")
            print(f"   Count: {len(confirmed)}")
        
        # High relevance (score >= 8)
        high_rel = df[df['relevance_score'] >= 8]
        if len(high_rel) > 0:
            high_path = os.path.join(output_dir, f"ahrq_working_high_relevance_{timestamp}.csv")
            high_rel.to_csv(high_path, index=False, encoding='utf-8-sig')
            print(f"✅ High relevance articles: {high_path}")
            print(f"   Count: {len(high_rel)}")
        
        # Summary
        print(f"\nSUMMARY:")
        print(f"Total unique articles: {len(df)}")
        print(f"Confirmed AHRQ Compendium mentions: {len(confirmed)}")
        print(f"High relevance articles: {len(high_rel)}")
        
        # Show top confirmed articles
        if len(confirmed) > 0:
            print(f"\nTop Confirmed AHRQ Compendium Articles:")
            for idx, row in confirmed.head(10).iterrows():
                print(f"\n[{row['relevance_score']}] {row['title'][:80]}...")
                print(f"   Year: {row['year']} | DOI: {row['doi']}")


def main():
    """Run the working search."""
    searcher = AHRQSearchWorking()
    searcher.run_comprehensive_search()
    searcher.save_results()


if __name__ == "__main__":
    main()