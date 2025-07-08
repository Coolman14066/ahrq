import { Publication } from '../types/publication';
import { 
  SankeyNode, 
  SankeyLink, 
  SankeyFlow, 
  SankeyNodeCategory, 
  GeographicCategory,
  SankeyFlowMetrics,
  SankeyFilter,
  FlowInsight
} from '../types/sankey';
import { debugLog } from './debugUtils';

// Policy Impact Categories
enum PolicyImpactCategory {
  MARKET_COMPETITION = 'Market Competition & Antitrust',
  HEALTHCARE_AFFORDABILITY = 'Healthcare Affordability & Access',
  DATA_STANDARDS = 'Data & Methodology Standards',
  QUALITY_OVERSIGHT = 'Quality & Performance Oversight',
  STRATEGIC_PLANNING = 'Strategic Planning & Policy Development'
}

// Helper to create empty metrics when no data is available
const createEmptyMetrics = (): SankeyFlowMetrics => ({
  totalNodes: 0,
  totalLinks: 0,
  maxFlowValue: 0,
  avgFlowValue: 0,
  flowDensity: 0,
  levelDistribution: {
    [SankeyNodeCategory.PUBLICATION_TYPE]: {
      nodeCount: 0,
      totalValue: 0,
      avgValue: 0,
      dominantNode: 'None'
    },
    [SankeyNodeCategory.USAGE_TYPE]: {
      nodeCount: 0,
      totalValue: 0,
      avgValue: 0,
      dominantNode: 'None'
    },
    [SankeyNodeCategory.RESEARCH_DOMAIN]: {
      nodeCount: 0,
      totalValue: 0,
      avgValue: 0,
      dominantNode: 'None'
    },
    [SankeyNodeCategory.GEOGRAPHIC_FOCUS]: {
      nodeCount: 0,
      totalValue: 0,
      avgValue: 0,
      dominantNode: 'None'
    }
  },
  highestImpactPath: { path: [], totalValue: 0, avgPolicyImpact: 0 },
  yearlyFlowTrends: [],
  qualityDistribution: { highQuality: 0, mediumQuality: 0, lowQuality: 0 },
  conversionRates: {
    publicationToUsage: 0,
    usageToDomain: 0,
    domainToGeographic: 0
  }
});

/**
 * Categorize policy implications text into discrete policy impact categories
 */
export const categorizePolicyImpact = (policyText: string): PolicyImpactCategory => {
  if (!policyText || policyText.trim() === '') {
    return PolicyImpactCategory.STRATEGIC_PLANNING;
  }
  
  const text = policyText.toLowerCase();
  
  // Market Competition & Antitrust - highest priority matching
  if (text.includes('antitrust') || text.includes('competition') || 
      text.includes('market power') || text.includes('consolidation') ||
      text.includes('merger') || text.includes('monopol') ||
      text.includes('market concentration') || text.includes('hhi')) {
    return PolicyImpactCategory.MARKET_COMPETITION;
  }
  
  // Healthcare Affordability & Access
  if (text.includes('affordability') || text.includes('cost') || 
      text.includes('pricing') || text.includes('price') ||
      text.includes('access') || text.includes('financial') ||
      text.includes('payment') || text.includes('reimbursement')) {
    return PolicyImpactCategory.HEALTHCARE_AFFORDABILITY;
  }
  
  // Data & Methodology Standards
  if (text.includes('transparency') || text.includes('data collection') ||
      text.includes('methodology') || text.includes('standardization') ||
      text.includes('reporting') || text.includes('data quality') ||
      text.includes('measurement') || text.includes('definition')) {
    return PolicyImpactCategory.DATA_STANDARDS;
  }
  
  // Quality & Performance Oversight
  if (text.includes('quality') || text.includes('performance') ||
      text.includes('patient safety') || text.includes('outcomes') ||
      text.includes('effectiveness') || text.includes('oversight') ||
      text.includes('monitoring') || text.includes('improvement')) {
    return PolicyImpactCategory.QUALITY_OVERSIGHT;
  }
  
  // Strategic Planning & Policy Development (default)
  return PolicyImpactCategory.STRATEGIC_PLANNING;
};

