# AHRQ Compendium Search Strategy

## Overview
This document outlines the comprehensive search strategy for finding articles that reference or use the AHRQ Compendium of U.S. Health Systems.

## Search Tiers

### Tier 1: Direct Mentions (Highest Relevance)
Exact phrases that directly reference the AHRQ Compendium:
- `"AHRQ Compendium of U.S. Health Systems"`
- `"AHRQ Compendium of US Health Systems"`
- `"AHRQ Compendium" AND "health system*"`
- `"Agency for Healthcare Research and Quality Compendium"`

### Tier 2: Proximity Searches
Terms appearing near each other:
- `AHRQ w/5 Compendium` (within 5 words)
- `"Agency for Healthcare Research and Quality" w/10 Compendium`
- `AHRQ w/10 "health system*" w/10 compendium`

### Tier 3: Wildcard Searches
Catching variations:
- `"AHRQ Compend*"`
- `AHRQ AND compend* AND "health system*"`

### Tier 4: Reference Searches
Finding articles that cite AHRQ in references:
- `REF("AHRQ Compendium")`
- `REF("Agency for Healthcare Research and Quality" AND Compendium)`
- `REF(Contreary AND AHRQ AND "Health Affairs")`

### Tier 5: Known Citations
Articles known to cite AHRQ Compendium:
- `REF("Consolidation and Mergers among Health Systems in 2021")`
- `REF("Rich" AND "Mathematica" AND AHRQ)`

## Filters Applied

### Year Range
- 2021-2025 (recent publications most likely to use current AHRQ data)

### Document Types
- **Include**: Articles (ar), Reviews (re), Conference Papers (cp), Book Chapters (ch)
- **Exclude**: Errata (er), Notes (no)

### Subject Areas
- **Primary**: Medicine, Health Professions, Nursing, Social Sciences
- **Optional**: Economics, Business, Multidisciplinary

## Exclusion Terms
To reduce false positives:
- `protocol AND NOT analysis`
- `study design AND NOT results`
- `proposal AND NOT findings`

## Relevance Scoring

Articles are scored based on:
1. **Search tier** (Tier 1 = 10 points, Tier 5 = 3 points)
2. **Title mentions** (5 points for both AHRQ and Compendium)
3. **Abstract mentions** (0.5 points per mention, max 3)
4. **Keywords** (1 point each for AHRQ/Compendium)
5. **Recency** (1 point for 2023+, 0.5 for 2022)
6. **Citations** (normalized, max 2 points)

## Expected Results

### High Quality (Score ≥ 10)
- Direct usage of AHRQ Compendium data
- AHRQ mentioned in title and abstract
- Primary analysis of health systems

### Medium Quality (Score 8-10)
- Clear reference to AHRQ Compendium
- Used for methodology or definitions
- Secondary analysis

### Lower Quality (Score < 8)
- Passing mentions
- Citations only
- May need manual review

## Usage

Run the master search script:
```bash
cd 01_search_scripts
python3 ahrq_master_search.py
```

Results will be saved to:
- `04_results/search_results/ahrq_master_search_results_[timestamp].csv`
- `04_results/search_results/ahrq_high_relevance_[timestamp].csv`
- `04_results/search_results/ahrq_search_summary_[timestamp].txt`