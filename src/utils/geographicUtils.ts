import { Publication } from '../types/publication';

export interface StateData {
  state: string;
  stateCode: string;
  publicationCount: number;
  researchIntensity: number;
  topDomains: string[];
  yearRange: [number, number];
  publications: Publication[];
  usageTypeDistribution: {
    PRIMARY_ANALYSIS: number;
    RESEARCH_ENABLER: number;
    CONTEXTUAL_REFERENCE: number;
  };
}

export interface RegionalData {
  region: string;
  states: string[];
  totalPublications: number;
  dominantDomains: string[];
}

// US State name to abbreviation mapping
const STATE_ABBREVIATIONS: { [key: string]: string } = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

// Regional groupings for analysis
const REGIONS: { [key: string]: string[] } = {
  'Northeast': ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA'],
  'Southeast': ['DE', 'MD', 'VA', 'WV', 'KY', 'TN', 'NC', 'SC', 'GA', 'FL', 'AL', 'MS'],
  'Midwest': ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  'Southwest': ['TX', 'OK', 'AR', 'LA', 'NM', 'AZ'],
  'West': ['CO', 'WY', 'MT', 'ID', 'UT', 'NV', 'CA', 'OR', 'WA', 'AK', 'HI']
};

/**
 * Extract state information from geographic focus field
 */
export const extractStateFromGeographic = (geographic: string): string | null => {
  const geo = geographic.toLowerCase();
  
  // Handle specific state patterns
  if (geo.includes('california')) return 'California';
  if (geo.includes('vermont')) return 'Vermont';
  if (geo.includes('pennsylvania')) return 'Pennsylvania';
  if (geo.includes('massachusetts')) return 'Massachusetts';
  if (geo.includes('oregon')) return 'Oregon';
  if (geo.includes('texas')) return 'Texas';
  if (geo.includes('florida')) return 'Florida';
  if (geo.includes('new york')) return 'New York';
  
  // Check for state mentions in parentheses
  const stateMatch = geographic.match(/\(([^)]+)\s*state\)/i);
  if (stateMatch) {
    const stateName = stateMatch[1].trim();
    const properCase = stateName.charAt(0).toUpperCase() + stateName.slice(1).toLowerCase();
    if (STATE_ABBREVIATIONS[properCase]) {
      return properCase;
    }
  }
  
  // Check for direct state name matches
  for (const [stateName] of Object.entries(STATE_ABBREVIATIONS)) {
    if (geo.includes(stateName.toLowerCase())) {
      return stateName;
    }
  }
  
  return null;
};

/**
 * Aggregate publications by state
 */
export const aggregateByState = (publications: Publication[]): StateData[] => {
  const stateGroups: { [key: string]: Publication[] } = {};
  
  // Group publications by state
  publications.forEach(pub => {
    const state = extractStateFromGeographic(pub.geographic_focus);
    if (state) {
      if (!stateGroups[state]) {
        stateGroups[state] = [];
      }
      stateGroups[state].push(pub);
    }
  });
  
  // Calculate metrics for each state
  const stateData: StateData[] = Object.entries(stateGroups).map(([state, pubs]) => {
    const publicationCount = pubs.length;
    
    // Calculate research intensity based on publication count relative to total
    const researchIntensity = (publicationCount / publications.length) * 100;
    
    // Get top research domains
    const domainCounts: { [key: string]: number } = {};
    pubs.forEach(pub => {
      domainCounts[pub.research_domain] = (domainCounts[pub.research_domain] || 0) + 1;
    });
    const topDomains = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([domain]) => domain);
    
    // Calculate year range
    const years = pubs.map(pub => pub.year);
    const yearRange: [number, number] = [Math.min(...years), Math.max(...years)];
    
    // Calculate usage type distribution
    const usageTypeDistribution = {
      PRIMARY_ANALYSIS: pubs.filter(pub => pub.usage_type === 'PRIMARY_ANALYSIS').length,
      RESEARCH_ENABLER: pubs.filter(pub => pub.usage_type === 'RESEARCH_ENABLER').length,
      CONTEXTUAL_REFERENCE: pubs.filter(pub => pub.usage_type === 'CONTEXTUAL_REFERENCE').length
    };
    
    return {
      state,
      stateCode: STATE_ABBREVIATIONS[state] || state.substring(0, 2).toUpperCase(),
      publicationCount,
      researchIntensity,
      topDomains,
      yearRange,
      publications: pubs,
      usageTypeDistribution
    };
  });
  
  return stateData.sort((a, b) => b.researchIntensity - a.researchIntensity);
};

