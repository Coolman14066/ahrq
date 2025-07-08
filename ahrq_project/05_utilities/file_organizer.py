#!/usr/bin/env python3
"""
File Organizer for AHRQ Project
Helps identify and organize existing files into the new structure
"""

import os
import shutil
from datetime import datetime

def categorize_files():
    """Categorize existing files and suggest where they should go."""
    
    # Go to parent directory
    parent_dir = "../../"
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    categories = {
        'search_scripts': [],
        'data_sources': [],
        'analysis_scripts': [],
        'results': [],
        'utilities': [],
        'documentation': [],
        'archive': []
    }
    
    # File patterns
    patterns = {
        'search_scripts': ['finder', 'search', 'scopus_finder'],
        'data_sources': ['.csv', 'AHRQ_', 'ahrq_'],
        'analysis_scripts': ['auto', 'analysis', 'enhanced'],
        'results': ['results', 'availability', 'summary'],
        'utilities': ['open_', 'test_', 'check_'],
        'documentation': ['.md', '.txt', 'SUMMARY']
    }
    
    # List all files in parent directory
    files = [f for f in os.listdir(parent_dir) if os.path.isfile(os.path.join(parent_dir, f))]
    
    print("="*80)
    print("FILE ORGANIZATION SUGGESTIONS")
    print("="*80)
    
    # Categorize each file
    for file in sorted(files):
        categorized = False
        
        # Skip if already in ahrq_project
        if 'ahrq_project' in file:
            continue
            
        # Check each category
        for category, keywords in patterns.items():
            for keyword in keywords:
                if keyword in file.lower():
                    categories[category].append(file)
                    categorized = True
                    break
            if categorized:
                break
        
        # If not categorized, suggest archive
        if not categorized:
            categories['archive'].append(file)
    
    # Print suggestions
    folder_map = {
        'search_scripts': '01_search_scripts',
        'data_sources': '02_data_sources',
        'analysis_scripts': '03_analysis_scripts',
        'results': '04_results',
        'utilities': '05_utilities',
        'documentation': '06_documentation',
        'archive': '07_archive'
    }
    
    for category, files in categories.items():
        if files:
            print(f"\n{category.upper()} → {folder_map[category]}/")
            print("-" * 60)
            for file in sorted(files):
                print(f"  {file}")
    
    # Create organization script
    print("\n" + "="*80)
    print("ORGANIZATION SCRIPT")
    print("="*80)
    print("\nCopy and paste these commands to organize files:\n")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    script_lines = [f"# AHRQ File Organization Script - {timestamp}\n"]
    
    for category, files in categories.items():
        if files:
            target_folder = folder_map[category]
            script_lines.append(f"\n# {category.upper()}")
            for file in files:
                if 'results' in category and any(x in file for x in ['availability', 'summary']):
                    script_lines.append(f"cp {file} ahrq_project/04_results/availability_checks/")
                elif 'results' in category:
                    script_lines.append(f"cp {file} ahrq_project/04_results/search_results/")
                else:
                    script_lines.append(f"cp {file} ahrq_project/{target_folder}/")
    
    # Save script
    script_path = f"organize_files_{timestamp}.sh"
    with open(script_path, 'w') as f:
        f.writelines([line + '\n' for line in script_lines])
    
    print(f"Script saved to: {script_path}")
    
    # Summary
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    total_files = sum(len(files) for files in categories.values())
    print(f"Total files to organize: {total_files}")
    for category, files in categories.items():
        if files:
            print(f"  {category}: {len(files)} files")


def list_important_files():
    """List the most important files for the project."""
    print("\n" + "="*80)
    print("KEY FILES FOR AHRQ PROJECT")
    print("="*80)
    
    key_files = {
        "Master Reference": [
            "ahrq_reference.csv - Gold standard with 140+ validated entries"
        ],
        "Recent Discoveries": [
            "AHRQ_NEWLY_DISCOVERED_Citations_20250623_163522.csv - 53 new articles to process",
            "scopus_availability_full_results_20250625_181440.csv - Availability check results"
        ],
        "Analysis Scripts": [
            "auto_enhanced_gemini.py - Enhanced analysis with Gemini API",
            "check_scopus_availability.py - Tests article availability"
        ],
        "Search Scripts": [
            "ahrq_master_search.py - New comprehensive search tool"
        ]
    }
    
    for category, files in key_files.items():
        print(f"\n{category}:")
        for file in files:
            print(f"  • {file}")


if __name__ == "__main__":
    categorize_files()
    list_important_files()