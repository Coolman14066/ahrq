import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Publication } from '../../types/publication';
import { NetworkMetrics } from '../../types/network';

interface DashboardContextType {
  // Current View State
  activeView: 'overview' | 'network' | 'sankey' | 'trends' | 'explore' | 'explorer' | 'domains' | 'methodology' | 'gaps';
  selectedFilters: {
    years: [number, number];
    publicationTypes: string[];
    usageTypes: string[];
    domains: string[];
    authors: string[];
  };
  
  // Active Data
  visiblePublications: number[];
  totalPublications: number;
  highlightedElements: {
    nodes?: string[];
    edges?: string[];
    sankeyPaths?: string[];
  };
  
  // User Interaction History
  recentActions: Array<{
    type: string;
    parameters: any;
    timestamp: string;
  }>;
  currentFocus: string;
  
  // Computed Metrics
  currentMetrics: {
    totalPublications: number;
    avgPolicyImpact: number;
    avgQualityScore: number;
    topAuthors: string[];
    emergingTrends: string[];
    publicationsByType: Record<string, number>;
    publicationsByUsage: Record<string, number>;
    yearRange: [number, number];
  };
  
  // Network specific
  networkMetrics?: NetworkMetrics;
  
  // Sankey specific
  sankeyMetrics?: {
    flowDistribution: any;
    bottlenecks: any[];
    strongPaths: any[];
  };
  
  // Trends specific
  trendMetrics?: {
    yearlyGrowth: number[];
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
    forecast?: any;
  };
  
  // Data quality
  dataQuality?: {
    completeness: number;
    accuracy: number;
  };
  
  // Cross-domain metrics
  crossDomainMetrics?: {
    collaborationRate: number;
    impactBonus: number;
  };
  
  // Generate insights flag
  generateInsights?: boolean;
}

interface ChatContextProviderProps {
  children: React.ReactNode;
  publications: Publication[];
  activeView: 'overview' | 'network' | 'sankey' | 'trends' | 'explore' | 'explorer' | 'domains' | 'methodology' | 'gaps';
  selectedFilters: any;
  onViewChange?: (view: 'overview' | 'network' | 'sankey' | 'trends' | 'explore' | 'explorer' | 'domains' | 'methodology' | 'gaps') => void;
  onFilterChange?: (filters: any) => void;
}

const ChatContext = createContext<DashboardContextType | null>(null);

export const useDashboardContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within ChatContextProvider');
  }
  return context;
};

export const ChatContextProvider: React.FC<ChatContextProviderProps> = ({
  children,
  publications,
  activeView,
  selectedFilters,
  onViewChange,
  onFilterChange
}) => {
  const [recentActions, setRecentActions] = useState<Array<any>>([]);
  const [currentFocus] = useState('general');
  const [highlightedElements] = useState({});
  
  // Track user actions
  const trackAction = useCallback((action: any) => {
    const newAction = {
      ...action,
      timestamp: new Date().toISOString()
    };
    
    setRecentActions(prev => [...prev.slice(-19), newAction]);
  }, []);
  
  // Calculate metrics
  const calculateMetrics = useCallback(() => {
    if (!publications || publications.length === 0) {
      return {
        totalPublications: 0,
        avgPolicyImpact: 0,
        avgQualityScore: 0,
        topAuthors: [],
        emergingTrends: [],
        publicationsByType: {},
        publicationsByUsage: {},
        yearRange: [2010, 2024] as [number, number]
      };
    }
    
    
    // Count by type
    const publicationsByType = publications.reduce((acc, pub) => {
      acc[pub.publication_type] = (acc[pub.publication_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count by usage
    const publicationsByUsage = publications.reduce((acc, pub) => {
      acc[pub.usage_type] = (acc[pub.usage_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Extract top authors
    const authorCounts: Record<string, number> = {};
    publications.forEach(pub => {
      const authors = pub.authors.split(';').map(a => a.trim()).filter(a => a);
      authors.forEach(author => {
        authorCounts[author] = (authorCounts[author] || 0) + 1;
      });
    });
    
    const topAuthors = Object.entries(authorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([author,]) => author);
    
    // Detect emerging trends (simplified)
    const recentPubs = publications.filter(pub => pub.year >= 2021);
    const domainCounts: Record<string, number> = {};
    recentPubs.forEach(pub => {
      domainCounts[pub.research_domain] = (domainCounts[pub.research_domain] || 0) + 1;
    });
    
    const emergingTrends = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([domain,]) => domain);
    
    // Year range
    const years = publications.map(pub => pub.year);
    const yearRange: [number, number] = [
      Math.min(...years, 2010),
      Math.max(...years, 2024)
    ];
    
    return {
      totalPublications: publications.length,
      avgPolicyImpact: 0,
      avgQualityScore: 0,
      topAuthors,
      emergingTrends,
      publicationsByType,
      publicationsByUsage,
      yearRange
    };
  }, [publications]);
  
  // Build context value
  const contextValue: DashboardContextType = {
    activeView,
    selectedFilters,
    visiblePublications: publications?.map((_, idx) => idx) || [],
    totalPublications: publications?.length || 0,
    highlightedElements,
    recentActions,
    currentFocus,
    currentMetrics: calculateMetrics(),
    generateInsights: true
  };
  
  // Update highlighted elements
  useEffect(() => {
    if (onViewChange) {
      // Add view change handler to window for dashboard integration
      (window as any).__ahrqChatbotViewChange = onViewChange;
    }
    
    if (onFilterChange) {
      // Add filter change handler to window for dashboard integration
      (window as any).__ahrqChatbotFilterChange = onFilterChange;
    }
    
    return () => {
      delete (window as any).__ahrqChatbotViewChange;
      delete (window as any).__ahrqChatbotFilterChange;
    };
  }, [onViewChange, onFilterChange]);
  
  // Track view changes
  useEffect(() => {
    if (activeView !== recentActions[recentActions.length - 1]?.parameters?.view) {
      trackAction({
        type: 'switchView',
        parameters: { view: activeView }
      });
    }
  }, [activeView, trackAction, recentActions]);
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};