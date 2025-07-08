import Papa from 'papaparse';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Singleton instance
let instance = null;

export class DataQueryEngine {
  constructor() {
    if (instance) {
      return instance;
    }
    
    this.data = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    
    instance = this;
  }
  
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this._loadData();
    await this.initializationPromise;
    this.isInitialized = true;
  }
  
  async _loadData() {
    const startTime = Date.now();
    console.log('[DataQueryEngine] Starting data load...');
    
    try {
      const csvPath = join(__dirname, '..', '..', '..', 'public', 'ahrq_reference_good.csv');
      
      // Read file asynchronously
      const csvContent = await readFile(csvPath, 'utf8');
      console.log(`[DataQueryEngine] File read completed in ${Date.now() - startTime}ms`);
      
      const parseStartTime = Date.now();
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          return header.trim().toLowerCase().replace(/\s+/g, '_');
        }
      });
      
      if (parseResult.errors.length > 0) {
        console.error('[DataQueryEngine] CSV parsing errors:', parseResult.errors);
      }
      
      console.log(`[DataQueryEngine] CSV parsing completed in ${Date.now() - parseStartTime}ms`);
      
      const enrichStartTime = Date.now();
      // Process and enrich data
      this.data = parseResult.data.map((row, index) => ({
        id: index + 1,
        publication_type: row.publication_type?.trim() || '',
        title: row.title?.trim() || '',
        authors: row.authors_standardized?.trim() || '',
        year: parseInt(row.publication_year) || 0,
        journal: row.journal_venue?.trim() || '',
        publisher: row.publisher?.trim() || '',
        usage_type: row.usage_type?.trim() || '',
        usage_justification: row.usage_justification?.trim() || '',
        usage_description: row.usage_description?.trim() || '',
        research_domain: row.research_domain?.trim() || '',
        geographic_focus: row.geographic_focus?.trim() || '',
        data_years_used: row.data_years_used?.trim() || '',
        key_findings: row.key_findings?.trim() || '',
        policy_implications: row.policy_implications?.trim() || '',
        doi_url: row.doi_url?.trim() || '',
        notes: row.notes?.trim() || '',
        // Computed fields
        quality_score: this.calculateQualityScore(row),
        policy_impact_score: this.calculatePolicyImpactScore(row)
      }));
      
      console.log(`[DataQueryEngine] Data enrichment completed in ${Date.now() - enrichStartTime}ms`);
      console.log(`[DataQueryEngine] Total initialization time: ${Date.now() - startTime}ms`);
      console.log(`[DataQueryEngine] Loaded ${this.data.length} publications`);
    } catch (error) {
      console.error('[DataQueryEngine] Failed to load CSV data:', error);
      this.data = [];
    }
  }
  
  calculateQualityScore(row) {
    let score = 0;
    
    // DOI presence (20 points)
    if (row.doi_url && row.doi_url.trim() !== '') score += 20;
    
    // Usage justification detail (20 points)
    const justificationLength = (row.usage_justification || '').trim().length;
    if (justificationLength > 100) score += 20;
    else if (justificationLength > 50) score += 10;
    
    // Key findings completeness (20 points)
    const findingsLength = (row.key_findings || '').trim().length;
    if (findingsLength > 200) score += 20;
    else if (findingsLength > 100) score += 10;
    
    // Policy implications detail (20 points)
    const implicationsLength = (row.policy_implications || '').trim().length;
    if (implicationsLength > 200) score += 20;
    else if (implicationsLength > 100) score += 10;
    
    // Data years specificity (10 points)
    if (row.data_years_used && row.data_years_used.trim() !== '') score += 10;
    
    // Author completeness (10 points)
    if (row.authors_standardized && row.authors_standardized.trim() !== '') score += 10;
    
    return Math.min(score, 100);
  }
  
  calculatePolicyImpactScore(row) {
    const text = (row.policy_implications || '').toLowerCase();
    let score = 0;
    
    const keywords = {
      'regulatory': 15,
      'enforcement': 15,
      'legislation': 20,
      'policy': 10,
      'guidelines': 10,
      'compliance': 10,
      'oversight': 10,
      'antitrust': 15,
      'competition': 10,
      'reform': 15
    };
    
    for (const [keyword, weight] of Object.entries(keywords)) {
      if (text.includes(keyword)) {
        score += weight;
      }
    }
    
    return Math.min(score, 100);
  }
  
  async executeQuery(query, context) {
    // Ensure data is loaded before executing query
    await this.initialize();
    
    if (!this.data || this.data.length === 0) {
      throw new Error('Data not loaded');
    }
    
    // Parse query intent
    const intent = this.parseQueryIntent(query);
    
    // Apply filters based on query
    let filteredData = [...this.data];
    
    // Apply context filters first
    if (context?.selectedFilters) {
      filteredData = this.applyContextFilters(filteredData, context.selectedFilters);
    }
    
    // Apply query-specific filters
    switch (intent.type) {
      case 'author_search':
        filteredData = this.filterByAuthor(filteredData, intent.parameters.author);
        break;
        
      case 'domain_filter':
        filteredData = this.filterByDomain(filteredData, intent.parameters.domain);
        break;
        
      case 'year_filter':
        filteredData = this.filterByYearRange(filteredData, intent.parameters.startYear, intent.parameters.endYear);
        break;
        
      case 'impact_ranking':
        filteredData = this.rankByImpact(filteredData, intent.parameters.limit);
        break;
        
      case 'usage_analysis':
        return this.analyzeUsageTypes(filteredData);
        
      case 'trend_analysis':
        return this.analyzeTrends(filteredData, intent.parameters);
        
      case 'collaboration_network':
        return this.analyzeCollaborations(filteredData, intent.parameters.author);
        
      default:
        // General search
        filteredData = this.generalSearch(filteredData, query);
    }
    
    // Format results
    return this.formatResults(filteredData, intent);
  }
  
  parseQueryIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Author search
    if (lowerQuery.includes('by') || lowerQuery.includes('author')) {
      const authorMatch = query.match(/by\s+([^,]+)|author[s]?\s+([^,]+)/i);
      if (authorMatch) {
        return {
          type: 'author_search',
          parameters: { author: (authorMatch[1] || authorMatch[2]).trim() }
        };
      }
    }
    
    // Domain filter
    if (lowerQuery.includes('domain') || lowerQuery.includes('field')) {
      const domainMatch = query.match(/(?:domain|field)\s+([^,]+)/i);
      if (domainMatch) {
        return {
          type: 'domain_filter',
          parameters: { domain: domainMatch[1].trim() }
        };
      }
    }
    
    // Year filter
    if (lowerQuery.includes('year') || /\b(19|20)\d{2}\b/.test(lowerQuery)) {
      const yearMatch = query.match(/\b(19|20)\d{2}\b/g);
      if (yearMatch) {
        return {
          type: 'year_filter',
          parameters: {
            startYear: parseInt(yearMatch[0]),
            endYear: parseInt(yearMatch[yearMatch.length - 1])
          }
        };
      }
    }
    
    // Impact ranking
    if (lowerQuery.includes('impact') || lowerQuery.includes('top')) {
      const limitMatch = query.match(/top\s+(\d+)/i);
      return {
        type: 'impact_ranking',
        parameters: { limit: limitMatch ? parseInt(limitMatch[1]) : 10 }
      };
    }
    
    // Usage analysis
    if (lowerQuery.includes('usage') || lowerQuery.includes('how') && lowerQuery.includes('used')) {
      return { type: 'usage_analysis', parameters: {} };
    }
    
    // Trend analysis
    if (lowerQuery.includes('trend') || lowerQuery.includes('over time')) {
      return { type: 'trend_analysis', parameters: {} };
    }
    
    // Collaboration network
    if (lowerQuery.includes('collaborat') || lowerQuery.includes('network')) {
      return { type: 'collaboration_network', parameters: {} };
    }
    
    return { type: 'general_search', parameters: {} };
  }
  
  applyContextFilters(data, filters) {
    let filtered = data;
    
    if (filters.years && filters.years.length === 2) {
      filtered = filtered.filter(pub => 
        pub.year >= filters.years[0] && pub.year <= filters.years[1]
      );
    }
    
    if (filters.publicationTypes && filters.publicationTypes.length > 0) {
      filtered = filtered.filter(pub => 
        filters.publicationTypes.includes(pub.publication_type)
      );
    }
    
    if (filters.usageTypes && filters.usageTypes.length > 0) {
      filtered = filtered.filter(pub => 
        filters.usageTypes.includes(pub.usage_type)
      );
    }
    
    if (filters.domains && filters.domains.length > 0) {
      filtered = filtered.filter(pub => 
        filters.domains.includes(pub.research_domain)
      );
    }
    
    return filtered;
  }
  
  filterByAuthor(data, authorQuery) {
    const query = authorQuery.toLowerCase();
    return data.filter(pub => 
      pub.authors.toLowerCase().includes(query)
    );
  }
  
  filterByDomain(data, domainQuery) {
    const query = domainQuery.toLowerCase();
    return data.filter(pub => 
      pub.research_domain.toLowerCase().includes(query)
    );
  }
  
  filterByYearRange(data, startYear, endYear) {
    return data.filter(pub => 
      pub.year >= startYear && pub.year <= endYear
    );
  }
  
  rankByImpact(data, limit) {
    return data
      .sort((a, b) => b.policy_impact_score - a.policy_impact_score)
      .slice(0, limit);
  }
  
  generalSearch(data, query) {
    const searchTerms = query.toLowerCase().split(' ');
    return data.filter(pub => {
      const searchableText = `${pub.title} ${pub.authors} ${pub.research_domain} ${pub.key_findings}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });
  }
  
  analyzeUsageTypes(data) {
    const usageStats = {};
    
    data.forEach(pub => {
      if (!usageStats[pub.usage_type]) {
        usageStats[pub.usage_type] = {
          count: 0,
          publications: [],
          avgImpact: 0,
          avgQuality: 0
        };
      }
      
      const stat = usageStats[pub.usage_type];
      stat.count++;
      stat.publications.push(pub);
      stat.avgImpact += pub.policy_impact_score;
      stat.avgQuality += pub.quality_score;
    });
    
    // Calculate averages
    Object.values(usageStats).forEach(stat => {
      stat.avgImpact = stat.avgImpact / stat.count;
      stat.avgQuality = stat.avgQuality / stat.count;
      stat.publications = stat.publications.slice(0, 5); // Top 5 examples
    });
    
    return {
      type: 'usage_analysis',
      stats: usageStats,
      summary: `Found ${data.length} publications across ${Object.keys(usageStats).length} usage types`
    };
  }
  
  analyzeTrends(data, parameters) {
    const yearlyStats = {};
    
    data.forEach(pub => {
      if (!yearlyStats[pub.year]) {
        yearlyStats[pub.year] = {
          count: 0,
          avgImpact: 0,
          avgQuality: 0,
          domains: new Set()
        };
      }
      
      const stat = yearlyStats[pub.year];
      stat.count++;
      stat.avgImpact += pub.policy_impact_score;
      stat.avgQuality += pub.quality_score;
      stat.domains.add(pub.research_domain);
    });
    
    // Calculate averages and convert sets to arrays
    const trends = Object.entries(yearlyStats).map(([year, stat]) => ({
      year: parseInt(year),
      count: stat.count,
      avgImpact: stat.avgImpact / stat.count,
      avgQuality: stat.avgQuality / stat.count,
      domainCount: stat.domains.size
    })).sort((a, b) => a.year - b.year);
    
    return {
      type: 'trend_analysis',
      trends,
      summary: `Publication trends from ${trends[0].year} to ${trends[trends.length - 1].year}`
    };
  }
  
  analyzeCollaborations(data, authorQuery) {
    const collaborations = new Map();
    
    data.forEach(pub => {
      const authors = pub.authors.split(';').map(a => a.trim()).filter(a => a);
      
      for (let i = 0; i < authors.length; i++) {
        for (let j = i + 1; j < authors.length; j++) {
          const key = [authors[i], authors[j]].sort().join('|');
          
          if (!collaborations.has(key)) {
            collaborations.set(key, {
              authors: [authors[i], authors[j]],
              count: 0,
              publications: []
            });
          }
          
          const collab = collaborations.get(key);
          collab.count++;
          collab.publications.push(pub);
        }
      }
    });
    
    const topCollaborations = Array.from(collaborations.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      type: 'collaboration_analysis',
      collaborations: topCollaborations,
      summary: `Found ${collaborations.size} unique collaborations`
    };
  }
  
  formatResults(data, intent) {
    const results = {
      type: intent.type,
      count: data.length,
      data: data.slice(0, 50), // Limit to 50 results
      summary: ''
    };
    
    switch (intent.type) {
      case 'author_search':
        results.summary = `Found ${data.length} publications by ${intent.parameters.author}`;
        results.stats = {
          avgImpact: data.reduce((sum, pub) => sum + pub.policy_impact_score, 0) / data.length,
          yearRange: [
            Math.min(...data.map(pub => pub.year)),
            Math.max(...data.map(pub => pub.year))
          ]
        };
        break;
        
      case 'impact_ranking':
        results.summary = `Top ${Math.min(data.length, intent.parameters.limit)} publications by policy impact`;
        break;
        
      default:
        results.summary = `Found ${data.length} matching publications`;
    }
    
    return results;
  }
}