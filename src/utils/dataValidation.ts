import { Publication } from '../types/publication';

/**
 * Validates and fixes publication data quality issues
 */
export const validateAndFixPublicationData = (publications: Publication[]): Publication[] => {
  return publications.map(pub => {
    // Fix publication_type if it's empty or invalid
    let fixedPubType = pub.publication_type;
    
    // Map common variations and fix empty values
    if (!fixedPubType || fixedPubType === 'UNKNOWN' || fixedPubType === '') {
      // Try to infer from publisher or journal
      const publisherLower = pub.publisher?.toLowerCase() || '';
      const journalLower = pub.journal?.toLowerCase() || '';
      
      if (publisherLower.includes('government') || publisherLower.includes('commission') || 
          publisherLower.includes('department') || journalLower.includes('hearing') ||
          journalLower.includes('commission')) {
        fixedPubType = 'GOVERNMENT';
      } else if (publisherLower.includes('kff') || publisherLower.includes('institute') || 
                 publisherLower.includes('foundation') || journalLower.includes('brief') ||
                 journalLower.includes('report')) {
        fixedPubType = 'POLICY';
      } else if (journalLower.includes('journal') || journalLower.includes('jama') || 
                 journalLower.includes('health affairs') || publisherLower.includes('university')) {
        fixedPubType = 'ACADEMIC';
      } else {
        fixedPubType = 'OTHER';
      }
    }
    
    // Normalize publication type to uppercase
    fixedPubType = fixedPubType.toUpperCase();
    
    return {
      ...pub,
      publication_type: fixedPubType
    };
  });
};

/**
 * Compute cross-domain analysis data for heatmap
 */
export interface CrossDomainData {
  domain: string;
  usageType: string;
  count: number;
  percentage: number;
  totalPublications?: number; // Total publications in the dataset
  domainTotal?: number; // Total publications in this domain
}

export const computeCrossDomainAnalysis = (publications: Publication[]): CrossDomainData[] => {
  // Create a map to store counts
  const crossTabulation: Map<string, number> = new Map();
  const domainTotals: Map<string, number> = new Map();
  
  // Count occurrences
  publications.forEach(pub => {
    const domain = pub.research_domain || 'Unknown';
    const usageType = pub.usage_type || 'Unknown';
    const key = `${domain}|${usageType}`;
    
    crossTabulation.set(key, (crossTabulation.get(key) || 0) + 1);
    domainTotals.set(domain, (domainTotals.get(domain) || 0) + 1);
  });
  
  // Convert to array format for heatmap
  const results: CrossDomainData[] = [];
  
  crossTabulation.forEach((count, key) => {
    const [domain, usageType] = key.split('|');
    const domainTotal = domainTotals.get(domain) || 1;
    
    results.push({
      domain,
      usageType: formatUsageType(usageType),
      count,
      percentage: Math.min(100, Math.round((count / domainTotal) * 100)), // Cap at 100% to handle data issues
      totalPublications: publications.length,
      domainTotal: domainTotal
    });
  });
  
  return results;
};

/**
 * Format usage type for display
 */
const formatUsageType = (usageType: string): string => {
  const formatted = usageType.replace(/_/g, ' ').toLowerCase();
  return formatted.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get domain statistics with verified counts
 */
export interface DomainStats {
  domain: string;
  total: number;
  primary: number;
  enabler: number;
  contextual: number;
  trend: 'rising' | 'stable' | 'declining';
  recentGrowth: number;
}

export const getDomainStatistics = (publications: Publication[]): DomainStats[] => {
  const stats: Map<string, DomainStats> = new Map();
  
  // Group publications by domain and year
  const domainYearCounts: Map<string, Map<number, number>> = new Map();
  
  publications.forEach(pub => {
    const domain = pub.research_domain || 'Unknown';
    const year = pub.year;
    
    // Initialize stats if not exists
    if (!stats.has(domain)) {
      stats.set(domain, {
        domain,
        total: 0,
        primary: 0,
        enabler: 0,
        contextual: 0,
        trend: 'stable',
        recentGrowth: 0
      });
    }
    
    const domainStats = stats.get(domain)!;
    domainStats.total++;
    
    // Count by usage type
    switch (pub.usage_type) {
      case 'PRIMARY_ANALYSIS':
        domainStats.primary++;
        break;
      case 'RESEARCH_ENABLER':
        domainStats.enabler++;
        break;
      case 'CONTEXTUAL_REFERENCE':
        domainStats.contextual++;
        break;
    }
    
    // Track year counts for trend analysis
    if (!domainYearCounts.has(domain)) {
      domainYearCounts.set(domain, new Map());
    }
    const yearCounts = domainYearCounts.get(domain)!;
    yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
  });
  
  // Calculate trends
  const currentYear = new Date().getFullYear();
  stats.forEach((domainStats, domain) => {
    const yearCounts = domainYearCounts.get(domain)!;
    
    // Calculate recent vs older publications
    let recentCount = 0;
    let olderCount = 0;
    
    yearCounts.forEach((count, year) => {
      if (year >= currentYear - 2) {
        recentCount += count;
      } else if (year >= currentYear - 4) {
        olderCount += count;
      }
    });
    
    // Determine trend
    if (recentCount > olderCount * 1.5) {
      domainStats.trend = 'rising';
      domainStats.recentGrowth = Math.round(((recentCount - olderCount) / (olderCount || 1)) * 100);
    } else if (recentCount < olderCount * 0.7) {
      domainStats.trend = 'declining';
      domainStats.recentGrowth = Math.round(((recentCount - olderCount) / (olderCount || 1)) * 100);
    } else {
      domainStats.trend = 'stable';
      domainStats.recentGrowth = 0;
    }
  });
  
  return Array.from(stats.values()).sort((a, b) => b.total - a.total);
};