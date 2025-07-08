#!/usr/bin/env python3
"""
AHRQ Compendium Expansive Discovery Engine (v10)

Objective: Discover NEW papers (2021+) relevant to the AHRQ Compendium,
           using an expanded, layered search strategy for maximum coverage,
           and EXCLUDING already known papers from 'ahrq_reference.csv'.
"""

import requests
import urllib.parse
import pandas as pd
from datetime import datetime
import time
import os

class AHRQExpansiveFinder:
    def __init__(self, reference_file='ahrq_reference.csv'):
        """Initializes the engine and loads the exclusion list."""
        self.api_key = "5251ded319b70f014c96efd294d62402"
        self.base_url = "https://api.elsevier.com/content/search/scopus"
        
        self.raw_results = []
        self.current_year = datetime.now().year
        
        # ======================================================================
        # STEP 1: LOAD THE EXCLUSION LIST FROM YOUR CSV
        # This happens immediately when the script starts.
        # ======================================================================
        self.exclusion_dois, self.exclusion_titles = self.load_exclusion_list(reference_file)

    def load_exclusion_list(self, csv_filename: str) -> tuple[set, set]:
        """Loads DOIs and titles from the reference CSV to create our filter."""
        if not os.path.exists(csv_filename):
            print(f"⚠️ Warning: Reference file '{csv_filename}' not found. No papers will be excluded.")
            return set(), set()
        
        try:
            df = pd.read_csv(csv_filename)
            dois = df['DOI_URL'].dropna().str.extract(r'(10\..*)').iloc[:, 0].str.strip()
            titles = df['Title'].dropna().str.lower().str.strip()
            print(f"✅ Loaded {len(set(dois.dropna()))} DOIs and {len(set(titles.dropna()))} titles into the exclusion list.")
            return set(dois.dropna()), set(titles.dropna())
        except Exception as e:
            print(f"⚠️ Error loading exclusion list from '{csv_filename}': {e}")
            return set(), set()

    def execute_search(self, query: str, label: str):
        """Executes a search query and tags results."""
        print("-" * 60)
        print(f"🔍 Executing Layer: {label}")
        
        # ... (This part of the code is for searching and remains the same)
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
                
                for entry in entries: entry['found_by_layer'] = label
                all_entries.extend(entries)
                
                total = int(search_results.get('opensearch:totalResults', 0))
                print(f"   📊 Progress: Retrieved {len(all_entries)} of {total}...")
                
                if len(all_entries) >= total: break
                start_index += count_per_page
                time.sleep(0.5)
            except requests.exceptions.RequestException as e:
                print(f"\n   ❌ An error occurred: {e}")
                break
        print(f"   ✅ Layer '{label}' complete. Retrieved {len(all_entries)} entries.")
        self.raw_results.extend(all_entries)

    def process_and_save_results(self):
        """Processes raw data, filters out known papers, and saves the discoveries."""
        if not self.raw_results:
            print("\nNo new papers discovered.")
            return

        print("\n" + "="*60)
        print("🔄 Processing, de-duplicating, and filtering all results...")
        
        unique_new_papers = {}
        
        for entry in self.raw_results:
            eid = entry.get('eid')
            doi = entry.get('prism:doi', '').strip()
            title = entry.get('dc:title', '').lower().strip()

            # First, process for internal duplicates from this run
            if eid and eid not in unique_new_papers:
                
                # ======================================================================
                # STEP 2: APPLY THE EXCLUSION FILTER
                # This logic checks every single paper against the list from your CSV.
                # ======================================================================
                if doi in self.exclusion_dois or title in self.exclusion_titles:
                    # This paper is a duplicate from your reference file.
                    # 'continue' immediately stops processing it and skips to the next one.
                    continue
                
                # If a paper reaches this line, it means it was NOT in your CSV.
                # It is a true new discovery.
                unique_new_papers[eid] = {
                    'Found_By_Layer': entry.get('found_by_layer'),
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
        print(f"✅ Discovered {len(final_list)} new unique papers after filtering.")

        if final_list:
            df = pd.DataFrame(final_list)
            df = df.sort_values(by=['Found_By_Layer', 'year', 'citations'], ascending=[True, False, False])
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"AHRQ_Expansive_Discoveries_{timestamp}.csv"
            
            df.to_csv(filename, index=False, encoding='utf-8-sig')
            print(f"\n💾 Success! New discoveries saved to: {filename}")

    def run(self):
        """Runs the complete layered discovery strategy with expanded queries."""
        self.execute_search(
            'TITLE-ABS-KEY("AHRQ" W/5 "compendium") OR '
            'TITLE-ABS-KEY("Agency for Healthcare Research and Quality" W/10 "compendium") OR '
            'TITLE-ABS-KEY("Compendium of U.S. Health Systems") OR '
            'TITLE-ABS-KEY("AHRQ" W/5 ("dataset" OR "database") AND "health system*")',
            "1_Bullseye_Expanded"
        )
        self.execute_search('REF("AHRQ" AND "compendium")', "2_Direct_Citation")
        self.execute_search(
            'TITLE-ABS-KEY("AHRQ" W/15 (consolidation OR merger* OR "vertical integration" OR '
            'affiliation* OR "market power" OR "market concentration" OR "linkage file" OR ownership))',
            "3_Expanded_Context"
        )
        self.execute_search(
            'REF("Furukawa" AND "Consolidation Of Providers") OR '
            'REF("Contreary" AND "Consolidation and Mergers") OR '
            'REF("Rich" AND "Mathematica")',
            "4_Proxy_Citation"
        )
        self.process_and_save_results()

if __name__ == "__main__":
    engine = AHRQExpansiveFinder()
    engine.run()