/**
 * Categorize geographic focus text into discrete geographic categories
 */
const categorizeGeographicFocus = (geographicFocus: string): string => {
  if (!geographicFocus || geographicFocus.trim() === '') {
    return 'Unknown';
  }
  
  const focus = geographicFocus.toLowerCase();
  
  // National level
  if (focus.includes('usa') || focus.includes('united states') || 
      focus.includes('u.s.') || focus.includes('national') ||
      focus.includes('america') || focus === 'us') {
    return GeographicCategory.NATIONAL;
  }
  
  // State level
  if (focus.includes('state') || focus.includes('states')) {
    return GeographicCategory.STATE;
  }
  
  // Regional level
  if (focus.includes('region') || focus.includes('multi-state') ||
      focus.includes('midwest') || focus.includes('northeast') ||
      focus.includes('southeast') || focus.includes('southwest') ||
      focus.includes('northwest') || focus.includes('south') ||
      focus.includes('north') || focus.includes('west') || focus.includes('east')) {
    return GeographicCategory.REGIONAL;
  }
  
  // Local level
  if (focus.includes('local') || focus.includes('county') || 
      focus.includes('city') || focus.includes('town') ||
      focus.includes('municipal') || focus.includes('community')) {
    return GeographicCategory.LOCAL;
  }
  
  // International level
  if (focus.includes('international') || focus.includes('global') ||
      focus.includes('world') || focus.includes('cross-national')) {
    return GeographicCategory.INTERNATIONAL;
  }
  
  // Default fallback
  return 'Unknown';
};

/**
 * Calculate weighted flow value based on publication characteristics
 */
export const calculateFlowWeight = (publications: Publication[]): number => {
  return publications.reduce((weight, pub) => {
    let baseWeight = 1;
    
    // Recency bonus (more recent = higher weight)
    const currentYear = new Date().getFullYear();
    const yearAge = currentYear - pub.year;
    const recencyMultiplier = yearAge <= 1 ? 1.5 : 
                            yearAge <= 3 ? 1.2 : 
                            yearAge <= 5 ? 1.0 : 0.8;
    baseWeight *= recencyMultiplier;
    
    return weight + baseWeight;
  }, 0);
};

/**
 * Build Sankey flow data structure from publications
 */
