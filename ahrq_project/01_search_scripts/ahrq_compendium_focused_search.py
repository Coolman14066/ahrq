#!/usr/bin/env python3
"""
AHRQ Compendium Focused Search - Finding ALL Compendium mentions
Uses parallel search strategies to maximize coverage
"""

import requests
import json
import pandas as pd
from datetime import datetime
import time
import os
from typing import Dict, List, Tuple, Set
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

class CompendiumSearchAgent:
    """Base class for search agents"""
    def __init__(self, agent_name: str, api_key: str):
        self.agent_name = agent_name
        self.api_key = api_key
        self.base_url = "https://api.elsevier.com/content/search/scopus"
        self.results = []
        self.queries_executed = []
        
    def search(self, query: str, description: str = "") -> List[Dict]:
        """Execute a search query"""
        all_entries = []
        start = 0
        max_results = 200
        
        # Add year filter
        full_query = f"({query}) AND PUBYEAR > 2020 AND PUBYEAR < 2026"
        
        while start < max_results:
            params = {
                'query': full_query,
                'apiKey': self.api_key,
                'httpAccept': 'application/json',
                'count': 25,  # API limit
                'start': start,
                'view': 'STANDARD'
            }
            
            try:
                response = requests.get(self.base_url, params=params, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    search_results = data.get('search-results', {})
                    
                    total = int(search_results.get('opensearch:totalResults', 0))
                    entries = search_results.get('entry', [])
                    
                    if not entries:
                        break
                        
                    all_entries.extend(entries)
                    
                    # Log query performance
                    self.queries_executed.append({
                        'query': query,
                        'description': description,
                        'total_available': total,
                        'retrieved': len(all_entries)
                    })
                    
                    if len(all_entries) >= total or len(entries) < 25:
                        break
                        
                    start += len(entries)
                    time.sleep(0.5)  # Rate limiting
                    
                else:
                    logging.error(f"{self.agent_name} - Error {response.status_code} for query: {query}")
                    break
                    
            except Exception as e:
                logging.error(f"{self.agent_name} - Exception: {e}")
                break
                
        return all_entries
    
    def extract_info(self, entry: Dict) -> Dict:
        """Extract article information"""
        info = {
            'eid': entry.get('eid', ''),
            'doi': entry.get('prism:doi', ''),
            'title': entry.get('dc:title', ''),
            'authors': entry.get('dc:creator', ''),
            'year': entry.get('prism:coverDate', '')[:4] if entry.get('prism:coverDate') else '',
            'journal': entry.get('prism:publicationName', ''),
            'citations': entry.get('citedby-count', 0),
            'abstract': entry.get('dc:description', ''),
            'agent': self.agent_name
        }
        
        # Extract affiliations
        if 'affiliation' in entry:
            affiliations = entry['affiliation']
            if isinstance(affiliations, list):
                info['affiliation'] = '; '.join([aff.get('affilname', '') for aff in affiliations[:2]])
            elif isinstance(affiliations, dict):
                info['affiliation'] = affiliations.get('affilname', '')
        else:
            info['affiliation'] = ''
            
        return info


class DirectMentionsAgent(CompendiumSearchAgent):
    """Agent 1: Searches for direct Compendium mentions"""
    
    def run(self):
        queries = [
            # Exact phrases
            ('TITLE-ABS-KEY("AHRQ Compendium")', 'Exact phrase'),
            ('TITLE-ABS-KEY("AHRQ Compendium of U.S. Health Systems")', 'Full name'),
            ('TITLE-ABS-KEY("AHRQ Compendium of US Health Systems")', 'Full name variant'),
            ('TITLE-ABS-KEY("Agency for Healthcare Research and Quality Compendium")', 'Agency full name'),
            
            # Fuzzy matching
            ('TITLE-ABS-KEY("AHRQ Compendium"~2)', 'Fuzzy match 2 chars'),
            ('TITLE-ABS-KEY("AHRQ Compend*")', 'Wildcard'),
            
            # All fields
            ('ALL("AHRQ Compendium")', 'All fields search'),
            ('ALL("Compendium of U.S. Health Systems")', 'All fields full name'),
            
            # Proximity variations
            ('TITLE-ABS-KEY(AHRQ W/3 Compendium)', 'Close proximity'),
            ('TITLE-ABS-KEY(AHRQ W/10 Compendium)', 'Medium proximity'),
            ('TITLE-ABS-KEY("Agency for Healthcare" W/15 Compendium)', 'Agency proximity'),
        ]
        
        for query, desc in queries:
            logging.info(f"{self.agent_name} - Searching: {desc}")
            entries = self.search(query, desc)
            
            for entry in entries:
                article = self.extract_info(entry)
                article['search_type'] = 'direct_mention'
                article['confidence'] = 95  # High confidence
                self.results.append(article)
            
            time.sleep(1)  # Rate limiting


class FundingAcknowledgmentsAgent(CompendiumSearchAgent):
    """Agent 2: Searches funding and acknowledgments"""
    
    def run(self):
        queries = [
            # Funding searches
            ('FUND-ALL("AHRQ" AND "Compendium")', 'Funding with Compendium'),
            ('FUND-ALL("AHRQ Compendium")', 'Funding exact phrase'),
            ('FUND-SPONSOR("Agency for Healthcare Research and Quality") AND TITLE-ABS("Compendium")', 'AHRQ sponsor + Compendium'),
            ('FUND-ALL("AHRQ" W/10 "health system* database")', 'AHRQ funding + database'),
            
            # Contract/grant searches
            ('FUND-ALL("HHSA" AND "health system*")', 'HHS contracts'),
            ('FUND-NO("290-*") AND TITLE-ABS("health system*")', 'AHRQ grant numbers'),
        ]
        
        for query, desc in queries:
            logging.info(f"{self.agent_name} - Searching: {desc}")
            entries = self.search(query, desc)
            
            for entry in entries:
                article = self.extract_info(entry)
                article['search_type'] = 'funding_acknowledgment'
                article['confidence'] = 85  # Medium-high confidence
                self.results.append(article)
            
            time.sleep(1)


class MethodologyPatternAgent(CompendiumSearchAgent):
    """Agent 3: Searches for methodology patterns"""
    
    def run(self):
        queries = [
            # Data source descriptions
            ('TITLE-ABS("identified health systems using" W/5 "national database")', 'ID systems pattern'),
            ('TITLE-ABS("hospital affiliation* were determined" W/10 "database")', 'Affiliation pattern'),
            ('TITLE-ABS("comprehensive database of U.S. health systems")', 'Database description'),
            ('TITLE-ABS("national inventory of health system*")', 'Inventory pattern'),
            
            # Specific methodologies
            ('TITLE-ABS("we used" W/5 "AHRQ" W/10 "identify health system*")', 'Used AHRQ pattern'),
            ('TITLE-ABS("hospital system linkage" W/10 "data")', 'Linkage pattern'),
            ('TITLE-ABS("system membership was defined" W/15 "agency")', 'Membership pattern'),
            
            # Year-specific patterns
            ('TITLE-ABS("2018 national health system* data")', '2018 data'),
            ('TITLE-ABS("2022 hospital system affiliation*")', '2022 data'),
            ('TITLE-ABS("2023 health system* database")', '2023 data'),
        ]
        
        for query, desc in queries:
            logging.info(f"{self.agent_name} - Searching: {desc}")
            entries = self.search(query, desc)
            
            for entry in entries:
                article = self.extract_info(entry)
                article['search_type'] = 'methodology_pattern'
                article['confidence'] = 70  # Medium confidence
                self.results.append(article)
            
            time.sleep(1)


class KeywordsIndexAgent(CompendiumSearchAgent):
    """Agent 4: Searches author keywords and index terms"""
    
    def run(self):
        queries = [
            # Author keywords
            ('AUTHKEY("AHRQ Compendium")', 'Author keyword exact'),
            ('AUTHKEY("health system* database" AND AHRQ)', 'Author keyword pattern'),
            ('AUTHKEY("hospital affiliation data")', 'Affiliation data keyword'),
            ('AUTHKEY("Compendium" AND "health")', 'Compendium keyword'),
            
            # Index terms
            ('INDEXTERMS("health system*" AND "database*" AND "United States")', 'Index pattern'),
            ('INDEXTERMS("hospital network*" AND "identification")', 'Network identification'),
            ('INDEXTERMS("healthcare consolidation" AND "measurement")', 'Consolidation measurement'),
            ('INDEXTERMS("AHRQ")', 'AHRQ indexed'),
        ]
        
        for query, desc in queries:
            logging.info(f"{self.agent_name} - Searching: {desc}")
            entries = self.search(query, desc)
            
            for entry in entries:
                article = self.extract_info(entry)
                article['search_type'] = 'keyword_index'
                article['confidence'] = 80  # Medium-high confidence
                self.results.append(article)
            
            time.sleep(1)


class CitationNetworkAgent(CompendiumSearchAgent):
    """Agent 5: Explores citation networks"""
    
    def run(self):
        queries = [
            # Direct references
            ('REF("AHRQ Compendium")', 'Reference exact'),
            ('REF("Agency for Healthcare Research and Quality" AND Compendium)', 'Reference agency'),
            ('REF("Compendium of U.S. Health Systems")', 'Reference full name'),
            ('REF("Compendium of US Health Systems")', 'Reference variant'),
            
            # Known papers
            ('REF("Consolidation and Mergers among Health Systems in 2021")', 'Known paper 1'),
            ('REF("What Explains Hospital System Entry")', 'Known paper 2'),
            ('REF("Geographic Variation in Consolidation")', 'Known paper 3'),
            
            # URL references
            ('REF("ahrq.gov" AND "compendium")', 'AHRQ website reference'),
            ('REF("github.com" AND "AHRQ")', 'GitHub reference'),
        ]
        
        for query, desc in queries:
            logging.info(f"{self.agent_name} - Searching: {desc}")
            entries = self.search(query, desc)
            
            for entry in entries:
                article = self.extract_info(entry)
                article['search_type'] = 'citation_network'
                article['confidence'] = 90  # High confidence
                self.results.append(article)
            
            time.sleep(1)


class IndirectReferenceAgent(CompendiumSearchAgent):
    """Agent 6: Detects indirect references"""
    
    def run(self):
        queries = [
            # Indirect patterns
            ('TITLE-ABS("federal health system* database") NOT TITLE-ABS("VA" OR "Veterans")', 'Federal database'),
            ('TITLE-ABS("national hospital affiliation data") AND PUBYEAR > 2020', 'National affiliation'),
            ('TITLE-ABS("Mathematica" W/10 "health system*" W/10 "data")', 'Mathematica data'),
            
            # Descriptive patterns
            ('TITLE-ABS("comprehensive list" W/10 "health system*" W/10 "U.S.")', 'Comprehensive list'),
            ('TITLE-ABS("we identified" W/5 "[0-9]+" W/5 "health system*")', 'Number pattern'),
            ('TITLE-ABS("hospital* were linked" W/10 "system*" W/10 "using")', 'Linking pattern'),
            
            # Alternative names
            ('TITLE-ABS("AHRQ health system* data")', 'AHRQ data'),
            ('TITLE-ABS("hospital linkage file") NOT TITLE-ABS("Medicare")', 'Linkage file'),
        ]
        
        for query, desc in queries:
            logging.info(f"{self.agent_name} - Searching: {desc}")
            entries = self.search(query, desc)
            
            for entry in entries:
                article = self.extract_info(entry)
                article['search_type'] = 'indirect_reference'
                article['confidence'] = 60  # Lower confidence
                self.results.append(article)
            
            time.sleep(1)


class CompendiumMasterSearch:
    """Orchestrates all search agents"""
    
    def __init__(self):
        self.api_key = "7cb67bc87041113e16b3604ec1d33cd6"
        self.all_results = []
        self.seen_eids = set()
        
        # Setup logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs("../04_results/search_logs", exist_ok=True)
        logging.basicConfig(
            filename=f'../04_results/search_logs/compendium_search_{timestamp}.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        self.timestamp = timestamp
        
    def run_parallel_search(self):
        """Run all agents in parallel"""
        print("="*80)
        print("AHRQ COMPENDIUM COMPREHENSIVE SEARCH")
        print("="*80)
        print("\nLaunching 6 parallel search agents...")
        
        # Create agents
        agents = [
            DirectMentionsAgent("Agent1_DirectMentions", self.api_key),
            FundingAcknowledgmentsAgent("Agent2_Funding", self.api_key),
            MethodologyPatternAgent("Agent3_Methodology", self.api_key),
            KeywordsIndexAgent("Agent4_Keywords", self.api_key),
            CitationNetworkAgent("Agent5_Citations", self.api_key),
            IndirectReferenceAgent("Agent6_Indirect", self.api_key)
        ]
        
        # Run agents in parallel
        with ThreadPoolExecutor(max_workers=6) as executor:
            # Submit all agents
            future_to_agent = {executor.submit(agent.run): agent for agent in agents}
            
            # Process results as they complete
            for future in as_completed(future_to_agent):
                agent = future_to_agent[future]
                try:
                    future.result()
                    print(f"✅ {agent.agent_name} completed - Found {len(agent.results)} articles")
                    
                    # Collect unique results
                    for article in agent.results:
                        if article['eid'] and article['eid'] not in self.seen_eids:
                            self.all_results.append(article)
                            self.seen_eids.add(article['eid'])
                            
                except Exception as e:
                    print(f"❌ {agent.agent_name} failed: {e}")
                    self.logger.error(f"{agent.agent_name} failed: {e}")
        
        print(f"\nTotal unique articles found: {len(self.all_results)}")
        
    def calculate_final_confidence(self, article: Dict) -> float:
        """Calculate final confidence score"""
        base_confidence = article['confidence']
        
        # Boost confidence for multiple signals
        title_lower = article['title'].lower()
        
        # Direct mentions boost
        if 'ahrq compendium' in title_lower:
            base_confidence = min(base_confidence + 10, 100)
        elif 'compendium' in title_lower and 'health system' in title_lower:
            base_confidence = min(base_confidence + 5, 100)
        
        # Abstract check (if available)
        if article.get('abstract'):
            abstract_lower = article['abstract'].lower()
            if 'ahrq compendium' in abstract_lower:
                base_confidence = min(base_confidence + 5, 100)
        
        return base_confidence
    
    def deduplicate_against_reference(self):
        """Deduplicate against existing reference CSV"""
        try:
            ref_df = pd.read_csv("../02_data_sources/ahrq_reference.csv", encoding='utf-8-sig')
            
            # Normalize DOIs in reference
            ref_dois = set()
            if 'DOI_URL' in ref_df.columns:
                for doi in ref_df['DOI_URL'].dropna():
                    # Extract core DOI
                    doi_str = str(doi).lower()
                    if '10.' in doi_str:
                        start = doi_str.find('10.')
                        core_doi = doi_str[start:].strip()
                        ref_dois.add(core_doi)
            
            # Mark duplicates
            for article in self.all_results:
                if article['doi']:
                    doi_lower = article['doi'].lower()
                    article['is_duplicate'] = doi_lower in ref_dois
                else:
                    article['is_duplicate'] = False
                    
        except Exception as e:
            self.logger.error(f"Could not deduplicate: {e}")
            for article in self.all_results:
                article['is_duplicate'] = False
    
    def save_results(self):
        """Save all results with proper categorization"""
        if not self.all_results:
            print("No results to save.")
            return
        
        # Calculate final confidence scores
        for article in self.all_results:
            article['final_confidence'] = self.calculate_final_confidence(article)
        
        # Deduplicate
        self.deduplicate_against_reference()
        
        # Create DataFrame
        df = pd.DataFrame(self.all_results)
        df = df.sort_values('final_confidence', ascending=False)
        
        # Save results
        output_dir = "../04_results/compendium_search"
        os.makedirs(output_dir, exist_ok=True)
        
        # All results
        all_path = os.path.join(output_dir, f"compendium_all_results_{self.timestamp}.csv")
        df.to_csv(all_path, index=False, encoding='utf-8-sig')
        print(f"\n✅ All results saved to: {all_path}")
        
        # High confidence (>= 80)
        high_conf = df[df['final_confidence'] >= 80]
        if len(high_conf) > 0:
            high_path = os.path.join(output_dir, f"compendium_high_confidence_{self.timestamp}.csv")
            high_conf.to_csv(high_path, index=False, encoding='utf-8-sig')
            print(f"✅ High confidence results: {high_path} ({len(high_conf)} articles)")
        
        # New discoveries only
        new_only = df[df['is_duplicate'] == False]
        if len(new_only) > 0:
            new_path = os.path.join(output_dir, f"compendium_new_discoveries_{self.timestamp}.csv")
            new_only.to_csv(new_path, index=False, encoding='utf-8-sig')
            print(f"✅ New discoveries: {new_path} ({len(new_only)} articles)")
        
        # Generate summary report
        self.generate_summary_report(df)
    
    def generate_summary_report(self, df: pd.DataFrame):
        """Generate comprehensive summary report"""
        summary_path = f"../04_results/compendium_search/compendium_search_summary_{self.timestamp}.txt"
        
        with open(summary_path, 'w') as f:
            f.write("AHRQ COMPENDIUM COMPREHENSIVE SEARCH SUMMARY\n")
            f.write("="*60 + "\n")
            f.write(f"Search completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("OVERALL RESULTS\n")
            f.write("-"*40 + "\n")
            f.write(f"Total unique articles found: {len(df)}\n")
            f.write(f"New discoveries (not in reference): {len(df[df['is_duplicate'] == False])}\n")
            f.write(f"Duplicates (already in reference): {len(df[df['is_duplicate'] == True])}\n\n")
            
            f.write("CONFIDENCE DISTRIBUTION\n")
            f.write("-"*40 + "\n")
            f.write(f"Very High (95-100): {len(df[df['final_confidence'] >= 95])} articles\n")
            f.write(f"High (80-94): {len(df[(df['final_confidence'] >= 80) & (df['final_confidence'] < 95)])} articles\n")
            f.write(f"Medium (70-79): {len(df[(df['final_confidence'] >= 70) & (df['final_confidence'] < 80)])} articles\n")
            f.write(f"Low (60-69): {len(df[(df['final_confidence'] >= 60) & (df['final_confidence'] < 70)])} articles\n")
            f.write(f"Very Low (<60): {len(df[df['final_confidence'] < 60])} articles\n\n")
            
            f.write("RESULTS BY SEARCH TYPE\n")
            f.write("-"*40 + "\n")
            search_type_counts = df['search_type'].value_counts()
            for stype, count in search_type_counts.items():
                f.write(f"{stype}: {count} articles\n")
            
            f.write("\nRESULTS BY AGENT\n")
            f.write("-"*40 + "\n")
            agent_counts = df['agent'].value_counts()
            for agent, count in agent_counts.items():
                f.write(f"{agent}: {count} articles\n")
            
            f.write("\nTOP 20 HIGH-CONFIDENCE ARTICLES\n")
            f.write("="*60 + "\n")
            
            top_articles = df.nlargest(20, 'final_confidence')
            for idx, row in top_articles.iterrows():
                f.write(f"\n[{row['final_confidence']}%] {row['title'][:80]}...\n")
                f.write(f"  Year: {row['year']} | DOI: {row['doi']}\n")
                f.write(f"  Type: {row['search_type']} | Agent: {row['agent']}\n")
                if row['is_duplicate']:
                    f.write(f"  Status: DUPLICATE (already in reference)\n")
                else:
                    f.write(f"  Status: NEW DISCOVERY\n")
        
        print(f"✅ Summary report saved to: {summary_path}")


def main():
    """Run the comprehensive Compendium search"""
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    searcher = CompendiumMasterSearch()
    
    # Run parallel search
    searcher.run_parallel_search()
    
    # Save and report results
    searcher.save_results()
    
    print("\n" + "="*80)
    print("SEARCH COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()