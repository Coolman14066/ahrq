#!/usr/bin/env python3
"""
AHRQ Compendium Discovery Engine (v8)

Objective: Discover NEW papers (2021+) that are relevant to the AHRQ Compendium,
           excluding papers that have already been manually curated.

Strategy:
1.  Loads a list of known papers ('ahrq_reference.csv') to use as an exclusion list.
2.  Executes three focused queries: High-Precision, Direct Reference, and a powerful
    "Citation Chaining" query built from the DOIs in the reference file.
3.  Combines all results, de-duplicates them, and then filters out any known papers.
4.  Saves only the newly discovered papers to a CSV file.
"""

import requests
import urllib.parse
import pandas as pd
from datetime import datetime
import time
import os

class AHRQDiscoveryEngine:
    def __init__(self, reference_file='ahrq_reference.csv'):
        """Initializes the engine and loads the exclusion list."""
        self.api_key = "5251ded319b70f014c96efd294d62402"
        self.base_url = "https://api.elsevier.com/content/search/scopus"
        
        self.raw_results = []
        self.current_year = datetime.now().year
        
        # Load the exclusion list of known papers
        self.exclusion_dois, self.exclusion_titles = self.load_exclusion_list(reference_file)

    def load_exclusion_list(self, csv_filename: str) -> tuple[set, set]:
        """Loads DOIs and titles from the reference CSV for filtering."""
        if not os.path.exists(csv_filename):
            print(f"⚠️ Warning: Reference file '{csv_filename}' not found. No papers will be excluded.")
            return set(), set()
        
        try:
            df = pd.read_csv(csv_filename)
            
            # Extract DOIs, cleaning them up
            dois = df['DOI_URL'].dropna().str.extract(r'(10\..*)').iloc[:, 0].str.strip()
            doi_set = set(dois.dropna())
            
            # Extract titles, normalizing them to lower case for better matching
            titles = df['Title'].dropna().str.lower().str.strip()
            title_set = set(titles.dropna())
            
            print(f"✅ Loaded {len(doi_set)} DOIs and {len(title_set)} titles into the exclusion list.")
            return doi_set, title_set
        except Exception as e:
            print(f"⚠️ Error loading exclusion list from '{csv_filename}': {e}")
            return set(), set()

    def execute_search(self, query: str, label: str):
        """Executes a search query and tags results with the label."""
        # This function remains largely the same as our last working version
        print("-" * 60)
        print(f"🔍 Executing Query: {label}")
        
        all_entries = []
        encoded_query = urllib.parse.quote(query)
        date_range = f"2021-{self.current_year}"
        count_per_page = 25
        start_index = 0

        while True:
            url = (f"{self.base_url}?query={encoded_query}&date={date_range}"
                   f"&apiKey={self.api_key}&count={count_per_page}&start={start_index}")
            try:
                response = requests.get(url, timeout=60)
                response.raise_for_status()
                data = response.json()
                search_results = data.get('search-results', {})
                entries = search_results.get('entry', [])
                if not entries: break
                
                for entry in entries: entry['found_by'] = label
                all_entries.extend(entries)
                
                total = int(search_results.get('opensearch:totalResults', 0))
                print(f"   📊 Progress: Retrieved {len(all_entries)} of {total}...")
                
                if len(all_entries) >= total: break
                start_index += count_per_page
                time.sleep(0.5)
            except requests.exceptions.RequestException as e:
                print(f"\n   ❌ An error occurred: {e}")
                break
        print(f"   ✅ Query '{label}' complete. Retrieved {len(all_entries)} entries.")
        self.raw_results.extend(all_entries)

    def build_and_run_doi_chain_search(self):
        """Builds and executes the Citation Chaining query."""
        if not self.exclusion_dois:
            print("⚠️ Skipping Citation Chain search because no DOIs were loaded from reference file.")
            return

        # Scopus has a URL length limit, so we may need to batch the DOIs
        # into multiple queries if the list is very long.
        doi_list = list(self.exclusion_dois)
        batch_size = 20 # A safe number of DOIs per query
        
        for i in range(0, len(doi_list), batch_size):
            batch = doi_list[i:i+batch_size]
            # Construct a query like: REF("doi1") OR REF("doi2") ...
            doi_query_parts = [f'REF("{doi}")' for doi in batch]
            doi_query = " OR ".join(doi_query_parts)
            
            self.execute_search(doi_query, f"3_Citation_Chain (Batch {i//batch_size + 1})")

    def process_and_save_results(self):
        """Processes raw data, filters out known papers, and saves the discoveries."""
        if not self.raw_results:
            print("\nNo entries to process. Exiting.")
            return

        print("\n" + "="*60)
        print("🔄 Processing, de-duplicating, and filtering results...")
        
        unique_new_papers = {}
        
        for entry in self.raw_results:
            eid = entry.get('eid')
            doi = entry.get('prism:doi', '').strip()
            title = entry.get('dc:title', '').lower().strip()

            # The Core Filtering Logic
            if eid and eid not in unique_new_papers:
                if doi in self.exclusion_dois or title in self.exclusion_titles:
                    # This is a known paper, so we skip it.
                    continue
                
                # This is a newly discovered paper
                unique_new_papers[eid] = {
                    'Found_By_Query': entry.get('found_by'),
                    'Scopus_Web_Link': f"https://www.scopus.com/record/display.uri?eid={eid}&origin=resultslist",
                    'eid': eid,
                    'title': entry.get('dc:title'),
                    'authors': entry.get('dc:creator'),
                    'year': entry.get('prism:coverDate', '')[:4],
                    'journal': entry.get('prism:publicationName'),
                    'doi': doi,
                    'citations': int(entry.get('citedby-count', 0)),
                }
        
        final_list = list(unique_new_papers.values())
        print(f"✅ Discovered {len(final_list)} new unique papers.")

        if final_list:
            df = pd.DataFrame(final_list)
            df = df.sort_values(by=['Found_By_Query', 'year', 'citations'], ascending=[True, False, False])
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"AHRQ_NEWLY_DISCOVERED_Citations_{timestamp}.csv"
            
            df.to_csv(filename, index=False, encoding='utf-8-sig')
            print(f"\n💾 Success! New discoveries saved to: {filename}")

    def run(self):
        """Runs the complete 'Find, Filter, and Expand' strategy."""
        # Query 1: Highest precision
        self.execute_search('TITLE-ABS-KEY("AHRQ" W/10 "compendium")', "1_High_Precision_Mention")

        # Query 2: Direct reference
        self.execute_search('REF("AHRQ" AND "compendium")', "2_Direct_Reference")
        
        # Query 3: Smart Expansion via Citation Chaining
        self.build_and_run_doi_chain_search()
        
        # Final step: Process everything we found
        self.process_and_save_results()

if __name__ == "__main__":
    engine = AHRQDiscoveryEngine()
    engine.run()