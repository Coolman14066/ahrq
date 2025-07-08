# AHRQ Project Structure

## Overview
This project is organized to systematically search, retrieve, and analyze articles that reference the AHRQ Compendium of U.S. Health Systems.

## Folder Structure

### 01_search_scripts/
Contains all scripts for searching Scopus for AHRQ-related articles:
- `ahrq_master_search.py` - Main search script with multiple strategies
- `search_validator.py` - Validates search results for relevance

### 02_data_sources/
Original data files and CSVs:
- `ahrq_reference.csv` - Master reference file with validated articles
- `AHRQ_NEWLY_DISCOVERED_*.csv` - New articles found through searches
- Other source CSVs

### 03_analysis_scripts/
Scripts for analyzing and enhancing article data:
- `auto_enhanced_gemini.py` - Enhanced analysis using Gemini API
- `check_scopus_availability.py` - Checks article availability

### 04_results/
Output files organized by type:
- `search_results/` - Raw search outputs
- `availability_checks/` - Availability test results
- `final_analysis/` - Enhanced analysis outputs with AHRQ usage classification

### 05_utilities/
Helper scripts and utilities:
- `open_available_articles.py` - Opens DOI links in browser
- `file_organizer.py` - Helps organize existing files

### 06_documentation/
Project documentation:
- This file
- API documentation references
- Search strategy notes

### 07_archive/
Old or deprecated files moved here to keep main directories clean

## Key Files

### Master Reference
- `02_data_sources/ahrq_reference.csv` - The gold standard reference file

### Configuration
- `01_search_scripts/search_config.json` - Search parameters and queries

### Latest Results
- Check `04_results/` for the most recent outputs with timestamps