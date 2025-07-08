import { Publication } from '../types/publication';

/**
 * Compute year distribution with counts and growth rates
 */
export const computeYearDistribution = (publications: Publication[]) => {
  const yearCounts: { [year: number]: number } = {};
  const MIN_YEAR = 2021; // Start temporal analysis from 2021
  const currentYear = new Date().getFullYear();
  
  // Count publications by year (only from 2021 onwards)
  publications.forEach(pub => {
    const year = pub.year;
    if (year >= MIN_YEAR && year <= currentYear) {
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    }
  });
  
  // Convert to array and sort by year
  const years = Object.keys(yearCounts)
    .map(year => parseInt(year))
    .sort((a, b) => a - b);
  
  // Calculate growth rates
  const yearData = years.map((year, index) => {
    const count = yearCounts[year];
    let growth = 0;
    
    if (index > 0) {
      const prevYear = years[index - 1];
      const prevCount = yearCounts[prevYear];
      growth = prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : 0;
    }
    
    return {
      year,
      publications: count,
      growth: Math.round(growth)
    };
  });
  
  return yearData;
};

/**
 * Compute domain distribution
 */
export const computeDomainDistribution = (publications: Publication[]) => {
  const domainCounts: { [domain: string]: number } = {};
  
  publications.forEach(pub => {
    const domain = pub.research_domain || 'Unknown';
    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });
  
  // Sort by count and convert to array
  const domainData = Object.entries(domainCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  return domainData;
};

/**
 * Compute usage type distribution
 */
export const computeUsageDistribution = (publications: Publication[]) => {
  // Define consistent ordering and display names
  const USAGE_ORDER = ['PRIMARY_ANALYSIS', 'RESEARCH_ENABLER', 'CONTEXTUAL_REFERENCE'];
  const DISPLAY_NAMES: { [key: string]: string } = {
    'PRIMARY_ANALYSIS': 'Primary Analysis',
    'RESEARCH_ENABLER': 'Research Enabler',
    'CONTEXTUAL_REFERENCE': 'Contextual Reference',
    'UNKNOWN': 'Unknown'
  };
  
  const usageCounts: { [usage: string]: number } = {};
  
  // console.log('[computeUsageDistribution] Input publications:', publications.length);
  // console.log('[computeUsageDistribution] Sample publication usage_type:', publications[0]?.usage_type);
  
  // Initialize counts for all known types
  USAGE_ORDER.forEach(type => {
    usageCounts[type] = 0;
  });
  
  publications.forEach(pub => {
    const usage = pub.usage_type || 'UNKNOWN';
    usageCounts[usage] = (usageCounts[usage] || 0) + 1;
  });
  
  // console.log('[computeUsageDistribution] Usage counts:', usageCounts);
  
  // Format for display with consistent ordering
  const usageData: Array<{ name: string; value: number; percentage: number }> = [];
  
  // Add known types in order
  USAGE_ORDER.forEach(type => {
    if (usageCounts[type] > 0) {
      usageData.push({
        name: DISPLAY_NAMES[type],
        value: usageCounts[type],
        percentage: Math.round((usageCounts[type] / publications.length) * 100)
      });
    }
  });
  
  // Add any unknown types at the end
  Object.entries(usageCounts).forEach(([type, count]) => {
    if (!USAGE_ORDER.includes(type) && count > 0) {
      usageData.push({
        name: DISPLAY_NAMES[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        percentage: Math.round((count / publications.length) * 100)
      });
    }
  });
  
  // console.log('[computeUsageDistribution] Final usage data:', usageData);
  // console.log('[DEBUG] Usage data names:', usageData.map(d => d.name));
  
  return usageData;
};

/**
 * Compute publication type distribution
 */
export const computePublicationTypeDistribution = (publications: Publication[]) => {
  const typeCounts: { [type: string]: number } = {};
  
  publications.forEach(pub => {
    const type = pub.publication_type || 'UNKNOWN';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  const typeData = Object.entries(typeCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
    value
  }));
  
  return typeData;
};

/**
 * Compute domain evolution over time
 */
export const computeDomainEvolution = (publications: Publication[]) => {
  // Group by year and domain
  const yearDomainCounts: { [year: number]: { [domain: string]: number } } = {};
  
  publications.forEach(pub => {
    const year = pub.year;
    const domain = pub.research_domain || 'Unknown';
    
    if (!yearDomainCounts[year]) {
      yearDomainCounts[year] = {};
    }
    
    yearDomainCounts[year][domain] = (yearDomainCounts[year][domain] || 0) + 1;
  });
  
  // Convert to array format for chart
  const years = Object.keys(yearDomainCounts)
    .map(y => parseInt(y))
    .sort((a, b) => a - b);
  
  const evolution = years.map(year => {
    const data: any = { year };
    
    // Get top domains for this year
    const yearData = yearDomainCounts[year];
    const topDomains = Object.entries(yearData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([domain]) => domain);
    
    // Add counts for top domains
    topDomains.forEach(domain => {
      const simplifiedName = domain.split('&')[0].trim();
      data[simplifiedName] = yearData[domain] || 0;
    });
    
    return data;
  });
  
  return evolution;
};

/**
 * Get research gap insights
 */
export const computeResearchGaps = (publications: Publication[]) => {
  const currentYear = new Date().getFullYear();
  const recentPubs = publications.filter(p => p.year >= currentYear - 2);
  
  // Analyze geographic coverage
  const geoCoverage = new Set(publications.map(p => p.geographic_focus));
  const stateSpecific = publications.filter(p => 
    p.geographic_focus && p.geographic_focus.includes('state')
  ).length;
  
  // Analyze domain coverage
  const domainCounts = computeDomainDistribution(publications);
  const underrepresentedDomains = domainCounts.filter(d => d.value < 5);
  
  return {
    geographicGaps: {
      stateSpecificStudies: stateSpecific,
      totalStatesStudied: geoCoverage.size,
      ruralStudies: publications.filter(p => 
        p.geographic_focus?.toLowerCase().includes('rural')
      ).length
    },
    domainGaps: {
      underrepresentedCount: underrepresentedDomains.length,
      underrepresentedDomains: underrepresentedDomains.map(d => d.name)
    },
    temporalGaps: {
      recentPublications: recentPubs.length,
      percentageRecent: Math.round((recentPubs.length / publications.length) * 100)
    }
  };
};