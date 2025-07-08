#!/usr/bin/env python3
"""
AHRQ Master Search Script - Enhanced Version
Comprehensive search for AHRQ Compendium articles with advanced features
"""

import requests
import json
import pandas as pd
from datetime import datetime
import time
import os
from typing import Dict, List, Tuple, Set, Optional
from urllib.parse import quote
import logging
from collections import defaultdict
import re

class AHRQMasterSearchEnhanced:
    def __init__(self, config_path: str = "search_config_enhanced.json"):
        """Initialize with enhanced configuration."""
        with open(config_path, 'r') as f:
            self.config = json.load(f)
        
        self.api_key = self.config['api_key']
        self.base_url = "https://api.elsevier.com/content/search/scopus"
        self.all_results = []
        self.seen_eids = set()
        self.query_performance = defaultdict(dict)
        self.discovered_patterns = defaultdict(set)
        
        # Setup logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        logging.basicConfig(
            filename=f'../04_results/search_logs/ahrq_search_log_{timestamp}.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
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
    
    def search_scopus_with_pagination(self, query: str, tier: str) -> List[Dict]:
        """Execute search with full pagination support."""
        all_entries = []
        start = 0
        cursor = None
        use_cursor = False
        total_available = 0
        
        self.logger.info(f"Starting search for query: {query[:100]}...")
        
        while True:
            params = {
                'query': query,
                'apiKey': self.api_key,
                'httpAccept': 'application/json',
                'count': self.config['search_parameters']['results_per_query'],
                'sort': self.config['search_parameters']['sort_by'],
                'view': self.config['search_parameters']['view']
            }
            
            # Use cursor if available and enabled
            if use_cursor and cursor:
                params['cursor'] = cursor
            else:
                params['start'] = start
            
            try:
                response = requests.get(self.base_url, params=params, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    search_results = data.get('search-results', {})
                    
                    # Get total results on first request
                    if start == 0:
                        total_available = int(search_results.get('opensearch:totalResults', 0))
                        self.logger.info(f"Total available results: {total_available}")
                    
                    # Extract entries
                    entries = search_results.get('entry', [])
                    if not entries:
                        break
                    
                    all_entries.extend(entries)
                    
                    # Check for cursor support
                    if self.config['search_parameters'].get('enable_cursor', False):
                        next_link = None
                        for link in search_results.get('link', []):
                            if link.get('@ref') == 'next':
                                next_link = link.get('@href', '')
                                # Extract cursor from next link
                                if 'cursor=' in next_link:
                                    cursor = next_link.split('cursor=')[1].split('&')[0]
                                    use_cursor = True
                                break
                        
                        if not next_link:
                            break
                    else:
                        # Traditional pagination
                        if len(all_entries) >= total_available:
                            break
                        
                        # Check if we've hit the limit
                        max_results = self.config['search_parameters'].get('max_results_per_query', 5000)
                        if len(all_entries) >= max_results:
                            self.logger.warning(f"Hit max results limit of {max_results}")
                            break
                        
                        start += len(entries)
                        
                        # Stop if no more results
                        if len(entries) < self.config['search_parameters']['results_per_query']:
                            break
                    
                    time.sleep(0.5)  # Rate limiting
                    
                else:
                    self.logger.error(f"Error {response.status_code}: {response.text}")
                    break
                    
            except Exception as e:
                self.logger.error(f"Request failed: {e}")
                break
        
        # Record performance
        self.query_performance[tier][query] = {
            'total_available': total_available,
            'total_retrieved': len(all_entries),
            'coverage': len(all_entries) / total_available if total_available > 0 else 0
        }
        
        self.logger.info(f"Retrieved {len(all_entries)} of {total_available} available results")
        return all_entries
    
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
            'scopus_link': '',
            'affiliation': ''
        }
        
        # Extract author keywords
        if 'authkeywords' in entry:
            keywords = entry['authkeywords'].get('author-keyword', [])
            if isinstance(keywords, list):
                info['keywords'] = '; '.join([k.get('$', '') for k in keywords])
            elif isinstance(keywords, dict):
                info['keywords'] = keywords.get('$', '')
        
        # Extract affiliations
        if 'affiliation' in entry:
            affiliations = entry['affiliation']
            if isinstance(affiliations, list):
                info['affiliation'] = '; '.join([aff.get('affilname', '') for aff in affiliations])
            elif isinstance(affiliations, dict):
                info['affiliation'] = affiliations.get('affilname', '')
        
        # Get Scopus link
        links = entry.get('link', [])
        for link in links:
            if link.get('@ref') == 'scopus':
                info['scopus_link'] = link.get('@href', '')
                break
        
        # Extract patterns for learning
        self._extract_patterns(info)
        
        return info
    
    def _extract_patterns(self, article: Dict):
        """Extract patterns from article for iterative learning."""
        # Extract author patterns
        if article['authors']:
            authors = article['authors'].split(';')
            for author in authors[:3]:  # Top 3 authors
                self.discovered_patterns['authors'].add(author.strip())
        
        # Extract journal patterns
        if article['journal']:
            self.discovered_patterns['journals'].add(article['journal'])
        
        # Extract keyword patterns
        if article['keywords']:
            keywords = article['keywords'].split(';')
            for keyword in keywords:
                self.discovered_patterns['keywords'].add(keyword.strip().lower())
        
        # Extract affiliation patterns
        if article['affiliation']:
            affiliations = article['affiliation'].split(';')
            for affiliation in affiliations[:2]:  # Top 2 affiliations
                self.discovered_patterns['affiliations'].add(affiliation.strip())
        
        # Extract methodology phrases from abstract
        if article['abstract']:
            abstract_lower = article['abstract'].lower()
            
            # Common methodology phrases
            method_phrases = [
                r'using (?:the )?ahrq[^.]{0,50}',
                r'ahrq[^.]{0,30}to identify',
                r'based on[^.]{0,30}ahrq',
                r'ahrq[^.]{0,30}database',
                r'compendium[^.]{0,30}define'
            ]
            
            for pattern in method_phrases:
                matches = re.findall(pattern, abstract_lower)
                for match in matches:
                    self.discovered_patterns['methodology'].add(match.strip())
    
    def calculate_relevance_score(self, article: Dict, query_tier: str) -> float:
        """Calculate enhanced relevance score based on multiple factors."""
        score = 0.0
        
        # Base score by tier
        tier_scores = {
            'tier_1_direct': 10.0,
            'tier_2_proximity': 8.0,
            'tier_3_wildcards': 6.0,
            'tier_4_references': 4.0,
            'tier_5_specific_citations': 3.0,
            'tier_6_year_specific': 9.0,
            'tier_7_advanced_proximity': 7.0,
            'tier_8_network_based': 5.0,
            'tier_9_methodological': 6.0
        }
        score += tier_scores.get(query_tier, 1.0)
        
        # Check title
        title = article.get('title', '').lower()
        if 'ahrq' in title and 'compendium' in title:
            score += 5.0
        elif 'ahrq' in title or 'compendium' in title:
            score += 2.0
        
        # Check abstract with enhanced scoring
        abstract = article.get('abstract', '').lower()
        
        # Count AHRQ mentions
        ahrq_count = abstract.count('ahrq') + abstract.count('agency for healthcare research')
        score += min(ahrq_count * 0.5, 3.0)
        
        # Count Compendium mentions
        compendium_count = abstract.count('compendium') + abstract.count('compendia')
        score += min(compendium_count * 0.5, 3.0)
        
        # Bonus for specific phrases
        bonus_phrases = [
            'ahrq compendium',
            'health systems compendium',
            'hospital linkage file',
            'identify health systems',
            'system affiliation'
        ]
        
        for phrase in bonus_phrases:
            if phrase in abstract:
                score += 1.0
        
        # Check keywords
        keywords = article.get('keywords', '').lower()
        if 'ahrq' in keywords:
            score += 1.0
        if 'compendium' in keywords:
            score += 1.0
        if 'health system' in keywords:
            score += 0.5
        
        # Recency bonus
        year = article.get('year', '')
        if year:
            try:
                year_int = int(year)
                if year_int >= 2024:
                    score += 1.5
                elif year_int >= 2023:
                    score += 1.0
                elif year_int >= 2022:
                    score += 0.5
            except:
                pass
        
        # Citation bonus (normalized)
        citations = int(article.get('citations', 0))
        if citations > 0:
            score += min(citations / 10, 2.0)
        
        # Network bonus
        if article['authors'] in str(self.discovered_patterns['authors']):
            score += 0.5
        if article['journal'] in self.discovered_patterns['journals']:
            score += 0.5
        
        return round(score, 2)
    
    def run_all_searches(self, iteration: int = 1):
        """Run all configured searches with full pagination."""
        print(f"\n{'='*80}")
        print(f"AHRQ MASTER SEARCH - ITERATION {iteration}")
        print(f"{'='*80}")
        
        total_queries = sum(len(queries['queries']) for queries in self.config['search_queries'].values())
        query_count = 0
        iteration_new_count = 0
        
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
                
                # Search with full pagination
                entries = self.search_scopus_with_pagination(full_query, tier_name)
                
                # Process entries
                new_articles = 0
                for entry in entries:
                    article = self.extract_article_info(entry)
                    if article and article['eid'] not in self.seen_eids:
                        article['query_tier'] = tier_name
                        article['search_query'] = query
                        article['relevance_score'] = self.calculate_relevance_score(article, tier_name)
                        article['iteration'] = iteration
                        
                        self.all_results.append(article)
                        self.seen_eids.add(article['eid'])
                        new_articles += 1
                        iteration_new_count += 1
                
                print(f"   New unique articles from this query: {new_articles}")
                time.sleep(2)  # Rate limiting between queries
        
        # Sort by relevance score
        self.all_results.sort(key=lambda x: x['relevance_score'], reverse=True)
        
        print(f"\nIteration {iteration} complete. New articles found: {iteration_new_count}")
        return iteration_new_count
    
    def generate_pattern_based_queries(self) -> List[Tuple[str, str]]:
        """Generate new queries based on discovered patterns."""
        new_queries = []
        
        # Author-based queries
        top_authors = list(self.discovered_patterns['authors'])[:5]
        for author in top_authors:
            query = f'AUTHOR-NAME("{author}") AND REF(AHRQ OR compendium)'
            new_queries.append((query, "pattern_author"))
        
        # Journal-based queries
        top_journals = list(self.discovered_patterns['journals'])[:5]
        for journal in top_journals:
            query = f'SRCTITLE("{journal}") AND TITLE-ABS-KEY(AHRQ AND "health system*")'
            new_queries.append((query, "pattern_journal"))
        
        # Methodology-based queries
        method_phrases = list(self.discovered_patterns['methodology'])[:5]
        for phrase in method_phrases:
            # Clean and create query
            clean_phrase = phrase.replace('ahrq', '').strip()
            if len(clean_phrase) > 10:
                query = f'TITLE-ABS("{clean_phrase}" AND AHRQ)'
                new_queries.append((query, "pattern_methodology"))
        
        return new_queries
    
    def run_iterative_discovery(self):
        """Run iterative discovery process."""
        iteration = 1
        max_iterations = self.config['iteration_parameters']['max_iterations']
        min_discoveries = self.config['iteration_parameters']['min_new_discoveries']
        
        while iteration <= max_iterations:
            # Run standard searches
            new_count = self.run_all_searches(iteration)
            
            # Generate and run pattern-based queries if enabled
            if iteration > 1 and self.config['iteration_parameters']['hypothesis_generation']:
                print(f"\n{'='*60}")
                print(f"PATTERN-BASED DISCOVERY - ITERATION {iteration}")
                print('='*60)
                
                pattern_queries = self.generate_pattern_based_queries()
                
                for query, query_type in pattern_queries:
                    print(f"\nPattern Query ({query_type}): {query[:100]}...")
                    
                    full_query = self.build_query_string(query, query_type)
                    entries = self.search_scopus_with_pagination(full_query, query_type)
                    
                    new_articles = 0
                    for entry in entries:
                        article = self.extract_article_info(entry)
                        if article and article['eid'] not in self.seen_eids:
                            article['query_tier'] = f"pattern_{query_type}"
                            article['search_query'] = query
                            article['relevance_score'] = self.calculate_relevance_score(article, query_type)
                            article['iteration'] = iteration
                            
                            self.all_results.append(article)
                            self.seen_eids.add(article['eid'])
                            new_articles += 1
                            new_count += 1
                    
                    print(f"   New articles: {new_articles}")
                    time.sleep(2)
            
            # Check if we should continue
            if new_count < min_discoveries and iteration > 1:
                print(f"\nStopping: Only {new_count} new discoveries (threshold: {min_discoveries})")
                break
            
            iteration += 1
        
        # Final sort
        self.all_results.sort(key=lambda x: x['relevance_score'], reverse=True)
    
    def save_results(self):
        """Save enhanced search results."""
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
        full_path = os.path.join(output_dir, f"ahrq_enhanced_search_results_{timestamp}.csv")
        df.to_csv(full_path, index=False, encoding='utf-8-sig')
        print(f"\n✅ Full results saved to: {full_path}")
        print(f"   Total unique articles found: {len(df)}")
        
        # High relevance only (score >= 8)
        high_relevance = df[df['relevance_score'] >= 8.0]
        if len(high_relevance) > 0:
            high_path = os.path.join(output_dir, f"ahrq_enhanced_high_relevance_{timestamp}.csv")
            high_relevance.to_csv(high_path, index=False, encoding='utf-8-sig')
            print(f"✅ High relevance results saved to: {high_path}")
            print(f"   High relevance articles: {len(high_relevance)}")
        
        # Save comprehensive summary
        summary_path = os.path.join(output_dir, f"ahrq_enhanced_search_summary_{timestamp}.txt")
        with open(summary_path, 'w') as f:
            f.write("AHRQ ENHANCED MASTER SEARCH SUMMARY\n")
            f.write("="*50 + "\n")
            f.write(f"Search completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Total unique articles found: {len(df)}\n\n")
            
            # By tier
            f.write("Results by Search Tier:\n")
            tier_counts = df['query_tier'].value_counts()
            for tier, count in tier_counts.items():
                f.write(f"  {tier}: {count} articles\n")
            
            # By iteration
            if 'iteration' in df.columns:
                f.write("\nResults by Iteration:\n")
                iter_counts = df['iteration'].value_counts().sort_index()
                for iteration, count in iter_counts.items():
                    f.write(f"  Iteration {iteration}: {count} articles\n")
            
            # By year
            f.write("\nResults by Year:\n")
            year_counts = df['year'].value_counts().sort_index()
            for year, count in year_counts.items():
                if year:  # Skip empty years
                    f.write(f"  {year}: {count} articles\n")
            
            # By relevance score
            f.write("\nRelevance Score Distribution:\n")
            f.write(f"  Score >= 15: {len(df[df['relevance_score'] >= 15])} articles\n")
            f.write(f"  Score 12-15: {len(df[(df['relevance_score'] >= 12) & (df['relevance_score'] < 15)])} articles\n")
            f.write(f"  Score 10-12: {len(df[(df['relevance_score'] >= 10) & (df['relevance_score'] < 12)])} articles\n")
            f.write(f"  Score 8-10: {len(df[(df['relevance_score'] >= 8) & (df['relevance_score'] < 10)])} articles\n")
            f.write(f"  Score 5-8: {len(df[(df['relevance_score'] >= 5) & (df['relevance_score'] < 8)])} articles\n")
            f.write(f"  Score < 5: {len(df[df['relevance_score'] < 5])} articles\n")
            
            # Top 20 by relevance
            f.write("\nTop 20 Articles by Relevance:\n")
            for idx, row in df.head(20).iterrows():
                f.write(f"\n{idx+1}. [{row['relevance_score']}] {row['title'][:70]}...\n")
                f.write(f"   Year: {row['year']} | Journal: {row['journal']}\n")
                f.write(f"   DOI: {row['doi']}\n")
                f.write(f"   Query: {row['search_query'][:50]}...\n")
            
            # Query performance
            f.write("\n\nQUERY PERFORMANCE ANALYSIS\n")
            f.write("="*50 + "\n")
            
            for tier, queries in self.query_performance.items():
                f.write(f"\n{tier}:\n")
                for query, stats in queries.items():
                    f.write(f"  Query: {query[:60]}...\n")
                    f.write(f"    Available: {stats['total_available']}, Retrieved: {stats['total_retrieved']}, Coverage: {stats['coverage']:.1%}\n")
            
            # Discovered patterns
            f.write("\n\nDISCOVERED PATTERNS\n")
            f.write("="*50 + "\n")
            
            f.write(f"\nTop Authors ({len(self.discovered_patterns['authors'])} total):\n")
            for author in list(self.discovered_patterns['authors'])[:10]:
                f.write(f"  - {author}\n")
            
            f.write(f"\nTop Journals ({len(self.discovered_patterns['journals'])} total):\n")
            for journal in list(self.discovered_patterns['journals'])[:10]:
                f.write(f"  - {journal}\n")
            
            f.write(f"\nTop Keywords ({len(self.discovered_patterns['keywords'])} total):\n")
            for keyword in list(self.discovered_patterns['keywords'])[:10]:
                f.write(f"  - {keyword}\n")
            
            f.write(f"\nTop Affiliations ({len(self.discovered_patterns['affiliations'])} total):\n")
            for affiliation in list(self.discovered_patterns['affiliations'])[:10]:
                f.write(f"  - {affiliation}\n")
        
        print(f"✅ Enhanced summary saved to: {summary_path}")
        
        # Save patterns for future use
        patterns_path = os.path.join(output_dir, f"ahrq_discovered_patterns_{timestamp}.json")
        patterns_dict = {k: list(v) for k, v in self.discovered_patterns.items()}
        with open(patterns_path, 'w') as f:
            json.dump(patterns_dict, f, indent=2)
        print(f"✅ Discovered patterns saved to: {patterns_path}")


def main():
    """Run the enhanced master search."""
    # Create necessary directories
    os.makedirs("../04_results/search_results", exist_ok=True)
    os.makedirs("../04_results/search_logs", exist_ok=True)
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("="*80)
    print("AHRQ ENHANCED MASTER SEARCH - STARTING")
    print("="*80)
    print("\nFeatures enabled:")
    print("- Full pagination (up to 5,000 results per query)")
    print("- 9 search tiers with advanced operators")
    print("- Iterative discovery with pattern learning")
    print("- Comprehensive logging and performance tracking")
    print("- Enhanced relevance scoring")
    
    searcher = AHRQMasterSearchEnhanced()
    searcher.run_iterative_discovery()
    searcher.save_results()
    
    print("\n" + "="*80)
    print("AHRQ ENHANCED MASTER SEARCH COMPLETED")
    print("="*80)


if __name__ == "__main__":
    main()