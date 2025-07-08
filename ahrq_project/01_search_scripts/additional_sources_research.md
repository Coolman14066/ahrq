# Additional Sources Beyond Scopus for Finding AHRQ Compendium Articles

## 1. PubMed/MEDLINE Options

### API Capabilities
- **E-utilities API**: Free public API to NCBI databases including PubMed
  - Main components: ESearch (search), EFetch (retrieve full records), ESummary (summaries), ECitMatch (match citations)
  - Returns bibliographic metadata, abstracts, and PMIDs
  - MEDLINE filter available: Add `medline[sb]` to queries

### Limitations
- **No full text access**: E-utilities cannot extract references from full text
- **No PDF access**: Only metadata and abstracts available
- **Reference extraction**: Not supported - would need PMC APIs for open access content

### Best Practices
- Get free API key from NCBI account
- Include API key in requests for better rate limits
- Use batch operations when possible

## 2. CrossRef API

### Capabilities
- **Citation counts**: Public access to "is-referenced-by-count" for all works
- **REST API**: Free access to metadata in JSON format
- **Search features**: Faceting, filtering, and sampling across thousands of publishers
- **Reference tracking**: Only works if publishers deposit reference lists

### Member Benefits (Paid)
- Full list of citing DOIs with bibliographic details
- Citation alerts and callbacks
- Access to complete reference metadata

### Limitations
- Citations only from Crossref-registered works
- Depends on publishers depositing complete reference metadata
- May differ from other citation services

## 3. Google Scholar Alternatives

### Semantic Scholar API
- **Free tier**: 100 requests per 5 minutes (unauthenticated)
- **With API key**: 1 request per second
- **Features**: 
  - Academic Graph Service (authors, papers, citations)
  - Paper search with title/abstract matching
  - SPECTER2 embeddings
  - Recommendations
- **Coverage**: ~200 million papers, all disciplines
- **Format**: JSON responses

### OpenAlex (Microsoft Academic Replacement)
- **Launched**: January 2022 as MAG successor
- **Free & open source**: No rate limits (keep under 100k requests/day)
- **Data sources**: MAG, Crossref, ORCID, Unpaywall
- **API entities**: Authors, works, venues, institutions, concepts
- **Limitations**: 
  - Abstracts in inverted index format (legal constraints)
  - Limited conference proceedings support

### CORE API
- **Coverage**: 207+ million open access articles from 10,286 providers
- **Unique feature**: Real-time access to both metadata AND full text
- **Rate limits**: 1 batch or 5 single requests per 10 seconds (free)
- **Commercial licenses**: Available for guaranteed service levels

## 4. Direct Publisher APIs

### Elsevier
- **Scopus API**: 50+ million abstracts from 20,500+ journals
- **ScienceDirect API**: Full text access (subscription dependent)
- **Access**: Free for non-commercial academic use
- **Tools**: Python module "elsapy" available

### Springer Nature
- **Coverage**: 14 million online documents
- **Formats**: XML and JSON
- **SpringerOpen/BioMed Central**: RESTful API for open access content
- **API keys**: Free upon request

### 2024 Updates
- **DEAL Agreements**: Authors can publish OA in hybrid journals at no cost
- **Security**: New scams targeting major publishers emerged

## 5. Web Scraping Considerations

### Legal Framework (2024)
- Recent court decisions favor research/non-profit scraping
- Public interest defenses may apply for research purposes
- Platform terms of service increasingly challenged in courts

### Preprint Servers
- **arXiv**: 1.7+ million articles, checks for compliance
- **bioRxiv/medRxiv**: Now protected by Cloudflare (as of May 2025)
- **SSRN**: Economics, law, social sciences focus

### Tools
- **paperscraper**: Python package for PubMed, arXiv, bioRxiv, medRxiv, chemRxiv
- Downloads full dumps in JSONL format
- Supports PDF and XML extraction

### Best Practices
1. Check server policies and robots.txt
2. Use official APIs when available
3. Respect rate limits
4. Consider ethical implications
5. Document scraping methodology

## Recommendations for AHRQ Compendium Search

1. **Primary sources**: 
   - CrossRef API for citation tracking
   - PubMed E-utilities for MEDLINE searches
   - OpenAlex for comprehensive coverage

2. **Full text access**:
   - CORE API for open access papers
   - Publisher APIs for subscription content
   - PMC for biomedical open access

3. **Supplementary tools**:
   - Semantic Scholar for AI-enhanced search
   - Preprint servers for recent research
   - Web scraping as last resort with proper considerations