export const buildSankeyFlow = (publications: Publication[], filter?: Partial<SankeyFilter>): SankeyFlow => {
  debugLog('buildSankeyFlow', 'Starting build', {
    publicationsCount: publications?.length || 0,
    filter,
    hasPublications: Array.isArray(publications)
  });
  
  // Validate input
  if (!publications || !Array.isArray(publications) || publications.length === 0) {
    debugLog('buildSankeyFlow', 'WARNING: No publications provided');
    return { 
      nodes: [], 
      links: [], 
      levels: {
        [SankeyNodeCategory.PUBLICATION_TYPE]: [],
        [SankeyNodeCategory.USAGE_TYPE]: [],
        [SankeyNodeCategory.RESEARCH_DOMAIN]: [],
        [SankeyNodeCategory.GEOGRAPHIC_FOCUS]: []
      },
      metrics: createEmptyMetrics(),
      totalPublications: 0,
      totalFlowValue: 0
    };
  }
  
  // Apply filters
  const filteredPubs = applyFilters(publications, filter);
  debugLog('buildSankeyFlow', 'After filtering', {
    filteredCount: filteredPubs.length
  });
  
  // Additional validation: ensure we have valid publication types
  const validPubs = filteredPubs.filter(pub => {
    const hasValidType = pub.publication_type && 
                        pub.publication_type !== 'UNKNOWN' && 
                        pub.publication_type !== '';
    if (!hasValidType) {
      debugLog('buildSankeyFlow', 'Skipping publication with invalid type', {
        id: pub.id,
        type: pub.publication_type,
        title: pub.title?.substring(0, 50)
      });
    }
    return hasValidType;
  });
  
  if (validPubs.length === 0) {
    debugLog('buildSankeyFlow', 'WARNING: No valid publications after type validation');
    return { 
      nodes: [], 
      links: [], 
      levels: {
        [SankeyNodeCategory.PUBLICATION_TYPE]: [],
        [SankeyNodeCategory.USAGE_TYPE]: [],
        [SankeyNodeCategory.RESEARCH_DOMAIN]: [],
        [SankeyNodeCategory.GEOGRAPHIC_FOCUS]: []
      },
      metrics: createEmptyMetrics(),
      totalPublications: filteredPubs.length,
      totalFlowValue: 0
    };
  }
  
  // Check if we have publications after filtering
  if (validPubs.length === 0) {
    debugLog('buildSankeyFlow', 'No valid publications after filtering');
    return { 
      nodes: [], 
      links: [], 
      levels: {
        [SankeyNodeCategory.PUBLICATION_TYPE]: [],
        [SankeyNodeCategory.USAGE_TYPE]: [],
        [SankeyNodeCategory.RESEARCH_DOMAIN]: [],
        [SankeyNodeCategory.GEOGRAPHIC_FOCUS]: []
      },
      metrics: createEmptyMetrics(),
      totalPublications: 0,
      totalFlowValue: 0
    };
  }
  
  // Group publications by each flow level
  const pubsByType = groupByField(validPubs, 'publication_type');
  const pubsByUsage = groupByField(validPubs, 'usage_type');
  const pubsByDomain = groupByField(validPubs, 'research_domain');
  const pubsByGeographic = groupByGeographicFocus(validPubs);
  
  // Create nodes for each level
  const typeNodes = createNodes(pubsByType, SankeyNodeCategory.PUBLICATION_TYPE, 0);
  const usageNodes = createNodes(pubsByUsage, SankeyNodeCategory.USAGE_TYPE, 1);
  const domainNodes = createNodes(pubsByDomain, SankeyNodeCategory.RESEARCH_DOMAIN, 2);
  const geographicNodes = createNodes(pubsByGeographic, SankeyNodeCategory.GEOGRAPHIC_FOCUS, 3);
  
  const allNodes = [...typeNodes, ...usageNodes, ...domainNodes, ...geographicNodes];
  
  
  // Log node structure for debugging
  debugLog('buildSankeyFlow', 'Node structure check', {
    totalNodes: allNodes.length,
    sampleNode: allNodes[0],
    allHaveDepth: allNodes.every(n => n.depth !== undefined),
    depthValues: allNodes.map(n => ({ id: n.id, level: n.level, depth: n.depth }))
  });
  
  // Create links between levels
  const typeToUsageLinks = createLinks(validPubs, 'publication_type', 'usage_type', 0);
  const usageToDomainLinks = createLinks(validPubs, 'usage_type', 'research_domain', 1);
  const domainToGeographicLinks = createLinksToGeographicFocus(validPubs, 2);
  
  const allLinks = [...typeToUsageLinks, ...usageToDomainLinks, ...domainToGeographicLinks];
  
  // Calculate metrics
  const metrics = calculateFlowMetrics(allNodes, allLinks, validPubs);
  
  return {
    nodes: allNodes,
    links: allLinks,
    levels: {
      [SankeyNodeCategory.PUBLICATION_TYPE]: typeNodes,
      [SankeyNodeCategory.USAGE_TYPE]: usageNodes,
      [SankeyNodeCategory.RESEARCH_DOMAIN]: domainNodes,
      [SankeyNodeCategory.GEOGRAPHIC_FOCUS]: geographicNodes
    },
    metrics,
    totalPublications: validPubs.length,
    totalFlowValue: allLinks.reduce((sum, link) => sum + link.value, 0)
  };
};

/**
 * Group publications by a specific field
 */
