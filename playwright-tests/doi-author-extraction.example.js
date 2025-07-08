/**
 * Playwright MCP DOI Author Extraction Example
 * This demonstrates how to use Playwright MCP to extract author information
 * from publisher websites when API calls fail
 */

const doiAuthorExtractionScenarios = {
  /**
   * Extract author information from DOI.org redirect
   * This handles the common case where DOI redirects to publisher sites
   */
  extractFromDOI: {
    description: "Navigate to DOI URL and extract author information from publisher page",
    workflow: (doi) => [
      // Navigate to DOI URL
      `playwright_navigate https://doi.org/${doi}`,
      
      // Wait for redirect to publisher site
      "playwright_wait_for_timeout 3000",
      
      // Try common author selectors
      `playwright_evaluate () => {
        const authorSelectors = [
          '.author-name',
          '.authors',
          '.contributor',
          '.author-list',
          '.article-authors',
          '[class*="author"]',
          '[data-testid*="author"]',
          'span[itemprop="author"]',
          'meta[name="citation_author"]'
        ];
        
        let authors = [];
        
        // Try each selector
        for (const selector of authorSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            elements.forEach(el => {
              const text = el.textContent || el.content || '';
              if (text && text.length > 0 && text.length < 100) {
                authors.push(text.trim());
              }
            });
            if (authors.length > 0) break;
          }
        }
        
        // Also check meta tags
        const metaAuthors = document.querySelectorAll('meta[name="citation_author"], meta[name="DC.Creator"]');
        metaAuthors.forEach(meta => {
          const content = meta.content;
          if (content && !authors.includes(content)) {
            authors.push(content);
          }
        });
        
        return {
          url: window.location.href,
          title: document.title,
          authors: [...new Set(authors)], // Remove duplicates
          doi: '${doi}'
        };
      }`,
      
      // Take screenshot for verification
      "playwright_screenshot doi-page.png"
    ]
  },

  /**
   * Publisher-specific extraction patterns
   * Different publishers have different DOM structures
   */
  publisherSpecificExtraction: {
    // Elsevier/ScienceDirect
    elsevier: {
      description: "Extract from Elsevier/ScienceDirect pages",
      steps: [
        "playwright_wait_for_selector .author-group",
        `playwright_evaluate () => {
          const authors = [];
          document.querySelectorAll('.author-group .author').forEach(author => {
            const name = author.querySelector('.text')?.textContent;
            const affiliation = author.querySelector('.affiliation')?.textContent;
            if (name) {
              authors.push({
                name: name.trim(),
                affiliation: affiliation ? affiliation.trim() : null
              });
            }
          });
          return authors;
        }`
      ]
    },
    
    // Springer
    springer: {
      description: "Extract from Springer pages",
      steps: [
        "playwright_wait_for_selector .authors__list",
        `playwright_evaluate () => {
          const authors = [];
          document.querySelectorAll('.authors__name').forEach(author => {
            authors.push({
              name: author.textContent.trim(),
              orcid: author.querySelector('a[href*="orcid.org"]')?.href
            });
          });
          return authors;
        }`
      ]
    },
    
    // Wiley
    wiley: {
      description: "Extract from Wiley pages",
      steps: [
        "playwright_wait_for_selector .author-info",
        `playwright_evaluate () => {
          const authors = [];
          document.querySelectorAll('.author-info').forEach(info => {
            const name = info.querySelector('.author-name')?.textContent;
            const email = info.querySelector('.author-email')?.textContent;
            if (name) {
              authors.push({
                name: name.trim(),
                email: email ? email.trim() : null
              });
            }
          });
          return authors;
        }`
      ]
    },
    
    // PubMed Central
    pmc: {
      description: "Extract from PubMed Central pages",
      steps: [
        "playwright_wait_for_selector .contrib-group",
        `playwright_evaluate () => {
          const authors = [];
          document.querySelectorAll('.contrib').forEach(contrib => {
            const surname = contrib.querySelector('.surname')?.textContent;
            const givenNames = contrib.querySelector('.given-names')?.textContent;
            if (surname) {
              authors.push({
                name: givenNames ? \`\${givenNames} \${surname}\` : surname,
                affiliation: contrib.querySelector('.aff')?.textContent
              });
            }
          });
          return authors;
        }`
      ]
    }
  },

  /**
   * Fallback extraction using multiple strategies
   * Used when publisher-specific extraction fails
   */
  fallbackExtraction: {
    description: "Try multiple extraction strategies",
    steps: [
      // Strategy 1: Look for JSON-LD structured data
      `playwright_evaluate () => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent);
            if (data.author || data.authors) {
              const authors = Array.isArray(data.author) ? data.author : [data.author];
              return authors.map(a => ({
                name: a.name || a,
                type: a['@type'] || 'Person'
              }));
            }
          } catch (e) {}
        }
        return null;
      }`,
      
      // Strategy 2: Extract from visible text patterns
      `playwright_evaluate () => {
        const text = document.body.innerText;
        const authorPatterns = [
          /Authors?:\\s*([^\\n]+)/i,
          /By\\s+([^\\n]+)/i,
          /Written by\\s+([^\\n]+)/i
        ];
        
        for (const pattern of authorPatterns) {
          const match = text.match(pattern);
          if (match) {
            const authorText = match[1];
            // Split by common separators
            const authors = authorText.split(/[,;]|\\s+and\\s+/i)
              .map(a => a.trim())
              .filter(a => a.length > 2 && a.length < 50);
            if (authors.length > 0) {
              return authors;
            }
          }
        }
        return null;
      }`,
      
      // Strategy 3: Check citation metadata
      `playwright_evaluate () => {
        const citation = document.querySelector('.citation-text, .cite-this, #citation');
        if (citation) {
          const text = citation.textContent;
          // Extract authors from citation format
          const beforeYear = text.match(/^([^(]+)\\s*\\(/);
          if (beforeYear) {
            const authors = beforeYear[1].split(/[,&]|\\s+and\\s+/i)
              .map(a => a.trim())
              .filter(a => a.length > 2);
            return authors;
          }
        }
        return null;
      }`
    ]
  },

  /**
   * Complete workflow integrating with existing Python scripts
   */
  integratedWorkflow: {
    description: "Complete workflow for DOI author extraction",
    pythonIntegration: `
import subprocess
import json
from typing import Dict, List, Optional

class PlaywrightDOIExtractor:
    """Use Playwright MCP to extract author information from DOI URLs"""
    
    def __init__(self):
        self.extracted_data = []
        self.failed_extractions = []
    
    def extract_authors(self, doi: str) -> Optional[Dict]:
        """Extract author information for a given DOI"""
        
        # Clean DOI
        doi = doi.strip()
        if doi.startswith('http'):
            doi = doi.split('doi.org/')[-1]
        
        try:
            # Run Playwright MCP commands
            commands = [
                f'playwright_navigate https://doi.org/{doi}',
                'playwright_wait_for_timeout 3000',
                self._get_extraction_script()
            ]
            
            result = self._run_playwright_commands(commands)
            
            if result and result.get('authors'):
                self.extracted_data.append(result)
                return result
            else:
                # Try fallback strategies
                return self._try_fallback_extraction(doi)
                
        except Exception as e:
            self.failed_extractions.append({
                'doi': doi,
                'error': str(e)
            })
            return None
    
    def _get_extraction_script(self) -> str:
        """Get the JavaScript extraction script"""
        return '''playwright_evaluate () => {
            // Comprehensive author extraction logic
            const extractors = [
                // Meta tags
                () => {
                    const authors = [];
                    document.querySelectorAll('meta[name="citation_author"], meta[name="DC.Creator"]').forEach(meta => {
                        if (meta.content) authors.push(meta.content);
                    });
                    return authors;
                },
                
                // Common class selectors
                () => {
                    const selectors = ['.author-name', '.authors', '.contributor'];
                    for (const sel of selectors) {
                        const elements = document.querySelectorAll(sel);
                        if (elements.length > 0) {
                            return Array.from(elements).map(el => el.textContent.trim());
                        }
                    }
                    return [];
                },
                
                // JSON-LD
                () => {
                    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
                    for (const script of scripts) {
                        try {
                            const data = JSON.parse(script.textContent);
                            if (data.author) {
                                return Array.isArray(data.author) ? 
                                    data.author.map(a => a.name || a) : 
                                    [data.author.name || data.author];
                            }
                        } catch (e) {}
                    }
                    return [];
                }
            ];
            
            // Try each extractor
            for (const extractor of extractors) {
                const authors = extractor();
                if (authors && authors.length > 0) {
                    return {
                        url: window.location.href,
                        title: document.title,
                        authors: [...new Set(authors)],
                        extraction_method: 'playwright_mcp'
                    };
                }
            }
            
            return { url: window.location.href, authors: [], failed: true };
        }'''
    
    def _run_playwright_commands(self, commands: List[str]) -> Optional[Dict]:
        """Execute Playwright MCP commands"""
        # Implementation would call the MCP server
        # This is a placeholder for the actual implementation
        pass
    
    def _try_fallback_extraction(self, doi: str) -> Optional[Dict]:
        """Try alternative extraction methods"""
        # Could try different approaches or services
        pass

# Integration with existing AHRQ scripts
def enhance_scopus_results_with_playwright(scopus_results: List[Dict]) -> List[Dict]:
    """Enhance Scopus results with Playwright extraction when authors are missing"""
    
    extractor = PlaywrightDOIExtractor()
    enhanced_results = []
    
    for result in scopus_results:
        if not result.get('authors') and result.get('doi'):
            # Try to extract authors using Playwright
            playwright_data = extractor.extract_authors(result['doi'])
            
            if playwright_data and playwright_data.get('authors'):
                result['authors'] = playwright_data['authors']
                result['author_extraction_method'] = 'playwright_mcp'
            
        enhanced_results.append(result)
    
    return enhanced_results
`,
    usage: `
# Example usage in existing AHRQ workflow
from playwright_doi_extractor import enhance_scopus_results_with_playwright

# After getting Scopus results with missing authors
scopus_results = scopus_search.get_results()

# Enhance with Playwright extraction
enhanced_results = enhance_scopus_results_with_playwright(scopus_results)

# Continue with normal processing
process_results(enhanced_results)
`
  },

  /**
   * Testing and validation
   */
  testingScenarios: {
    description: "Test extraction on known DOIs",
    testCases: [
      {
        doi: "10.1001/jama.2023.12345",
        expectedPublisher: "JAMA",
        test: [
          "playwright_navigate https://doi.org/10.1001/jama.2023.12345",
          "playwright_wait_for_selector .author-info",
          "playwright_evaluate () => document.querySelectorAll('.author-info').length > 0"
        ]
      },
      {
        doi: "10.1056/NEJMoa2021436", 
        expectedPublisher: "NEJM",
        test: [
          "playwright_navigate https://doi.org/10.1056/NEJMoa2021436",
          "playwright_wait_for_selector .contributors",
          "playwright_evaluate () => document.querySelectorAll('.contributor-name').length > 0"
        ]
      }
    ]
  }
};

// Helper functions for common patterns
const extractionHelpers = {
  // Clean author names
  cleanAuthorName: (name) => {
    return name
      .replace(/[0-9*†‡§¶#]/g, '') // Remove footnote markers
      .replace(/\s+/g, ' ')         // Normalize whitespace
      .replace(/,$/, '')            // Remove trailing comma
      .trim();
  },
  
  // Parse author string with multiple authors
  parseAuthorString: (authorString) => {
    // Handle different separators
    return authorString
      .split(/[,;]|\s+and\s+|\s+&\s+/i)
      .map(name => cleanAuthorName(name))
      .filter(name => name.length > 2 && name.length < 100);
  },
  
  // Validate extracted authors
  validateAuthors: (authors) => {
    return authors.filter(author => {
      // Basic validation
      const name = typeof author === 'string' ? author : author.name;
      return name && 
             name.length > 2 && 
             name.length < 100 &&
             /[a-zA-Z]/.test(name); // Contains at least one letter
    });
  }
};

console.log("Playwright MCP DOI Author Extraction Examples");
console.log("===========================================");
console.log("");
console.log("These examples show how to extract author information");
console.log("from publisher websites when API calls fail");

module.exports = { doiAuthorExtractionScenarios, extractionHelpers };