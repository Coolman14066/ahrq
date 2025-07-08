#!/usr/bin/env python3
"""
AHRQ Master Search Script
Comprehensive search for AHRQ Compendium articles using multiple strategies
"""

import requests
import json
import pandas as pd
from datetime import datetime
import time
import os
from typing import Dict, List, Tuple, Set
from urllib.parse import quote

class AHRQMasterSearch:
    def __init__(self, config_path: str = "search_config.json"):
        """Initialize with configuration."""
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.api_key = self.config['api_key']
        self.base_url = "https://api.elsevier.com/content/search/scopus"
        self.all_results = []
        self.seen_eids = set()
        self.query_log = []  # Track query statistics
        
    def build_query_string(self, query: str, tier: str) -> str:
        """Build complete query string with filters."""
        # Add year filter
        year_filter = f" AND PUBYEAR > {self.config['filters']['year_range']['start']-1}"
        year_filter += f" AND PUBYEAR < {self.config['filters']['year_range']['end']+1}"
        
        # Add document type filter
        doc_types = self.config['filters']['document_types']['include']
        doc_filter = " AND (" + " OR ".join([f"DOCTYPE({dt})" for dt in doc_types]) + ")"
        
        # Exclude certain document types
        exclude_types = self.config['filters']['document_types']['exclude']
        if exclude_types:
            doc_filter += " AND NOT (" + " OR ".join([f"DOCTYPE({dt})" for dt in exclude_types]) + ")"
        
        # Combine query with filters
        full_query = f"({query}){year_filter}{doc_filter}"
        
        # Add exclusion terms for certain tiers
        if tier in ['tier_1_direct', 'tier_2_proximity']:
            for exclusion in self.config['exclusion_terms']:
                full_query += f" AND NOT ({exclusion})"
        
        return full_query
    
    def search_scopus(self, query: str, start: int = 0, cursor: str = None) -> Dict:
        """Execute a single search query with support for cursor-based pagination."""
        params = {
            'query': query,
            'apiKey': self.api_key,
            'httpAccept': 'application/json',
            'count': self.config['search_parameters']['results_per_query'],
            'sort': self.config['search_parameters']['sort_by'],
            'view': self.config['search_parameters']['view']
        }
        
        # Use cursor if available (for results beyond 5000)
        if cursor:
            params['cursor'] = cursor
        else:
            params['start'] = start
        
        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error {response.status_code}: {response.text}")
                return None
        except Exception as e:
            print(f"Request failed: {e}")
            return None
    
    def extract_article_info(self, entry: Dict) -> Dict:
        """Extract relevant information from a search result entry."""
        # Get EID
        eid = entry.get('eid', '')
        
        # Skip if we've seen this article
        if eid in self.seen_eids:
            return None
        
        # Extract basic info
        info = {
            'eid': eid,
            'doi': entry.get('prism:doi', ''),
            'title': entry.get('dc:title', ''),
            'authors': entry.get('dc:creator', ''),
            'year': entry.get('prism:coverDate', '')[:4] if entry.get('prism:coverDate') else '',
            'journal': entry.get('prism:publicationName', ''),
            'citations': entry.get('citedby-count', 0),
            'abstract': entry.get('dc:description', ''),
            'keywords': '',
            'scopus_link': ''
        }
        
        # Extract author keywords
        if 'authkeywords' in entry:
            keywords = entry['authkeywords'].get('author-keyword', [])
            if isinstance(keywords, list):
                info['keywords'] = '; '.join([k.get('$', '') for k in keywords])
            elif isinstance(keywords, dict):
                info['keywords'] = keywords.get('$', '')
        
        # Get Scopus link
        links = entry.get('link', [])
        for link in links:
            if link.get('@ref') == 'scopus':
                info['scopus_link'] = link.get('@href', '')
                break
        
        return info
    
    def calculate_relevance_score(self, article: Dict, query_tier: str) -> float:
        """Calculate relevance score based on AHRQ mentions and context."""
        score = 0.0
        
        # Base score by tier
        tier_scores = {
            'tier_1_direct': 10.0,
            'tier_2_proximity': 8.0,
            'tier_3_wildcards': 6.0,
            'tier_4_references': 4.0,
            'tier_5_specific_citations': 3.0
        }
        score += tier_scores.get(query_tier, 1.0)
        
        # Check title
        title = article.get('title', '').lower()
        if 'ahrq' in title and 'compendium' in title:
            score += 5.0
        elif 'ahrq' in title or 'compendium' in title:
            score += 2.0
        
        # Check abstract
        abstract = article.get('abstract', '').lower()
        ahrq_count = abstract.count('ahrq') + abstract.count('agency for healthcare research')
        compendium_count = abstract.count('compendium')
        score += min(ahrq_count * 0.5, 3.0)
        score += min(compendium_count * 0.5, 3.0)
        
        # Check keywords
        keywords = article.get('keywords', '').lower()
        if 'ahrq' in keywords:
            score += 1.0
        if 'compendium' in keywords:
            score += 1.0
        
        # Recency bonus
        year = article.get('year', '')
        if year:
            try:
                year_int = int(year)
                if year_int >= 2023:
                    score += 1.0
                elif year_int >= 2022:
                    score += 0.5
            except:
                pass
        
        # Citation bonus (normalized)
        citations = int(article.get('citations', 0))
        if citations > 0:
            score += min(citations / 10, 2.0)
        
        return round(score, 2)
    
    def run_all_searches(self):
        """Run all configured searches."""
        print("="*80)
        print("AHRQ MASTER SEARCH - STARTING")
        print("="*80)
        
        total_queries = sum(len(queries['queries']) for queries in self.config['search_queries'].values())
        query_count = 0
        
        for tier_name, tier_config in self.config['search_queries'].items():
            print(f"\n{'='*60}")
            print(f"TIER: {tier_name}")
            print(f"Description: {tier_config['description']}")
            print('='*60)
            
            for query in tier_config['queries']:
                query_count += 1
                print(f"\n[{query_count}/{total_queries}] Query: {query}")
                
                # Build full query with filters
                full_query = self.build_query_string(query, tier_name)
                
                # Search with pagination
                start = 0
                total_found = 0
                cursor = None
                use_cursor = False
                
                while True:
                    results = self.search_scopus(full_query, start, cursor)
                    
                    if not results:
                        break
                    
                    # Get total results
                    total_results = int(results.get('search-results', {}).get('opensearch:totalResults', 0))
                    entries = results.get('search-results', {}).get('entry', [])
                    
                    if not entries:
                        break
                    
                    # Process entries
                    new_articles = 0
                    for entry in entries:
                        article = self.extract_article_info(entry)
                        if article and article['eid'] not in self.seen_eids:
                            article['query_tier'] = tier_name
                            article['search_query'] = query
                            article['relevance_score'] = self.calculate_relevance_score(article, tier_name)
                            
                            self.all_results.append(article)
                            self.seen_eids.add(article['eid'])
                            new_articles += 1
                    
                    total_found += len(entries)
                    print(f"   Found: {total_found}/{total_results} | New articles: {new_articles}")
                    
                    # Check if more results available and pagination is needed
                    if start + len(entries) >= total_results:
                        # We've retrieved all available results
                        break
                    
                    if len(entries) < self.config['search_parameters']['results_per_query']:
                        # No more results available from API
                        break
                    
                    # Check for cursor in response (for pagination beyond 5000)
                    next_cursor = results.get('search-results', {}).get('cursor', {}).get('@next')
                    
                    if next_cursor and start + len(entries) >= 4800:
                        # Switch to cursor-based pagination near the 5000 limit
                        cursor = next_cursor
                        use_cursor = True
                        print(f"   Switching to cursor-based pagination at result {start + len(entries)}")
                    elif use_cursor and next_cursor:
                        # Continue with cursor
                        cursor = next_cursor
                    else:
                        # Regular offset pagination
                        start += len(entries)
                        
                        # Only enforce 5000 limit if not using cursor
                        if not use_cursor and start >= 5000:
                            print(f"   ⚠️  Reached offset limit of 5000 results, cursor not available")
                            break
                    
                    time.sleep(1)  # Rate limiting
                
                # Log query statistics
                if results:
                    total_available = int(results.get('search-results', {}).get('opensearch:totalResults', 0))
                    self.query_log.append({
                        'tier': tier_name,
                        'query': query,
                        'available': total_available,
                        'retrieved': total_found
                    })
                    
                    if total_available > total_found:
                        print(f"   ⚠️  Retrieved {total_found} of {total_available} available results")
                    else:
                        print(f"   ✓ Retrieved all {total_found} available results")
                else:
                    print(f"   Total new articles from this query: {total_found}")
                time.sleep(2)  # Rate limiting between queries
        
        # Sort by relevance score
        self.all_results.sort(key=lambda x: x['relevance_score'], reverse=True)
    
    def save_results(self):
        """Save search results to CSV files."""
        if not self.all_results:
            print("\nNo results to save.")
            return
        
        # Create DataFrame
        df = pd.DataFrame(self.all_results)
        
        # Save full results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir = "../04_results/search_results"
        os.makedirs(output_dir, exist_ok=True)
        
        # Full results
        full_path = os.path.join(output_dir, f"ahrq_master_search_results_{timestamp}.csv")
        df.to_csv(full_path, index=False, encoding='utf-8-sig')
        print(f"\n✅ Full results saved to: {full_path}")
        
        # High relevance only (score >= 8)
        high_relevance = df[df['relevance_score'] >= 8.0]
        if len(high_relevance) > 0:
            high_path = os.path.join(output_dir, f"ahrq_high_relevance_{timestamp}.csv")
            high_relevance.to_csv(high_path, index=False, encoding='utf-8-sig')
            print(f"✅ High relevance results saved to: {high_path}")
        
        # Summary by tier
        summary_path = os.path.join(output_dir, f"ahrq_search_summary_{timestamp}.txt")
        with open(summary_path, 'w') as f:
            f.write("AHRQ MASTER SEARCH SUMMARY\n")
            f.write("="*50 + "\n")
            f.write(f"Search completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Total unique articles found: {len(df)}\n\n")
            
            # By tier
            f.write("Results by Search Tier:\n")
            tier_counts = df['query_tier'].value_counts()
            for tier, count in tier_counts.items():
                f.write(f"  {tier}: {count} articles\n")
            
            # By year
            f.write("\nResults by Year:\n")
            year_counts = df['year'].value_counts().sort_index()
            for year, count in year_counts.items():
                f.write(f"  {year}: {count} articles\n")
            
            # By relevance score
            f.write("\nRelevance Score Distribution:\n")
            f.write(f"  Score >= 10: {len(df[df['relevance_score'] >= 10])} articles\n")
            f.write(f"  Score 8-10: {len(df[(df['relevance_score'] >= 8) & (df['relevance_score'] < 10)])} articles\n")
            f.write(f"  Score 5-8: {len(df[(df['relevance_score'] >= 5) & (df['relevance_score'] < 8)])} articles\n")
            f.write(f"  Score < 5: {len(df[df['relevance_score'] < 5])} articles\n")
            
            # Top 10 by relevance
            f.write("\nTop 10 Articles by Relevance:\n")
            for idx, row in df.head(10).iterrows():
                f.write(f"\n{idx+1}. [{row['relevance_score']}] {row['title'][:70]}...\n")
                f.write(f"   Year: {row['year']} | Journal: {row['journal']}\n")
                f.write(f"   DOI: {row['doi']}\n")
        
        print(f"✅ Summary saved to: {summary_path}")
        
        # Create detailed search log
        log_path = os.path.join(output_dir, f"ahrq_detailed_search_log_{timestamp}.txt")
        with open(log_path, 'w') as f:
            f.write("DETAILED SEARCH LOG\n")
            f.write("="*50 + "\n\n")
            
            # Log queries that hit limits
            f.write("Queries with Potential Missed Results:\n")
            f.write("-"*40 + "\n")
            
            for query_info in self.query_log:
                if query_info['retrieved'] < query_info['available']:
                    f.write(f"\nQuery: {query_info['query'][:80]}...\n")
                    f.write(f"  Tier: {query_info['tier']}\n")
                    f.write(f"  Retrieved: {query_info['retrieved']} / Available: {query_info['available']}\n")
                    f.write(f"  Percentage: {(query_info['retrieved']/query_info['available']*100):.1f}%\n")
            
            f.write("\n\nAll Query Results:\n")
            f.write("-"*40 + "\n")
            for query_info in self.query_log:
                f.write(f"{query_info['tier']}: {query_info['retrieved']}/{query_info['available']} results\n")
        
        print(f"✅ Detailed log saved to: {log_path}")
        
        # Create deduplication report
        dedup_path = os.path.join(output_dir, f"ahrq_deduplication_report_{timestamp}.txt")
        with open(dedup_path, 'w') as f:
            f.write("DEDUPLICATION REPORT\n")
            f.write("="*50 + "\n")
            f.write(f"Total articles after deduplication: {len(df)}\n")
            f.write(f"Articles found in multiple tiers:\n\n")
            
            # Find articles that appeared in multiple queries
            eid_queries = {}
            for _, row in df.iterrows():
                eid = row['eid']
                if eid not in eid_queries:
                    eid_queries[eid] = []
                eid_queries[eid].append(row['query_tier'])
            
            multi_tier_count = 0
            for eid, tiers in eid_queries.items():
                if len(set(tiers)) > 1:
                    multi_tier_count += 1
            
            f.write(f"Articles found in multiple tiers: {multi_tier_count}\n")
        
        print(f"✅ Deduplication report saved to: {dedup_path}")


def main():
    """Run the master search."""
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    searcher = AHRQMasterSearch()
    searcher.run_all_searches()
    searcher.save_results()
    
    print("\n" + "="*80)
    print("AHRQ MASTER SEARCH COMPLETED")
    print("="*80)


if __name__ == "__main__":
    main()