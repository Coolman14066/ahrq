import { useMemo } from 'react';
import { Publication } from './usePublicationData';
import { PublicationFilters } from './usePublicationFilters';
import { 
  computeYearDistribution, 
  computeDomainDistribution, 
  computeUsageDistribution, 
  computePublicationTypeDistribution 
} from '../utils/statisticsUtils';
import {
  calculateResearchMomentum,
  identifyEmergingTopics,
  getTopInstitutions,
  analyzeCrossSectorCollaboration,
  analyzeResearchDomains
} from '../utils/researchAnalytics';
import { 
  computeCrossDomainAnalysis,
  getDomainStatistics
} from '../utils/dataValidation';

export interface ComputedMetrics {
  // Distribution data
  yearData: Array<{ year: number; publications: number; growth: number }>;
  domainData: Array<{ name: string; value: number; percentage: number }>;
  usageData: Array<{ name: string; value: number }>;
  pubTypeData: Array<{ name: string; value: number }>;
  
  // Analytics
  researchMomentum: {
    accelerating: any[];
    stable: any[];
    declining: any[];
  };
  emergingTopics: any[];
  crossDomainData: any[];
  domainStats: any[];
  
  // Filtering
  filteredPublications: Publication[];
  
  // Counts
  usageTypeCounts: {
    primary: number;
    enabler: number;
    contextual: number;
  };
  
  // Pagination
  totalPages: number;
  currentPublications: Publication[];
  startIndex: number;
  endIndex: number;
  
  // Optional future metrics
  topInstitutions?: any[];
  sectorCollaboration?: any[];
  domainAnalysis?: Map<string, any>;
}

interface UseComputedMetricsProps {
  publications: Publication[];
  loading: boolean;
  filters: PublicationFilters;
  itemsPerPage: number;
}

export const useComputedMetrics = ({
  publications,
  loading,
  filters,
  itemsPerPage
}: UseComputedMetricsProps): ComputedMetrics => {
  
  // Year distribution
  const yearData = useMemo(() => {
    return computeYearDistribution(publications);
  }, [publications]);

  // Domain distribution
  const domainData = useMemo(() => {
    const domains = computeDomainDistribution(publications);
    const total = publications.length;
    return domains.map(d => ({
      ...d,
      percentage: total > 0 ? parseFloat(((d.value / total) * 100).toFixed(1)) : 0
    }));
  }, [publications]);

  // Usage type distribution
  const usageData = useMemo(() => {
    return computeUsageDistribution(publications);
  }, [publications]);

  // Publication type distribution
  const pubTypeData = useMemo(() => {
    return computePublicationTypeDistribution(publications);
  }, [publications]);

  // Research momentum analysis
  const researchMomentum = useMemo(() => {
    return calculateResearchMomentum(publications);
  }, [publications]);

  // Emerging topics
  const emergingTopics = useMemo(() => {
    return identifyEmergingTopics(publications, 2);
  }, [publications]);

  // Cross-domain analysis
  const crossDomainData = useMemo(() => {
    return computeCrossDomainAnalysis(publications);
  }, [publications]);

  // Domain statistics
  const domainStats = useMemo(() => {
    return getDomainStatistics(publications);
  }, [publications]);

  // Filtered publications with enhanced filtering logic
  const filteredPublications = useMemo(() => {
    if (loading) return [];
    
    let filtered = [...publications];
    
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(pub => 
        pub.title.toLowerCase().includes(query) ||
        pub.authors.toLowerCase().includes(query) ||
        pub.research_domain.toLowerCase().includes(query) ||
        pub.key_findings.toLowerCase().includes(query) ||
        pub.policy_implications.toLowerCase().includes(query) ||
        pub.usage_description.toLowerCase().includes(query)
      );
    }
    
    // Domain filter
    if (filters.selectedDomain !== 'all') {
      filtered = filtered.filter(pub => pub.research_domain === filters.selectedDomain);
    }
    
    // Year filter
    if (filters.selectedYear !== 'all') {
      filtered = filtered.filter(pub => pub.year === parseInt(filters.selectedYear));
    }
    
    // Usage type filter
    if (filters.selectedUsageType !== 'all') {
      filtered = filtered.filter(pub => pub.usage_type === filters.selectedUsageType);
    }
    
    // Publication type filter
    if (filters.selectedPubType !== 'all') {
      filtered = filtered.filter(pub => pub.publication_type === filters.selectedPubType);
    }
    
    // Geographic reach filter
    if (filters.selectedGeographicReach !== 'all') {
      filtered = filtered.filter(pub => pub.geographic_reach === filters.selectedGeographicReach);
    }
    
    // Quality threshold filter
    if (filters.selectedQualityThreshold > 0) {
      filtered = filtered.filter(pub => 
        (pub.quality_score || 0) >= filters.selectedQualityThreshold
      );
    }
    
    // Sort by year (descending) and then by quality score
    filtered.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return (b.quality_score || 0) - (a.quality_score || 0);
    });
    
    return filtered;
  }, [
    publications, 
    loading, 
    filters.searchQuery, 
    filters.selectedDomain, 
    filters.selectedYear,
    filters.selectedUsageType, 
    filters.selectedPubType, 
    filters.selectedGeographicReach, 
    filters.selectedQualityThreshold
  ]);

  // Usage type counts
  const usageTypeCounts = useMemo(() => ({
    primary: publications.filter(p => p.usage_type === 'PRIMARY_ANALYSIS').length,
    enabler: publications.filter(p => p.usage_type === 'RESEARCH_ENABLER').length,
    contextual: publications.filter(p => p.usage_type === 'CONTEXTUAL_REFERENCE').length,
  }), [publications]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPublications.length / itemsPerPage);
  const startIndex = (filters.currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPublications = filteredPublications.slice(startIndex, endIndex);

  // Optional future metrics (uncomment when needed)
  const topInstitutions = useMemo(() => {
    return getTopInstitutions(publications, 10);
  }, [publications]);

  const sectorCollaboration = useMemo(() => {
    return analyzeCrossSectorCollaboration(publications);
  }, [publications]);

  const domainAnalysis = useMemo(() => {
    return analyzeResearchDomains(publications);
  }, [publications]);

  return {
    // Distribution data
    yearData,
    domainData,
    usageData,
    pubTypeData,
    
    // Analytics
    researchMomentum,
    emergingTopics,
    crossDomainData,
    domainStats,
    
    // Filtering
    filteredPublications,
    
    // Counts
    usageTypeCounts,
    
    // Pagination
    totalPages,
    currentPublications,
    startIndex,
    endIndex,
    
    // Optional metrics
    topInstitutions,
    sectorCollaboration,
    domainAnalysis
  };
};