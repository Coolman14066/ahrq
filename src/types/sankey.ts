import { Publication } from './publication';

// Core Sankey data structures
export interface SankeyNode {
  id: string;
  name: string;
  category: SankeyNodeCategory;
  level: number; // 0-3 for the four flow levels
  depth?: number; // For d3-sankey compatibility
  value: number; // Total flow value through this node
  publications: Publication[];
  // Visual properties
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  // Metrics
  avgQualityScore: number;
  avgPolicyImpact: number;
  publicationCount: number;
  yearRange: [number, number];
  topAuthors: string[];
  recentTrend: 'growing' | 'stable' | 'declining';
}

export interface SankeyLink {
  id: string;
  source: string | SankeyNode;
  target: string | SankeyNode;
  value: number; // Flow weight/thickness
  publications: Publication[];
  // Visual properties
  width?: number;
  color?: string;
  opacity?: number;
  // Metrics
  avgQualityScore: number;
  avgPolicyImpact: number;
  strengthScore: number; // 0-1 scale based on publication quality and impact
  temporalPattern: { year: number; count: number; weight: number }[];
}

// Node categories for the four-level flow
export enum SankeyNodeCategory {
  PUBLICATION_TYPE = 'publication_type',
  USAGE_TYPE = 'usage_type', 
  RESEARCH_DOMAIN = 'research_domain',
  GEOGRAPHIC_FOCUS = 'geographic_focus'
}

// Geographic focus categories for flow analysis
export enum GeographicCategory {
  NATIONAL = 'USA',
  STATE = 'State-level',
  REGIONAL = 'Regional',
  LOCAL = 'Local',
  INTERNATIONAL = 'International'
}

// Complete Sankey flow data structure
export interface SankeyFlow {
  nodes: SankeyNode[];
  links: SankeyLink[];
  levels: {
    [SankeyNodeCategory.PUBLICATION_TYPE]: SankeyNode[];
    [SankeyNodeCategory.USAGE_TYPE]: SankeyNode[];
    [SankeyNodeCategory.RESEARCH_DOMAIN]: SankeyNode[];
    [SankeyNodeCategory.GEOGRAPHIC_FOCUS]: SankeyNode[];
  };
  metrics: SankeyFlowMetrics;
  totalPublications: number;
  totalFlowValue: number;
}

// Flow analysis metrics
export interface SankeyFlowMetrics {
  // Overall flow statistics
  totalNodes: number;
  totalLinks: number;
  maxFlowValue: number;
  avgFlowValue: number;
  flowDensity: number;
  
  // Level-specific metrics
  levelDistribution: {
    [key in SankeyNodeCategory]: {
      nodeCount: number;
      totalValue: number;
      avgValue: number;
      dominantNode: string;
    };
  };
  
  // Impact analysis
  highestImpactPath: {
    path: string[];
    totalValue: number;
    avgPolicyImpact: number;
  };
  
  // Temporal trends
  yearlyFlowTrends: {
    year: number;
    totalFlow: number;
    dominantPattern: string;
  }[];
  
  // Quality indicators
  qualityDistribution: {
    highQuality: number; // >75% quality score
    mediumQuality: number; // 50-75% quality score
    lowQuality: number; // <50% quality score
  };
  
  // Conversion rates between levels
  conversionRates: {
    publicationToUsage: number;
    usageToDomain: number;
    domainToGeographic: number;
  };
}

// Flow filtering and display options
export interface SankeyFilter {
  // Publication filters
  publicationTypes: string[];
  usageTypes: string[];
  researchDomains: string[];
  geographicCategories: GeographicCategory[];
  
  // Quality and impact thresholds
  minQualityScore: number;
  minPolicyImpact: number;
  minPublicationCount: number;
  
  // Temporal filters
  yearRange: [number, number];
  showRecentTrendsOnly: boolean;
  
  // Visual filters
  minFlowValue: number; // Hide small flows
  maxNodes: number; // Limit nodes for clarity
  showOnlyMajorFlows: boolean;
  
  // Focus options
  highlightedPath?: string[]; // Specific flow path to highlight
  selectedNode?: string; // Node to focus on
}