const groupByField = (publications: Publication[], field: keyof Publication): Map<string, Publication[]> => {
  const groups = new Map<string, Publication[]>();
  
  publications.forEach(pub => {
    const value = String(pub[field] || 'Unknown');
    if (!groups.has(value)) {
      groups.set(value, []);
    }
    groups.get(value)!.push(pub);
  });
  
  return groups;
};

/**
 * Group publications by geographic focus
 */
const groupByGeographicFocus = (publications: Publication[]): Map<string, Publication[]> => {
  const groups = new Map<string, Publication[]>();
  
  publications.forEach(pub => {
    const geographic = categorizeGeographicFocus(pub.geographic_focus);
    if (!groups.has(geographic)) {
      groups.set(geographic, []);
    }
    groups.get(geographic)!.push(pub);
  });
  
  return groups;
};

/**
 * Create Sankey nodes from grouped publications
 */
const createNodes = (
  groupedPubs: Map<string, Publication[]>, 
  category: SankeyNodeCategory, 
  level: number
): SankeyNode[] => {
  return Array.from(groupedPubs.entries()).map(([name, pubs]) => {
    const years = pubs.map(pub => pub.year);
    
    // Calculate trend
    const recentPubs = pubs.filter(pub => pub.year >= 2022);
    const olderPubs = pubs.filter(pub => pub.year < 2022);
    const trend: 'growing' | 'stable' | 'declining' = 
      recentPubs.length > olderPubs.length ? 'growing' :
      recentPubs.length < olderPubs.length * 0.5 ? 'declining' : 'stable';
    
    // Extract top authors
    const authorCounts = new Map<string, number>();
    pubs.forEach(pub => {
      const authors = pub.authors.split(/[,;]/).map(a => a.trim()).filter(a => a.length > 0);
      authors.forEach(author => {
        authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
      });
    });
    const topAuthors = Array.from(authorCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([author]) => author);
    
    return {
      id: `${category}-${name}`,
      name,
      category,
      level,
      depth: level, // Add depth property for d3-sankey compatibility
      value: calculateFlowWeight(pubs),
      publications: pubs,
      avgQualityScore: 0,
      avgPolicyImpact: 0,
      publicationCount: pubs.length,
      yearRange: [Math.min(...years), Math.max(...years)] as [number, number],
      topAuthors,
      recentTrend: trend
    };
  });
};

/**
 * Create links between two levels
 */
const createLinks = (
  publications: Publication[], 
  sourceField: keyof Publication, 
  targetField: keyof Publication,
  level: number
): SankeyLink[] => {
  const linkMap = new Map<string, Publication[]>();
  
  publications.forEach(pub => {
    const sourceValue = String(pub[sourceField] || 'Unknown');
    const targetValue = String(pub[targetField] || 'Unknown');
    const linkKey = `${sourceValue}|${targetValue}`;
    
    if (!linkMap.has(linkKey)) {
      linkMap.set(linkKey, []);
    }
    linkMap.get(linkKey)!.push(pub);
  });
  
  return Array.from(linkMap.entries()).map(([linkKey, pubs]) => {
    const [sourceValue, targetValue] = linkKey.split('|');
    
    // Calculate temporal pattern
    const yearCounts = new Map<number, number>();
    pubs.forEach(pub => {
      yearCounts.set(pub.year, (yearCounts.get(pub.year) || 0) + 1);
    });
    const temporalPattern = Array.from(yearCounts.entries())
      .map(([year, count]) => ({
        year,
        count,
        weight: calculateFlowWeight(pubs.filter(p => p.year === year))
      }))
      .sort((a, b) => a.year - b.year);
    
    return {
      id: `link-${level}-${sourceValue}-${targetValue}`,
      source: `${getSourceCategory(level)}-${sourceValue}`,
      target: `${getTargetCategory(level)}-${targetValue}`,
      value: calculateFlowWeight(pubs),
      publications: pubs,
      avgQualityScore: 0,
      avgPolicyImpact: 0,
      strengthScore: 0,
      temporalPattern
    };
  });
};

