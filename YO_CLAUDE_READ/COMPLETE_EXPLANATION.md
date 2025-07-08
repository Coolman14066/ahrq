# AHRQ Compendium Search Project - Complete Explanation

## What This Project Is About
We're searching for academic papers that reference or use the **AHRQ Compendium of U.S. Health Systems** - a comprehensive database that identifies and tracks health systems across the United States.

## The Key Confusion: 350 Articles vs 26 Compendium Articles

### What Happened
1. **We searched broadly for "AHRQ"** - The Agency for Healthcare Research and Quality
2. **Found 370 total articles** mentioning AHRQ in any context
3. **After removing duplicates: 350 new articles**
4. **But only 26 actually mention the "Compendium"**

### Why This Happened
- AHRQ produces MANY resources beyond the Compendium:
  - Patient Safety Indicators
  - Healthcare Cost and Utilization Project (HCUP)
  - Quality measures and guidelines
  - Various other databases and tools
- Our initial search was too broad - we caught everything mentioning AHRQ

### The Real Numbers
- **5 NEW Compendium articles** (not in your reference database)
- **21 Compendium articles** you already had (duplicates)
- **345 other AHRQ articles** (not about the Compendium)

## How to Verify if an Article Really Mentions the Compendium

### Direct Mentions (High Confidence)
Look for these exact phrases:
- "AHRQ Compendium"
- "Compendium of U.S. Health Systems"
- "Agency for Healthcare Research and Quality Compendium"

### Indirect Mentions (Medium Confidence)
Papers might describe it without naming it:
- "national database of health systems"
- "comprehensive health system identification"
- "hospital linkage file from AHRQ"
- References to specific years: "2018 AHRQ health systems data"

### Where to Look in Papers
1. **Methods/Data section**: "We identified health systems using..."
2. **References**: Look for citations to AHRQ reports
3. **Acknowledgments**: Funding or data access mentions
4. **Supplementary materials**: Detailed methodology

## File Structure and What's Where

### Key Results Files

#### 1. Confirmed Compendium Articles
**File**: `ahrq_project/04_results/ahrq_compendium_confirmed_new_20250625.csv`
- **Contains**: 5 NEW articles that definitely cite AHRQ Compendium
- **Trust Level**: HIGH - These are confirmed

#### 2. All Search Results  
**File**: `ahrq_project/04_results/search_results/ahrq_working_all_results_20250625_210124.csv`
- **Contains**: All 370 articles found
- **Trust Level**: Mixed - includes both Compendium and non-Compendium AHRQ mentions

#### 3. New Unique Discoveries
**File**: `ahrq_project/04_results/deduplication/ahrq_new_unique_discoveries_20250625_210301.csv`
- **Contains**: 350 articles not in your reference database
- **Trust Level**: Mixed - mostly non-Compendium AHRQ articles

#### 4. Your Original Reference
**File**: `ahrq_project/02_data_sources/ahrq_reference.csv`
- **Contains**: 136 articles you already had
- **Trust Level**: HIGH - Your validated baseline

## Search Strategies We Used

### What Worked
1. **Reference searches**: `REF("AHRQ Compendium")` - Found 18 articles
2. **Direct title/abstract**: `TITLE-ABS-KEY("AHRQ Compendium")` - Found 8 articles

### What Didn't Work Well
1. **Broad AHRQ searches**: Too many irrelevant results
2. **Author searches**: Found health system papers but not necessarily Compendium users

## Quality Checks

### High Confidence Compendium Mentions
These queries specifically look for "Compendium":
- `TITLE-ABS-KEY("AHRQ Compendium")`
- `REF("AHRQ Compendium")`
- `TITLE-ABS-KEY("Agency for Healthcare Research and Quality" w/10 Compendium)`

### Low Confidence (Needs Manual Review)
These might find Compendium users:
- `AUTHOR-NAME("Ganguli I*") AND TITLE-ABS-KEY("health system*")`
- `AFFIL(Mathematica) AND TITLE-ABS-KEY("health system*")`

## Next Steps to Find More Compendium Articles

### 1. Enhanced Search Queries
We need to try:
- Funding acknowledgments: `FUND-ALL("AHRQ Compendium")`
- Author keywords: `AUTHKEY("AHRQ Compendium")`
- Fuzzy matching: `"AHRQ Compendium"~2`
- All fields: `ALL("AHRQ Compendium")`

### 2. Pattern-Based Searches
Look for how researchers describe using it:
- "identified health systems using national database"
- "hospital affiliations were determined"
- "comprehensive database of U.S. health systems"

### 3. Manual Validation
For medium-confidence articles:
1. Download the full text
2. Search for "compendium" or "AHRQ"
3. Check the methods section
4. Verify in references

## Summary

**What you can trust**:
- The 5 articles in `ahrq_compendium_confirmed_new_20250625.csv` definitely cite the Compendium
- These are NEW - not in your original 136-article reference

**What needs more work**:
- We need to search more specifically for Compendium mentions
- Many search strategies haven't been tried yet
- The 350 "new" articles are mostly about other AHRQ resources

**The bottom line**:
We successfully found 5 new Compendium articles, but there are likely many more. The next phase will use more targeted searches to find articles that mention the Compendium specifically, not just AHRQ in general.