// Sankey component configuration
export interface SankeyConfig {
  // Layout configuration
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  
  // Node configuration
  nodeWidth: number;
  nodePadding: number;
  nodeMinHeight: number;
  
  // Link configuration
  linkOpacity: number;
  linkMinWidth: number;
  linkMaxWidth: number;
  
  // Color scheme
  colorScheme: {
    [SankeyNodeCategory.PUBLICATION_TYPE]: { [key: string]: string };
    [SankeyNodeCategory.USAGE_TYPE]: { [key: string]: string };
    [SankeyNodeCategory.RESEARCH_DOMAIN]: { [key: string]: string };
    [SankeyNodeCategory.GEOGRAPHIC_FOCUS]: { [key: string]: string };
  };
  
  // Animation settings
  transitionDuration: number;
  enableAnimations: boolean;
  
  // Interaction settings
  enableHover: boolean;
  enableClick: boolean;
  enableDragDrop: boolean;
}

// Sankey component props
export interface SankeyDiagramProps {
  publications: Publication[];
  flowType?: 'geographic' | 'temporal' | 'quality_focus' | 'policy_impact';
  filter?: Partial<SankeyFilter>;
  config?: Partial<SankeyConfig>;
  onNodeClick?: (node: SankeyNode) => void;
  onLinkClick?: (link: SankeyLink) => void;
  onFlowClick?: (flow: { nodes: SankeyNode[]; links: SankeyLink[] }) => void;
  height?: number;
  interactive?: boolean;
}

// Flow analysis results for insights
export interface FlowInsight {
  type: 'dominant_path' | 'emerging_trend' | 'quality_indicator' | 'impact_gap' | 'temporal_shift';
  title: string;
  description: string;
  significance: 'high' | 'medium' | 'low';
  relatedNodes: string[];
  relatedPublications: Publication[];
  actionableRecommendation?: string;
  confidence: number; // 0-1 scale
}

// Drill-down data for detailed exploration
export interface FlowDrillDown {
  selectedFlow: SankeyLink;
  contributingPublications: Publication[];
  relatedFlows: SankeyLink[];
  temporalBreakdown: {
    year: number;
    publications: Publication[];
    flowWeight: number;
  }[];
  qualityBreakdown: {
    highQuality: Publication[];
    mediumQuality: Publication[];
    lowQuality: Publication[];
  };
  impactAnalysis: {
    avgPolicyImpact: number;
    topImpactPublications: Publication[];
    policyOutcomes: string[];
  };
}

// Export/sharing data structure
export interface SankeyExportData {
  flowData: SankeyFlow;
  appliedFilter: SankeyFilter;
  insights: FlowInsight[];
  timestamp: string;
  metadata: {
    totalPublications: number;
    analysisDateRange: [number, number];
    primaryFlowPattern: string;
    keyFindings: string[];
  };
}

// Temporal flow analysis for timeline views
export interface TemporalFlow {
  year: number;
  flows: SankeyFlow;
  yearOverYearChange: {
    newNodes: string[];
    removedNodes: string[];
    strengthenedFlows: SankeyLink[];
    weakenedFlows: SankeyLink[];
  };
  dominantPatterns: {
    publicationType: string;
    usageType: string;
    researchDomain: string;
    geographicFocus: string;
  };
}

// Comparative flow analysis
export interface FlowComparison {
  baselineFlow: SankeyFlow;
  comparisonFlow: SankeyFlow;
  differences: {
    nodeChanges: {
      added: SankeyNode[];
      removed: SankeyNode[];
      modified: { node: SankeyNode; changeType: 'increased' | 'decreased'; magnitude: number }[];
    };
    linkChanges: {
      added: SankeyLink[];
      removed: SankeyLink[];
      modified: { link: SankeyLink; changeType: 'strengthened' | 'weakened'; magnitude: number }[];
    };
  };
  insights: FlowInsight[];
}

// Policy outcome tracking
export interface PolicyOutcome {
  category: GeographicCategory;
  specificOutcome: string;
  contributingPublications: Publication[];
  impactLevel: 'federal' | 'state' | 'local' | 'institutional';
  implementationStatus: 'proposed' | 'in_progress' | 'implemented' | 'evaluated';
  evidenceStrength: number; // 0-1 scale
  temporalLag: number; // Years from publication to policy outcome
}