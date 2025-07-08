// Import Publication type from the main dashboard
interface Publication {
  id: number;
  publication_type: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  publisher: string;
  usage_type: 'PRIMARY_ANALYSIS' | 'RESEARCH_ENABLER' | 'CONTEXTUAL_REFERENCE';
  usage_justification: string;
  usage_description: string;
  research_domain: string;
  geographic_focus: string;
  data_years_used: string;
  key_findings: string;
  policy_implications: string;
  doi_url: string;
  notes: string;
  quality_score?: number;
  policy_impact_score?: number;
  geographic_reach?: 'LOCAL' | 'STATE' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';
  methodological_rigor?: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Extract institutions from author strings
export const extractInstitutions = (publications: Publication[]): Map<string, number> => {
  const institutionCounts = new Map<string, number>();
  
  publications.forEach(pub => {
    if (!pub.authors) return;
    
    // Match patterns like "Name (Institution)" or "Name [Institution]"
    const regex = /(?:\(([^)]+)\)|\[([^\]]+)\])/g;
    let match;
    
    while ((match = regex.exec(pub.authors)) !== null) {
      const institution = (match[1] || match[2]).trim();
      if (institution) {
        institutionCounts.set(institution, (institutionCounts.get(institution) || 0) + 1);
      }
    }
  });
  
  return institutionCounts;
};

// Get top institutions by publication count
export const getTopInstitutions = (publications: Publication[], limit: number = 10) => {
  const institutionCounts = extractInstitutions(publications);
  
  return Array.from(institutionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
};

// Analyze cross-sector collaboration
export const analyzeCrossSectorCollaboration = (publications: Publication[]) => {
  const sectorCounts = {
    'Academic-Only': 0,
    'Policy Organizations': 0,
    'Healthcare Systems': 0,
    'Government Agencies': 0,
    'Private Sector': 0,
    'International': 0
  };
  
  publications.forEach(pub => {
    // Analyze publication type and author affiliations
    const publicationType = pub.publication_type?.toLowerCase() || '';
    const authors = pub.authors?.toLowerCase() || '';
    
    // Categorize based on publication type and author patterns
    if (publicationType.includes('academic') || publicationType.includes('journal')) {
      sectorCounts['Academic-Only']++;
    } else if (publicationType.includes('policy') || publicationType.includes('brief')) {
      sectorCounts['Policy Organizations']++;
    } else if (authors.includes('health system') || authors.includes('hospital')) {
      sectorCounts['Healthcare Systems']++;
    } else if (authors.includes('government') || authors.includes('federal')) {
      sectorCounts['Government Agencies']++;
    } else if (authors.includes('international') || authors.includes('global')) {
      sectorCounts['International']++;
    } else {
      sectorCounts['Private Sector']++;
    }
  });
  
  const total = publications.length;
  const percentages = Object.entries(sectorCounts).map(([sector, count]) => ({
    sector,
    percentage: Math.round((count / total) * 100)
  }));
  
  return percentages;
};

// Analyze research domains
export const analyzeResearchDomains = (publications: Publication[]) => {
  const domainMap = new Map<string, {
    count: number;
    publications: Publication[];
    avgQuality: number;
    yearRange: { min: number; max: number };
  }>();
  
  publications.forEach(pub => {
    const domain = pub.research_domain || 'Uncategorized';
    
    if (!domainMap.has(domain)) {
      domainMap.set(domain, {
        count: 0,
        publications: [],
        avgQuality: 0,
        yearRange: { min: 9999, max: 0 }
      });
    }
    
    const domainData = domainMap.get(domain)!;
    domainData.count++;
    domainData.publications.push(pub);
    
    const year = pub.year || 0;
    if (year > 0) {
      domainData.yearRange.min = Math.min(domainData.yearRange.min, year);
      domainData.yearRange.max = Math.max(domainData.yearRange.max, year);
    }
  });
  
  // Calculate average quality scores
  domainMap.forEach((data) => {
    const totalQuality = data.publications.reduce((sum, pub) => {
      return sum + (pub.quality_score || 0);
    }, 0);
    data.avgQuality = data.count > 0 ? totalQuality / data.count : 0;
  });
  
  return domainMap;
};

// Calculate research momentum (year-over-year trends)
export const calculateResearchMomentum = (publications: Publication[]) => {
  const currentYear = new Date().getFullYear();
  const lastCompleteYear = currentYear - 1; // Exclude current year which may have incomplete data
  const recentYears = 3; // Look at last 3 complete years for momentum
  
  // Group by domain and year
  const domainYearCounts = new Map<string, Map<number, number>>();
  
  publications.forEach(pub => {
    const domain = pub.research_domain || 'Uncategorized';
    const year = pub.year || 0;
    
    if (!domainYearCounts.has(domain)) {
      domainYearCounts.set(domain, new Map());
    }
    
    const yearMap = domainYearCounts.get(domain)!;
    yearMap.set(year, (yearMap.get(year) || 0) + 1);
  });
  
  // Calculate momentum for each domain
  const momentum = {
    accelerating: [] as string[],
    stable: [] as string[],
    declining: [] as string[]
  };
  
  domainYearCounts.forEach((yearMap, domain) => {
    const recentCounts: number[] = [];
    
    for (let i = 1; i <= recentYears; i++) {
      const year = lastCompleteYear - i + 1;
      recentCounts.unshift(yearMap.get(year) || 0);
    }
    
    // Calculate trend
    if (recentCounts.length >= 2) {
      const growthRates: number[] = [];
      for (let i = 1; i < recentCounts.length; i++) {
        if (recentCounts[i - 1] > 0) {
          const growth = ((recentCounts[i] - recentCounts[i - 1]) / recentCounts[i - 1]) * 100;
          growthRates.push(growth);
        }
      }
      
      const avgGrowth = growthRates.length > 0 
        ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length 
        : 0;
      
      // Only include domains with meaningful activity (at least 3 publications in recent years)
      const totalRecentPubs = recentCounts.reduce((a, b) => a + b, 0);
      if (totalRecentPubs >= 3) {
        // Clear thresholds: >15% growth = accelerating, <-15% = declining
        if (avgGrowth > 15) {
          momentum.accelerating.push(domain);
        } else if (avgGrowth < -15) {
          momentum.declining.push(domain);
        } else {
          momentum.stable.push(domain);
        }
      }
    }
  });
  
  return momentum;
};

// Identify emerging research topics
export const identifyEmergingTopics = (publications: Publication[], lookbackYears: number = 2) => {
  const currentYear = new Date().getFullYear();
  const cutoffYear = currentYear - lookbackYears;
  
  // Get recent publications
  const recentPubs = publications.filter(pub => 
    (pub.year || 0) >= cutoffYear
  );
  
  // Extract topics from titles and key findings
  const topicCounts = new Map<string, { count: number; papers: string[] }>();
  
  // Common research keywords to look for - based on actual AHRQ Compendium themes
  const keywords = [
    'consolidation', 'mergers', 'vertical integration',
    'market power', 'pricing', 'market concentration',
    'health equity', 'disparities', 'access',
    'quality', 'outcomes', 'performance',
    'value-based care', 'payment reform',
    'rural health', 'rural access',
    'antitrust', 'competition policy',
    'methodology', 'data quality',
    'health systems', 'integrated delivery',
    'physician employment', 'hospital ownership'
  ];
  
  recentPubs.forEach(pub => {
    const text = `${pub.title} ${pub.key_findings}`.toLowerCase();
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        if (!topicCounts.has(keyword)) {
          topicCounts.set(keyword, { count: 0, papers: [] });
        }
        const topic = topicCounts.get(keyword)!;
        topic.count++;
        if (pub.title) topic.papers.push(pub.title);
      }
    });
  });
  
  // Sort by count and return top emerging topics
  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([topic, data]) => ({
      topic: topic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      count: data.count,
      papers: data.papers.slice(0, 3) // Top 3 papers
    }));
};