/**
 * Create links to geographic focus
 */
const createLinksToGeographicFocus = (publications: Publication[], level: number): SankeyLink[] => {
  const linkMap = new Map<string, Publication[]>();
  
  publications.forEach(pub => {
    const sourceValue = pub.research_domain || 'Unknown';
    const targetValue = categorizeGeographicFocus(pub.geographic_focus);
    const linkKey = `${sourceValue}|${targetValue}`;
    
    if (!linkMap.has(linkKey)) {
      linkMap.set(linkKey, []);
    }
    linkMap.get(linkKey)!.push(pub);
  });
  
  return Array.from(linkMap.entries()).map(([linkKey, pubs]) => {
    const [sourceValue, targetValue] = linkKey.split('|');
    
    const temporalPattern = new Map<number, number>();
    pubs.forEach(pub => {
      temporalPattern.set(pub.year, (temporalPattern.get(pub.year) || 0) + 1);
    });
    
    return {
      id: `link-${level}-${sourceValue}-${targetValue}`,
      source: `${SankeyNodeCategory.RESEARCH_DOMAIN}-${sourceValue}`,
      target: `${SankeyNodeCategory.GEOGRAPHIC_FOCUS}-${targetValue}`,
      value: calculateFlowWeight(pubs),
      publications: pubs,
      avgQualityScore: 0,
      avgPolicyImpact: 0,
      strengthScore: 0,
      temporalPattern: Array.from(temporalPattern.entries())
        .map(([year, count]) => ({
          year,
          count,
          weight: calculateFlowWeight(pubs.filter(p => p.year === year))
        }))
        .sort((a, b) => a.year - b.year)
    };
  });
};

/**
 * Get source category for a given level
 */
const getSourceCategory = (level: number): SankeyNodeCategory => {
  switch (level) {
    case 0: return SankeyNodeCategory.PUBLICATION_TYPE;
    case 1: return SankeyNodeCategory.USAGE_TYPE;
    case 2: return SankeyNodeCategory.RESEARCH_DOMAIN;
    default: return SankeyNodeCategory.GEOGRAPHIC_FOCUS;
  }
};

/**
 * Get target category for a given level
 */
const getTargetCategory = (level: number): SankeyNodeCategory => {
  switch (level) {
    case 0: return SankeyNodeCategory.USAGE_TYPE;
    case 1: return SankeyNodeCategory.RESEARCH_DOMAIN;
    case 2: return SankeyNodeCategory.GEOGRAPHIC_FOCUS;
    default: return SankeyNodeCategory.GEOGRAPHIC_FOCUS;
  }
};

/**
 * Apply filters to publications
 */
