#!/usr/bin/env python3
"""
Run Full Article Extraction Pipeline
Coordinates all agents to retrieve, analyze, and extract structured data
"""

import os
import time
import subprocess
from datetime import datetime

def run_script(script_name: str, description: str):
    """Run a Python script and handle output"""
    print(f"\n{'='*80}")
    print(f"Running: {description}")
    print(f"Script: {script_name}")
    print(f"{'='*80}")
    
    start_time = time.time()
    
    try:
        # Run the script
        result = subprocess.run(
            ['python3', script_name],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        
        # Print output
        if result.stdout:
            print(result.stdout)
        
        # Print errors if any
        if result.stderr:
            print("ERRORS:")
            print(result.stderr)
        
        # Check return code
        if result.returncode != 0:
            print(f"⚠️  Script failed with return code: {result.returncode}")
            return False
        
        elapsed = time.time() - start_time
        print(f"✅ Completed in {elapsed:.1f} seconds")
        return True
        
    except Exception as e:
        print(f"❌ Error running script: {e}")
        return False

def main():
    """Run the full pipeline"""
    print("="*80)
    print("AHRQ COMPENDIUM FULL EXTRACTION PIPELINE")
    print("="*80)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if we have the required input file
    input_file = "../04_results/compendium_search/compendium_high_confidence_20250625_212553.csv"
    if not os.path.exists(input_file):
        print(f"\n❌ Error: Required input file not found: {input_file}")
        print("Please run ahrq_compendium_focused_search.py first to generate the input data.")
        return
    
    print(f"\n✅ Found input file with high-confidence articles")
    
    # Pipeline stages
    stages = [
        ("scopus_abstract_retrieval.py", "Agent 1: Scopus Abstract Retrieval - Getting full article details"),
        ("multi_source_aggregator.py", "Agents 2-4: Multi-Source Aggregator - CrossRef, CORE, OpenAlex"),
        ("llm_structured_extractor.py", "Agent 7: LLM Structured Extractor - Analyzing with AI")
    ]
    
    # Run each stage
    for script, description in stages:
        success = run_script(script, description)
        
        if not success:
            print(f"\n⚠️  Pipeline stopped due to error in: {script}")
            print("Please check the logs and fix any issues before continuing.")
            break
        
        # Brief pause between stages
        print("\nPausing before next stage...")
        time.sleep(5)
    
    # Summary
    print("\n" + "="*80)
    print("PIPELINE SUMMARY")
    print("="*80)
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # List output directories
    output_dirs = [
        "../04_results/article_details",
        "../04_results/multi_source", 
        "../04_results/llm_extraction"
    ]
    
    print("\nOutput files created in:")
    for dir_path in output_dirs:
        if os.path.exists(dir_path):
            files = os.listdir(dir_path)
            print(f"\n{dir_path}:")
            for f in sorted(files)[-5:]:  # Show last 5 files
                print(f"  - {f}")
    
    print("\n✅ Key output file:")
    print("  ../04_results/llm_extraction/extracted_for_reference_*.csv")
    print("  This file is formatted to match your ahrq_reference.csv structure!")
    
    print("\nNext steps:")
    print("1. Review the extracted_for_reference CSV file")
    print("2. Check high_confidence_extracted for best results")
    print("3. Import validated rows into your ahrq_reference.csv")


if __name__ == "__main__":
    main()