// Analyze publication type trends over time
export const analyzePublicationTypeTrends = (publications: Publication[]) => {
  const yearTypeMap = new Map<number, Map<string, number>>();
  
  publications.forEach(pub => {
    const year = pub.year || 0;
    const type = pub.publication_type || 'Unknown';
    
    if (!yearTypeMap.has(year)) {
      yearTypeMap.set(year, new Map());
    }
    
    const typeMap = yearTypeMap.get(year)!;
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });
  
  // Convert to array format for charts
  const years = Array.from(yearTypeMap.keys()).sort();
  const types = new Set<string>();
  
  yearTypeMap.forEach(typeMap => {
    typeMap.forEach((_, type) => types.add(type));
  });
  
  const data = years.map(year => {
    const yearData: any = { year };
    const typeMap = yearTypeMap.get(year)!;
    
    types.forEach(type => {
      yearData[type] = typeMap.get(type) || 0;
    });
    
    return yearData;
  });
  
  return { data, types: Array.from(types) };
};

// Extract key research questions from publications
export const extractKeyResearchQuestions = (publications: Publication[], domain?: string) => {
  const filteredPubs = domain 
    ? publications.filter(pub => pub.research_domain === domain)
    : publications;
  
  // Extract questions from titles and key findings
  const questions = new Set<string>();
  
  filteredPubs.forEach(pub => {
    // Look for question patterns in titles
    if (pub.title && pub.title.includes('?')) {
      questions.add(pub.title);
    }
    
    // Extract implied questions from research focus
    if (pub.key_findings) {
      // Convert findings to potential research questions
      const findings = pub.key_findings.toLowerCase();
      if (findings.includes('impact of')) {
        questions.add(`What is the ${pub.key_findings.match(/impact of [^.]+/i)?.[0]}?`);
      }
      if (findings.includes('effectiveness of')) {
        questions.add(`How effective is ${pub.key_findings.match(/effectiveness of [^.]+/i)?.[0]}?`);
      }
    }
  });
  
  return Array.from(questions).slice(0, 5);
};

// Extract policy applications from publications
export const extractPolicyApplications = (publications: Publication[], domain?: string) => {
  const filteredPubs = domain 
    ? publications.filter(pub => pub.research_domain === domain)
    : publications;
  
  const applications = new Set<string>();
  
  filteredPubs.forEach(pub => {
    if (pub.policy_implications) {
      // Extract first sentence or key point
      const firstPoint = pub.policy_implications.split(/[.!?]/)[0];
      if (firstPoint) applications.add(firstPoint.trim());
    }
  });
  
  return Array.from(applications).slice(0, 5);
};