# AHRQ Compendium Full Extraction Pipeline

## What This Does

This pipeline takes the 76 AHRQ Compendium articles we found and:
1. **Retrieves full details** from Scopus (abstracts, references, funding)
2. **Queries multiple databases** (CrossRef, CORE, OpenAlex) for additional data
3. **Uses AI (Gemini)** to extract structured information matching your Excel format

## How to Run

Simply execute:
```bash
cd ahrq_project/01_search_scripts
python3 run_full_pipeline.py
```

This runs all agents in sequence automatically.

## What Each Agent Does

### Agent 1: Scopus Abstract Retrieval
- Uses Scopus Abstract API with FULL view
- Gets complete article details including:
  - Full abstract text
  - Complete reference list
  - Funding acknowledgments
  - Author affiliations
- Identifies which references mention "AHRQ Compendium"

### Agents 2-4: Multi-Source Aggregator
- **CrossRef**: Gets citation counts and funding info
- **CORE**: Finds open access full text versions
- **OpenAlex**: Gets comprehensive metadata and citing works
- **Semantic Scholar**: AI-enhanced search for related papers

### Agent 7: LLM Structured Extractor
- Sends article data to Gemini AI
- Extracts structured fields:
  - Usage Type (Primary/Secondary/Context)
  - How AHRQ Compendium is used
  - Key findings
  - Data years mentioned
  - Confidence score
- Formats output to match your ahrq_reference.csv

## Output Files

### Primary Output (Ready for Import)
`../04_results/llm_extraction/extracted_for_reference_[timestamp].csv`
- Formatted exactly like your ahrq_reference.csv
- Includes all required fields
- Ready to import into your database

### Supporting Files
1. **Article Details**: Full JSON with abstracts, references, funding
2. **Multi-Source Data**: Citation counts, open access links
3. **High Confidence Only**: Filtered to 80%+ confidence articles

## Understanding the Results

### Confidence Scores
- **90-100%**: Explicit AHRQ Compendium usage found
- **80-89%**: Strong evidence of usage
- **70-79%**: Probable usage, may need review
- **<70%**: Uncertain, requires manual verification

### Usage Types
- **Primary**: Main data source is AHRQ Compendium
- **Secondary**: Supplements other data sources  
- **Context**: Mentioned for comparison/context only
- **None**: No clear usage found

## Quality Checks

The AI extraction includes:
- Where AHRQ is mentioned (Abstract, Methods, References, Funding)
- Specific years of Compendium data used
- Number of health systems studied
- Rationale for confidence score

## Next Steps

1. **Review extracted_for_reference CSV**
   - Check high confidence rows first
   - Verify AI extracted the right information

2. **Import to your database**
   - Add new rows to ahrq_reference.csv
   - Update existing entries with new details

3. **Manual review for medium confidence**
   - Articles with 70-79% confidence
   - May need to check full text

## Troubleshooting

If the pipeline fails:
1. Check you have the input file from previous search
2. Verify API keys are working
3. Check internet connection for external APIs
4. Review log files in each output directory

## Time Estimate

Full pipeline takes approximately:
- Agent 1 (Scopus): 10-15 minutes for 76 articles
- Agents 2-4 (Multi-source): 5-10 minutes  
- Agent 7 (AI extraction): 10-15 minutes

Total: ~30-40 minutes for complete extraction

## API Usage

- Scopus: 76 abstract retrievals
- CrossRef: 76 queries (free)
- OpenAlex: 76 queries (free)
- OpenRouter/Gemini: ~76 AI calls

All within reasonable limits for research use.