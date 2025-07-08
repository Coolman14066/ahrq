#!/usr/bin/env python3
"""
Playwright DOI Enhancer for AHRQ Project
Uses Playwright MCP to extract author information from DOI URLs when API calls fail
"""

import json
import logging
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import os

class PlaywrightDOIEnhancer:
    """
    Enhances article metadata by extracting author information from publisher websites
    using Playwright MCP when API calls fail or return incomplete data.
    """
    
    def __init__(self):
        self.enhanced_articles = []
        self.failed_extractions = []
        
        # Setup logging
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs("../04_results/playwright_enhancement", exist_ok=True)
        
        logging.basicConfig(
            filename=f'../04_results/playwright_enhancement/enhancement_{timestamp}.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        self.timestamp = timestamp
        
    def enhance_articles_batch(self, articles: List[Dict]) -> List[Dict]:
        """
        Enhance a batch of articles with missing author information
        
        Args:
            articles: List of article dictionaries with DOIs
            
        Returns:
            List of enhanced article dictionaries
        """
        enhanced_results = []
        
        for idx, article in enumerate(articles):
            self.logger.info(f"Processing article {idx + 1}/{len(articles)}")
            
            # Check if article needs enhancement
            if self._needs_author_enhancement(article):
                enhanced_article = self._enhance_single_article(article)
                enhanced_results.append(enhanced_article)
            else:
                enhanced_results.append(article)
                
            # Rate limiting
            if idx < len(articles) - 1:
                time.sleep(2)  # Be respectful to publisher sites
                
        self._save_enhancement_report()
        return enhanced_results
    
    def _needs_author_enhancement(self, article: Dict) -> bool:
        """Check if article needs author enhancement"""
        # Check if authors are missing or incomplete
        authors = article.get('authors', [])
        
        if not authors:
            return True
            
        # Check if we only have partial author data
        if isinstance(authors, list) and len(authors) == 1:
            # Single author might indicate incomplete data
            author = authors[0] if authors else {}
            if isinstance(author, dict):
                # Check if author data is minimal
                if not author.get('affiliation') or not author.get('given_name'):
                    return True
                    
        return False
    
    def _enhance_single_article(self, article: Dict) -> Dict:
        """Enhance a single article with Playwright extraction"""
        doi = article.get('doi', '')
        
        if not doi:
            self.logger.warning(f"No DOI found for article: {article.get('title', 'Unknown')}")
            return article
            
        try:
            # Extract author information using Playwright MCP
            extraction_result = self._extract_authors_from_doi(doi)
            
            if extraction_result and extraction_result.get('authors'):
                # Merge extracted data with existing article data
                article['authors_enhanced'] = extraction_result['authors']
                article['author_extraction_method'] = 'playwright_mcp'
                article['extraction_url'] = extraction_result.get('url', '')
                article['extraction_timestamp'] = datetime.now().isoformat()
                
                self.enhanced_articles.append({
                    'doi': doi,
                    'title': article.get('title', ''),
                    'original_authors': article.get('authors', []),
                    'enhanced_authors': extraction_result['authors'],
                    'extraction_url': extraction_result.get('url', '')
                })
                
                self.logger.info(f"Successfully enhanced DOI {doi} with {len(extraction_result['authors'])} authors")
            else:
                self.logger.warning(f"Failed to enhance DOI {doi}")
                self.failed_extractions.append({
                    'doi': doi,
                    'title': article.get('title', ''),
                    'reason': 'No authors extracted'
                })
                
        except Exception as e:
            self.logger.error(f"Error enhancing DOI {doi}: {str(e)}")
            self.failed_extractions.append({
                'doi': doi,
                'title': article.get('title', ''),
                'error': str(e)
            })
            
        return article
    
    def _extract_authors_from_doi(self, doi: str) -> Optional[Dict]:
        """
        Extract author information from DOI URL using Playwright MCP
        
        This is a placeholder for the actual Playwright MCP integration.
        In practice, this would communicate with the MCP server.
        """
        # Clean DOI
        doi = doi.strip()
        if doi.startswith('http'):
            doi = doi.split('doi.org/')[-1]
            
        # Playwright MCP commands to execute
        extraction_script = """
        // Comprehensive author extraction
        const extractAuthors = () => {
            const authors = [];
            const seenNames = new Set();
            
            // Strategy 1: Meta tags
            document.querySelectorAll('meta[name="citation_author"], meta[name="DC.Creator"]').forEach(meta => {
                const name = meta.content;
                if (name && !seenNames.has(name)) {
                    seenNames.add(name);
                    authors.push({ name: name, source: 'meta_tag' });
                }
            });
            
            // Strategy 2: Common author selectors
            const selectors = [
                '.author-name',
                '.authors',
                '.contributor',
                '.article-authors span',
                '[class*="author-list"] [class*="author"]',
                '.authorsEls'
            ];
            
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    elements.forEach(el => {
                        const name = el.textContent.trim();
                        if (name && name.length > 2 && name.length < 100 && !seenNames.has(name)) {
                            seenNames.add(name);
                            
                            // Try to get affiliation
                            const affiliation = el.nextElementSibling?.className?.includes('affiliation') ?
                                el.nextElementSibling.textContent.trim() : null;
                                
                            authors.push({
                                name: name,
                                affiliation: affiliation,
                                source: 'dom_selector'
                            });
                        }
                    });
                    if (authors.length > 0) break;
                }
            }
            
            // Strategy 3: JSON-LD structured data
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            scripts.forEach(script => {
                try {
                    const data = JSON.parse(script.textContent);
                    if (data.author || data.authors) {
                        const authorList = Array.isArray(data.author) ? data.author : [data.author];
                        authorList.forEach(author => {
                            const name = author.name || (typeof author === 'string' ? author : null);
                            if (name && !seenNames.has(name)) {
                                seenNames.add(name);
                                authors.push({
                                    name: name,
                                    type: author['@type'] || 'Person',
                                    affiliation: author.affiliation?.name || null,
                                    source: 'json_ld'
                                });
                            }
                        });
                    }
                } catch (e) {}
            });
            
            return {
                url: window.location.href,
                title: document.title,
                authors: authors,
                publisher: window.location.hostname,
                extraction_date: new Date().toISOString()
            };
        };
        
        extractAuthors();
        """
        
        # In a real implementation, this would:
        # 1. Send commands to Playwright MCP server
        # 2. Navigate to https://doi.org/{doi}
        # 3. Wait for page load and potential redirects
        # 4. Execute the extraction script
        # 5. Return the results
        
        # For now, return a placeholder indicating the structure
        self.logger.info(f"Would extract authors from https://doi.org/{doi} using Playwright MCP")
        
        # Placeholder return - in practice this would be actual extracted data
        return None
    
    def _save_enhancement_report(self):
        """Save enhancement report"""
        report = {
            'timestamp': self.timestamp,
            'total_enhanced': len(self.enhanced_articles),
            'total_failed': len(self.failed_extractions),
            'enhanced_articles': self.enhanced_articles,
            'failed_extractions': self.failed_extractions
        }
        
        report_path = f'../04_results/playwright_enhancement/enhancement_report_{self.timestamp}.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
            
        self.logger.info(f"Enhancement report saved to {report_path}")
        
        # Also save a summary CSV
        if self.enhanced_articles:
            import pandas as pd
            df = pd.DataFrame(self.enhanced_articles)
            csv_path = f'../04_results/playwright_enhancement/enhanced_articles_{self.timestamp}.csv'
            df.to_csv(csv_path, index=False)
            self.logger.info(f"Enhanced articles CSV saved to {csv_path}")


def integrate_with_scopus_results(scopus_results_file: str, output_file: str):
    """
    Integration function to enhance Scopus search results
    
    Args:
        scopus_results_file: Path to CSV file with Scopus results
        output_file: Path to save enhanced results
    """
    import pandas as pd
    
    # Load Scopus results
    df = pd.read_csv(scopus_results_file)
    
    # Convert to list of dictionaries
    articles = df.to_dict('records')
    
    # Enhance articles
    enhancer = PlaywrightDOIEnhancer()
    enhanced_articles = enhancer.enhance_articles_batch(articles)
    
    # Convert back to DataFrame and save
    enhanced_df = pd.DataFrame(enhanced_articles)
    enhanced_df.to_csv(output_file, index=False)
    
    print(f"Enhanced {len(enhanced_articles)} articles")
    print(f"Results saved to {output_file}")


if __name__ == "__main__":
    # Example usage
    print("Playwright DOI Enhancer for AHRQ Project")
    print("========================================")
    print()
    print("This script enhances article metadata by extracting author information")
    print("from publisher websites using Playwright MCP when API data is incomplete.")
    print()
    print("Usage:")
    print("  python playwright_doi_enhancer.py")
    print()
    print("Or integrate with existing scripts:")
    print("  from playwright_doi_enhancer import PlaywrightDOIEnhancer")
    print("  enhancer = PlaywrightDOIEnhancer()")
    print("  enhanced_articles = enhancer.enhance_articles_batch(articles)")