#!/usr/bin/env python3
"""
Fixed Full Extraction Pipeline
Uses the Search API approach that works instead of Abstract API that requires special permissions
"""

import subprocess
import os
import time
from datetime import datetime
import pandas as pd
import json

def run_agent(script_name: str, description: str):
    """Run a single agent script"""
    print(f"\n{'='*80}")
    print(f"Running {description}")
    print(f"Script: {script_name}")
    print("="*80)
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            ['python3', script_name],
            capture_output=True,
            text=True,
            cwd='/mnt/c/Users/pedro/OneDrive/Desktop/Apps/Bond Attempt/herewegoagain/ahrq_project/01_search_scripts'
        )
        
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            print(f"Time taken: {time.time() - start_time:.2f} seconds")
            if result.stdout:
                print("\nOutput:")
                print(result.stdout[-1000:])  # Last 1000 chars
        else:
            print(f"❌ {description} failed with return code {result.returncode}")
            if result.stderr:
                print("\nError:")
                print(result.stderr)
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Exception running {description}: {str(e)}")
        return False

def check_results():
    """Check what results we have so far"""
    print("\n" + "="*80)
    print("CHECKING RESULTS")
    print("="*80)
    
    results_dirs = [
        "../04_results/article_details",
        "../04_results/multi_source",
        "../04_results/llm_extraction"
    ]
    
    for dir_path in results_dirs:
        if os.path.exists(dir_path):
            files = sorted([f for f in os.listdir(dir_path) if f.endswith(('.csv', '.json'))])
            print(f"\n{dir_path}:")
            for f in files[-5:]:  # Show last 5 files
                print(f"  - {f}")

def main():
    """Run the complete pipeline with the fixed approach"""
    
    print("="*80)
    print("AHRQ COMPENDIUM FULL EXTRACTION PIPELINE - FIXED VERSION")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    # Track successful agents
    successful_agents = []
    failed_agents = []
    
    # Agent 1: Scopus Search Details (using Search API instead of Abstract API)
    if run_agent(
        "scopus_search_details.py",
        "Agent 1: Scopus Search Details Retrieval (Fixed)"
    ):
        successful_agents.append("Scopus Search Details")
    else:
        failed_agents.append("Scopus Search Details")
    
    # Small delay between agents
    time.sleep(2)
    
    # Agents 2-4: Multi-Source Aggregator (3 parallel agents)
    if run_agent(
        "multi_source_aggregator.py",
        "Agents 2-4: Multi-Source Aggregator (CrossRef, CORE, OpenAlex)"
    ):
        successful_agents.append("Multi-Source Aggregator")
    else:
        failed_agents.append("Multi-Source Aggregator")
    
    time.sleep(2)
    
    # Agent 7: LLM Structured Extractor
    # First, let's prepare the combined data for LLM processing
    prepare_llm_input()
    
    if run_agent(
        "llm_structured_extractor.py",
        "Agent 7: LLM Structured Extractor (OpenRouter/Gemini)"
    ):
        successful_agents.append("LLM Structured Extractor")
    else:
        failed_agents.append("LLM Structured Extractor")
    
    # Check final results
    check_results()
    
    # Summary
    print("\n" + "="*80)
    print("PIPELINE SUMMARY")
    print("="*80)
    print(f"Successful agents: {len(successful_agents)}")
    for agent in successful_agents:
        print(f"  ✅ {agent}")
    
    if failed_agents:
        print(f"\nFailed agents: {len(failed_agents)}")
        for agent in failed_agents:
            print(f"  ❌ {agent}")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

def prepare_llm_input():
    """Combine Scopus Search and Multi-Source data for LLM processing"""
    print("\n" + "="*80)
    print("PREPARING DATA FOR LLM PROCESSING")
    print("="*80)
    
    try:
        # Find the latest Scopus Search details file
        article_details_dir = "../04_results/article_details"
        scopus_files = [f for f in os.listdir(article_details_dir) if f.startswith("articles_for_llm_processing_") and f.endswith(".csv")]
        
        if not scopus_files:
            print("❌ No Scopus Search details found for LLM processing")
            return
        
        latest_scopus = sorted(scopus_files)[-1]
        scopus_path = os.path.join(article_details_dir, latest_scopus)
        
        # Find the latest multi-source summary
        multi_source_dir = "../04_results/multi_source"
        multi_files = [f for f in os.listdir(multi_source_dir) if f.startswith("multi_source_summary_") and f.endswith(".csv")]
        
        if multi_files:
            latest_multi = sorted(multi_files)[-1]
            multi_path = os.path.join(multi_source_dir, latest_multi)
            
            # Read both files
            scopus_df = pd.read_csv(scopus_path, encoding='utf-8-sig')
            multi_df = pd.read_csv(multi_path, encoding='utf-8-sig')
            
            # Merge on EID
            combined_df = scopus_df.merge(
                multi_df[['eid', 'total_citations', 'mentions_ahrq', 'ahrq_funded', 'full_text_available']],
                on='eid',
                how='left'
            )
            
            # Save combined data
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            combined_path = os.path.join(article_details_dir, f"combined_for_llm_{timestamp}.csv")
            combined_df.to_csv(combined_path, index=False, encoding='utf-8-sig')
            
            print(f"✅ Combined {len(combined_df)} articles for LLM processing")
            print(f"✅ Saved to: {combined_path}")
        else:
            print("⚠️  No multi-source data found, using Scopus data only")
            
    except Exception as e:
        print(f"❌ Error preparing LLM input: {str(e)}")


if __name__ == "__main__":
    main()