const applyFilters = (publications: Publication[], filter?: Partial<SankeyFilter>): Publication[] => {
  if (!filter) return publications;
  
  return publications.filter(pub => {
    // Publication type filter
    if (filter.publicationTypes && filter.publicationTypes.length > 0) {
      if (!filter.publicationTypes.includes(pub.publication_type)) return false;
    }
    
    // Usage type filter
    if (filter.usageTypes && filter.usageTypes.length > 0) {
      if (!filter.usageTypes.includes(pub.usage_type)) return false;
    }
    
    // Research domain filter
    if (filter.researchDomains && filter.researchDomains.length > 0) {
      if (!filter.researchDomains.includes(pub.research_domain)) return false;
    }
    
    // Geographic category filter
    if (filter.geographicCategories && filter.geographicCategories.length > 0) {
      const category = categorizeGeographicFocus(pub.geographic_focus);
      if (!filter.geographicCategories.includes(category as GeographicCategory)) return false;
    }
    
    
    // Year range filter
    if (filter.yearRange) {
      if (pub.year < filter.yearRange[0] || pub.year > filter.yearRange[1]) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Calculate comprehensive flow metrics
 */
const calculateFlowMetrics = (
  nodes: SankeyNode[], 
  links: SankeyLink[], 
  publications: Publication[]
): SankeyFlowMetrics => {
  const totalFlowValue = links.reduce((sum, link) => sum + link.value, 0);
  const maxFlowValue = Math.max(...links.map(link => link.value));
  const avgFlowValue = totalFlowValue / links.length;
  
  // Level distribution
  const levelDistribution = {
    [SankeyNodeCategory.PUBLICATION_TYPE]: {
      nodeCount: 0,
      totalValue: 0,
      avgValue: 0,
      dominantNode: 'None'
    },
    [SankeyNodeCategory.USAGE_TYPE]: {
      nodeCount: 0,
      totalValue: 0,
      avgValue: 0,
      dominantNode: 'None'
    },
    [SankeyNodeCategory.RESEARCH_DOMAIN]: {
      nodeCount: 0,
      totalValue: 0,
      avgValue: 0,
      dominantNode: 'None'
    },
    [SankeyNodeCategory.GEOGRAPHIC_FOCUS]: {
      nodeCount: 0,
      totalValue: 0,
      avgValue: 0,
      dominantNode: 'None'
    }
  };
  
  Object.values(SankeyNodeCategory).forEach(category => {
    const categoryNodes = nodes.filter(node => node.category === category);
    const totalValue = categoryNodes.reduce((sum, node) => sum + node.value, 0);
    const dominantNode = categoryNodes.reduce((max, node) => 
      node.value > max.value ? node : max, categoryNodes[0]);
    
    levelDistribution[category] = {
      nodeCount: categoryNodes.length,
      totalValue,
      avgValue: categoryNodes.length > 0 ? totalValue / categoryNodes.length : 0,
      dominantNode: dominantNode?.name || 'None'
    };
  });
  
  // Find highest impact path
  const highestImpactPath = findHighestImpactPath(links);
  
  // Yearly trends
  const yearlyFlowTrends = calculateYearlyTrends(publications);
  
  return {
    totalNodes: nodes.length,
    totalLinks: links.length,
    maxFlowValue,
    avgFlowValue,
    flowDensity: links.length / (nodes.length * (nodes.length - 1) / 2),
    levelDistribution,
    highestImpactPath,
    yearlyFlowTrends,
    qualityDistribution: { highQuality: 0, mediumQuality: 0, lowQuality: 0 },
    conversionRates: {
      publicationToUsage: 1.0, // All publications have usage
      usageToDomain: 1.0, // All usage leads to domain
      domainToGeographic: 1.0 // All domains lead to impact
    }
  };
};

/**
 * Find the path through the flow with highest cumulative impact
 */
const findHighestImpactPath = (links: SankeyLink[]) => {
  debugLog('findHighestImpactPath', 'Finding highest impact', {
    linksCount: links?.length || 0,
    hasLinks: Array.isArray(links) && links.length > 0,
    firstLink: links?.[0]
  });
  
  if (!links || links.length === 0) {
    return { path: [], totalValue: 0, avgPolicyImpact: 0 };
  }
  
  // Simplified approach - find the single link with highest value and trace its path
  const highestImpactLink = links.reduce((max, link) => {
    if (!link || !max) return max || link;
    return (link.value || 0) > (max.value || 0) ? link : max;
  }, links[0]);
  
  if (!highestImpactLink) {
    return { path: [], totalValue: 0, avgPolicyImpact: 0 };
  }
  
  return {
    path: [
      typeof highestImpactLink.source === 'string' ? highestImpactLink.source : highestImpactLink.source?.name || 'Unknown',
      typeof highestImpactLink.target === 'string' ? highestImpactLink.target : highestImpactLink.target?.name || 'Unknown'
    ],
    totalValue: highestImpactLink.value || 0,
    avgPolicyImpact: 0
  };
};

/**
 * Calculate yearly flow trends
 */
const calculateYearlyTrends = (publications: Publication[]) => {
  const yearGroups = new Map<number, Publication[]>();
  publications.forEach(pub => {
    if (!yearGroups.has(pub.year)) {
      yearGroups.set(pub.year, []);
    }
    yearGroups.get(pub.year)!.push(pub);
  });
  
  return Array.from(yearGroups.entries())
    .map(([year, pubs]) => ({
      year,
      totalFlow: calculateFlowWeight(pubs),
      dominantPattern: findDominantPattern(pubs)
    }))
    .sort((a, b) => a.year - b.year);
};

/**
 * Find the dominant pattern for a set of publications
 */
const findDominantPattern = (publications: Publication[]): string => {
  const usageTypes = publications.map(pub => pub.usage_type);
  const usageCounts = new Map<string, number>();
  usageTypes.forEach(usage => {
    usageCounts.set(usage, (usageCounts.get(usage) || 0) + 1);
  });
  
  const dominantUsage = Array.from(usageCounts.entries())
    .reduce((max, [usage, count]) => count > max[1] ? [usage, count] : max);
  
  return dominantUsage[0];
};

/**
 * Generate insights from flow analysis
 */
export const generateFlowInsights = (flow: SankeyFlow): FlowInsight[] => {
  const insights: FlowInsight[] = [];
  
  // Check if we have any data
  if (!flow.links || flow.links.length === 0 || !flow.nodes || flow.nodes.length === 0) {
    debugLog('generateFlowInsights', 'No flow data available');
    return [{
      type: 'emerging_trend' as const,
      title: 'No Data Available',
      description: 'No research flow data is currently available. Please ensure data is loaded.',
      significance: 'low',
      relatedNodes: [],
      relatedPublications: [],
      confidence: 1.0
    }];
  }
  
  // Dominant path insight
  const dominantLink = flow.links.reduce((max, link) => 
    link.value > max.value ? link : max, flow.links[0]);
  
  if (!dominantLink) {
    return insights;
  }
  
  insights.push({
    type: 'dominant_path',
    title: 'Primary Research Impact Pathway',
    description: `The strongest flow connects ${typeof dominantLink.source === 'string' ? dominantLink.source : dominantLink.source?.name || 'Unknown'} to ${typeof dominantLink.target === 'string' ? dominantLink.target : dominantLink.target?.name || 'Unknown'}, representing ${dominantLink.publications?.length || 0} publications.`,
    significance: 'high',
    relatedNodes: [
      typeof dominantLink.source === 'string' ? dominantLink.source : dominantLink.source.id,
      typeof dominantLink.target === 'string' ? dominantLink.target : dominantLink.target.id
    ],
    relatedPublications: dominantLink.publications,
    confidence: 0.9
  });
  
  
  return insights;
};

/**
 * Default Sankey color scheme
 */
export const getDefaultColorScheme = () => ({
  [SankeyNodeCategory.PUBLICATION_TYPE]: {
    'GOVERNMENT': '#DC2626',
    'POLICY': '#2563EB',
    'ACADEMIC': '#059669',
    'OTHER': '#7C3AED'
  },
  [SankeyNodeCategory.USAGE_TYPE]: {
    'PRIMARY_ANALYSIS': '#EA580C',
    'RESEARCH_ENABLER': '#CA8A04',
    'CONTEXTUAL_REFERENCE': '#7C2D12'
  },
  [SankeyNodeCategory.RESEARCH_DOMAIN]: {
    'Market Power & Pricing': '#BE123C',
    'Consolidation & Mergers': '#9333EA',
    'Methodology & Data Quality': '#0891B2',
    'Payment & Reimbursement': '#059669',
    'Vertical Integration': '#7C3AED',
    'Quality & Outcomes': '#EA580C',
    'Rural Health': '#16A34A',
    'Health Equity & Access': '#DC2626'
  },
  [SankeyNodeCategory.GEOGRAPHIC_FOCUS]: {
    'USA': '#1e3a8a',
    'California': '#2563EB',
    'Vermont': '#059669',
    'Regional': '#7C3AED',
    'State-level': '#EA580C',
    'Local': '#DC2626',
    'International': '#0891B2',
    'Upper Midwest USA': '#16A34A',
    'Chile': '#CA8A04'
  }
});