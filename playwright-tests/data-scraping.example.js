/**
 * Example Playwright MCP Data Scraping for AHRQ Research
 * This demonstrates how to use Playwright MCP server for web scraping research data
 */

const dataScrapingScenarios = {
  // Scrape research publications from a journal website
  scrapeJournalArticles: {
    description: "Extract research article metadata from journal websites",
    steps: [
      "playwright_navigate https://example-journal.com/ahrq-research",
      "playwright_wait_for_selector .article-list",
      "playwright_evaluate () => Array.from(document.querySelectorAll('.article')).map(article => ({title: article.querySelector('.title')?.textContent, authors: article.querySelector('.authors')?.textContent, doi: article.querySelector('.doi')?.textContent}))",
      "playwright_get_visible_html .article-list",
      "playwright_screenshot journal-articles.png"
    ]
  },

  // Scrape AHRQ compendium references
  scrapeCompendiumData: {
    description: "Extract AHRQ compendium citation data",
    steps: [
      "playwright_navigate https://ahrq.gov/compendium",
      "playwright_wait_for_selector .citation-list",
      "playwright_evaluate () => document.querySelectorAll('.citation').length",
      "playwright_get_visible_html .citation-list",
      "playwright_screenshot compendium-citations.png"
    ]
  },

  // Scrape research impact metrics
  scrapeImpactMetrics: {
    description: "Extract research impact and citation metrics",
    steps: [
      "playwright_navigate https://scholar.google.com/citations?user=AHRQ",
      "playwright_wait_for_selector #gsc_rsb_st",
      "playwright_evaluate () => ({citations: document.querySelector('#gsc_rsb_st td:nth-child(2)')?.textContent, hIndex: document.querySelector('#gsc_rsb_st tr:nth-child(2) td:nth-child(2)')?.textContent})",
      "playwright_screenshot impact-metrics.png"
    ]
  },

  // Scrape funding information
  scrapeGrantData: {
    description: "Extract grant and funding information",
    steps: [
      "playwright_navigate https://reporter.nih.gov/search/ahrq",
      "playwright_wait_for_selector .results-table",
      "playwright_evaluate () => Array.from(document.querySelectorAll('.grant-row')).map(row => ({projectNumber: row.querySelector('.project-number')?.textContent, title: row.querySelector('.project-title')?.textContent, pi: row.querySelector('.pi-name')?.textContent, amount: row.querySelector('.award-amount')?.textContent}))",
      "playwright_screenshot grant-data.png"
    ]
  },

  // Scrape institutional affiliations
  scrapeInstitutionalData: {
    description: "Extract institutional affiliation data for network analysis",
    steps: [
      "playwright_navigate https://example.edu/ahrq-collaborators",
      "playwright_wait_for_selector .institution-list",
      "playwright_evaluate () => Array.from(document.querySelectorAll('.institution')).map(inst => ({name: inst.querySelector('.name')?.textContent, location: inst.querySelector('.location')?.textContent, collaborations: inst.querySelector('.collab-count')?.textContent}))",
      "playwright_get_visible_html .institution-list"
    ]
  },

  // Automated data collection workflow
  automatedDataCollection: {
    description: "Complete automated data collection workflow",
    steps: [
      // Step 1: Navigate to search page
      "playwright_navigate https://pubmed.ncbi.nlm.nih.gov/",
      
      // Step 2: Search for AHRQ compendium
      "playwright_fill input[name='term'] 'AHRQ compendium'",
      "playwright_press Enter",
      "playwright_wait_for_selector .results-list",
      
      // Step 3: Extract search results
      "playwright_evaluate () => Array.from(document.querySelectorAll('.docsum-content')).map(item => ({title: item.querySelector('.docsum-title')?.textContent, authors: item.querySelector('.docsum-authors')?.textContent, pmid: item.querySelector('.docsum-pmid')?.textContent}))",
      
      // Step 4: Navigate to first result
      "playwright_click .docsum-title:first-child",
      "playwright_wait_for_selector .abstract",
      
      // Step 5: Extract detailed information
      "playwright_get_visible_html .abstract",
      "playwright_screenshot article-details.png"
    ]
  },

  // Pagination handling example
  scrapePaginatedResults: {
    description: "Handle pagination when scraping multiple pages",
    steps: [
      "playwright_navigate https://example.com/search?q=ahrq",
      "playwright_wait_for_selector .results",
      
      // Scrape first page
      "playwright_evaluate () => document.querySelectorAll('.result-item').length",
      
      // Click next page
      "playwright_click .pagination .next",
      "playwright_wait_for_selector .results",
      
      // Scrape second page
      "playwright_evaluate () => document.querySelectorAll('.result-item').length",
      
      // Continue for more pages...
      "playwright_screenshot paginated-results.png"
    ]
  },

  // Dynamic content handling
  scrapeDynamicContent: {
    description: "Handle JavaScript-rendered dynamic content",
    steps: [
      "playwright_navigate https://dynamic-site.com/ahrq-data",
      
      // Wait for dynamic content to load
      "playwright_wait_for_selector .data-loaded",
      "playwright_wait_for_timeout 2000", // Additional wait for animations
      
      // Scroll to load more content
      "playwright_evaluate window.scrollTo(0, document.body.scrollHeight)",
      "playwright_wait_for_selector .more-content-loaded",
      
      // Extract all loaded content
      "playwright_get_visible_html .dynamic-content",
      "playwright_screenshot dynamic-content.png"
    ]
  },

  // Form submission example
  submitSearchForm: {
    description: "Submit forms to access search results",
    steps: [
      "playwright_navigate https://database.com/advanced-search",
      
      // Fill form fields
      "playwright_fill input[name='keyword'] 'AHRQ compendium'",
      "playwright_fill input[name='year_from'] '2020'",
      "playwright_fill input[name='year_to'] '2024'",
      "playwright_select select[name='domain'] 'Clinical'",
      
      // Submit form
      "playwright_click button[type='submit']",
      "playwright_wait_for_selector .search-results",
      
      // Extract results
      "playwright_get_visible_html .search-results",
      "playwright_screenshot form-results.png"
    ]
  }
};

// Helper functions that could be used with Playwright MCP
const helpers = {
  // Extract all links from a page
  extractLinks: "playwright_evaluate () => Array.from(document.querySelectorAll('a')).map(a => ({text: a.textContent, href: a.href}))",
  
  // Get page metadata
  getPageMetadata: "playwright_evaluate () => ({title: document.title, description: document.querySelector('meta[name=\"description\"]')?.content, keywords: document.querySelector('meta[name=\"keywords\"]')?.content})",
  
  // Check if element exists
  checkElementExists: (selector) => `playwright_evaluate (selector) => !!document.querySelector('${selector}')`,
  
  // Scroll to element
  scrollToElement: (selector) => `playwright_evaluate (selector) => document.querySelector('${selector}').scrollIntoView()`,
  
  // Extract table data
  extractTableData: "playwright_evaluate () => Array.from(document.querySelectorAll('table tr')).map(row => Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent.trim()))"
};

console.log("Playwright MCP Data Scraping Examples for AHRQ Research");
console.log("======================================================");
console.log("");
console.log("These examples demonstrate web scraping capabilities");
console.log("that can enhance the AHRQ data collection process");

module.exports = { dataScrapingScenarios, helpers };