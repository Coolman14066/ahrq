# AHRQ Compendium Search Results Summary

## Overview
**Search Date**: June 25, 2025  
**Search Period**: 2021-2025  
**Total Articles Found**: 370  
**New Unique Articles**: 350 (not in reference CSV)  
**Duplicates**: 20 (already in reference CSV)

## Key Findings

### 1. Direct AHRQ Compendium Mentions
Found articles that directly reference "AHRQ Compendium" in:
- Title/Abstract/Keywords: 4 articles
- References: 9 articles

### 2. High-Value New Discoveries
Notable new articles not in the reference database:
- "Outcomes for Very Preterm Infants Across Health Systems" (2025)
- "Private Equity Investment in Plastic Surgery Clinics: A Scoping Review" (2025)
- "State Health Care Cost Commissions" (2025)
- "Esophagectomy Trends and Postoperative Outcomes at Private Equity-Acquired Health Centers" (2025)

### 3. Search Strategy Success
Most productive search strategies:
- **Broad AHRQ searches**: 325 articles mentioning AHRQ
- **Author searches**: 
  - Ganguli I.: 8 articles on health systems
  - Mathematica affiliation: 17 articles
- **Reference searches**: 9 articles citing AHRQ Compendium

### 4. Comparison with Reference Database
- Reference CSV contains: 136 articles
- Our search found: 350 NEW articles
- Total coverage now: 486 articles (136 + 350)
- **257% increase in coverage**

## Files Generated

### Search Results
- `ahrq_working_all_results_20250625_210124.csv` - All 370 articles found
- `ahrq_working_high_relevance_20250625_210124.csv` - 26 high-relevance articles

### Deduplication Results
- `ahrq_new_unique_discoveries_20250625_210301.csv` - 350 NEW articles
- `ahrq_confirmed_duplicates_20250625_210301.csv` - 20 duplicates
- `ahrq_deduplication_report_20250625_210301.txt` - Detailed report

## Limitations & Next Steps

### Current Limitations
1. API limit of 25 results per request (vs 200 we wanted)
2. Some queries could return more results with pagination
3. Limited to 2021-2025 timeframe

### Recommended Next Steps
1. **Expand search to 2016-2020** to capture more historical usage
2. **Manual review** of high-relevance articles to confirm AHRQ Compendium usage
3. **Abstract/full-text analysis** to find indirect mentions
4. **Citation network analysis** to find papers citing the confirmed articles
5. **Update reference database** with the 350 new discoveries

## Technical Notes
- Used Scopus Search API with STANDARD view
- Implemented multiple search strategies (direct, proximity, author, institution, reference)
- Deduplication used DOI and title matching with fuzzy logic
- All searches filtered for document types: articles, reviews, conference papers, book chapters