/**
 * Generate regional analysis data
 */
export const generateRegionalData = (stateData: StateData[]): RegionalData[] => {
  const regionalData: RegionalData[] = [];
  
  Object.entries(REGIONS).forEach(([region, stateCodes]) => {
    const regionStates = stateData.filter(state => stateCodes.includes(state.stateCode));
    
    if (regionStates.length > 0) {
      const totalPublications = regionStates.reduce((sum, state) => sum + state.publicationCount, 0);
      
      // Get dominant domains across the region
      const domainCounts: { [key: string]: number } = {};
      regionStates.forEach(state => {
        state.topDomains.forEach(domain => {
          domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        });
      });
      
      const dominantDomains = Object.entries(domainCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([domain]) => domain);
      
      regionalData.push({
        region,
        states: regionStates.map(state => state.state),
        totalPublications,
        dominantDomains
      });
    }
  });
  
  return regionalData.sort((a, b) => b.totalPublications - a.totalPublications);
};

/**
 * Get detailed statistics for a specific state
 */
export const getStateStatistics = (stateData: StateData, allPublications: Publication[]) => {
  return {
    ...stateData,
    nationalComparison: {
      publicationShare: (stateData.publicationCount / allPublications.length) * 100
    },
    recentTrends: {
      recentPublications: stateData.publications.filter(pub => pub.year >= 2023).length,
      growthRate: calculateGrowthRate(stateData.publications)
    }
  };
};

/**
 * Calculate publication growth rate for a state
 */
const calculateGrowthRate = (publications: Publication[]): number => {
  const yearCounts: { [key: number]: number } = {};
  publications.forEach(pub => {
    yearCounts[pub.year] = (yearCounts[pub.year] || 0) + 1;
  });
  
  const years = Object.keys(yearCounts).map(Number).sort();
  if (years.length < 2) return 0;
  
  const firstHalf = years.slice(0, Math.ceil(years.length / 2));
  const secondHalf = years.slice(Math.floor(years.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, year) => sum + yearCounts[year], 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, year) => sum + yearCounts[year], 0) / secondHalf.length;
  
  return firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
};

/**
 * Get the region for a given state code
 */
export const getRegionForState = (stateCode: string): string => {
  for (const [region, stateCodes] of Object.entries(REGIONS)) {
    if (stateCodes.includes(stateCode)) {
      return region;
    }
  }
  return 'Unknown';
};

/**
 * Color scale for map visualization
 */
export const getResearchIntensityColor = (intensity: number): string => {
  // Use a blue color scale from light to dark
  const normalized = Math.max(0, Math.min(100, intensity)) / 100;
  const hue = 210; // Blue hue
  const saturation = 70;
  const lightness = 90 - (normalized * 40); // Range from 90% to 50% lightness
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Generate tooltip content for state hover
 */
export const generateStateTooltip = (stateData: StateData): string => {
  const topDomain = stateData.topDomains[0] || 'Various';
  
  return `
    <div style="text-align: left;">
      <strong>${stateData.state}</strong><br/>
      <span style="color: #10B981;">Publications:</span> ${stateData.publicationCount}<br/>
      <span style="color: #3B82F6;">Research Intensity:</span> ${stateData.researchIntensity.toFixed(1)}%<br/>
      <span style="color: #8B5CF6;">Top Domain:</span> ${topDomain}
    </div>
  `;
};