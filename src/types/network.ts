import { Publication } from './publication';

// Core network data structures
export interface NetworkNode {
  id: string;
  name: string;
  type: 'author' | 'institution' | 'domain';
  size: number;
  color?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  // Metrics
  publicationCount: number;
  collaborationCount: number;
  yearRange: [number, number];
  // Additional properties
  institutions?: string[];
  domains?: string[];
  recentActivity: number; // Publications in last 3 years
  networkCentrality?: number;
}

export interface NetworkEdge {
  id: string;
  source: string | NetworkNode;
  target: string | NetworkNode;
  weight: number;
  type: 'collaboration' | 'citation' | 'domain_overlap' | 'institutional';
  // Temporal information
  firstCollaboration: number; // Year
  lastCollaboration: number; // Year
  collaborationYears: number[];
  // Strength metrics
  sharedPublications: number;
  totalInteractions: number;
}

// Author-specific collaboration data
export interface AuthorCollaboration {
  author1: string;
  author2: string;
  collaborationCount: number;
  sharedPublications: Publication[];
  sharedDomains: string[];
  sharedInstitutions: string[];
  collaborationStrength: number; // 0-1 scale
  temporalPattern: { year: number; count: number }[];
}

// Institution network data
export interface InstitutionNetwork {
  name: string;
  id: string;
  totalPublications: number;
  uniqueAuthors: string[];
  authorCount: number;
  collaboratorInstitutions: string[];
  primaryDomains: string[];
  networkCentrality: number;
  yearRange: [number, number];
  collaborationStrength: { [institutionId: string]: number };
}

// Research domain clustering
export interface DomainCluster {
  domain: string;
  id: string;
  authorCount: number;
  institutionCount: number;
  publicationCount: number;
  crossDomainCollaborations: string[];
  temporalTrend: 'growing' | 'stable' | 'declining';
  keyAuthors: string[];
  keyInstitutions: string[];
}

// Network analysis results
export interface NetworkMetrics {
  nodeCount: number;
  edgeCount: number;
  density: number; // edges / max_possible_edges
  avgDegree: number;
  maxDegree: number;
  clusteringCoefficient: number;
  componentCount: number;
  largestComponentSize: number;
  // Centrality measures
  topBetweennessCentrality: { nodeId: string; value: number }[];
  topDegreeCentrality: { nodeId: string; value: number }[];
  topEigenvectorCentrality: { nodeId: string; value: number }[];
}

// Community detection results
export interface CommunityDetection {
  communities: {
    id: string;
    nodes: string[];
    size: number;
    density: number;
    primaryDomain?: string;
    collaborationIntensity: number;
  }[];
  modularity: number;
  totalCommunities: number;
}

// Network filtering and display options
export interface NetworkFilter {
  nodeTypes: ('author' | 'institution' | 'domain')[];
  edgeTypes: ('collaboration' | 'citation' | 'domain_overlap' | 'institutional')[];
  minCollaborations: number;
  yearRange: [number, number];
  maxNodes: number;
  selectedDomains: string[];
  selectedInstitutions: string[];
  showOnlyLargestComponent: boolean;
}

// Network layout configuration
export interface NetworkLayout {
  width: number;
  height: number;
  forceStrength: {
    link: number;
    charge: number;
    collision: number;
    center: number;
  };
  nodeRadius: {
    min: number;
    max: number;
    scale: number;
  };
  edgeWidth: {
    min: number;
    max: number;
    scale: number;
  };
}

// Interactive network state
export interface NetworkState {
  selectedNode: NetworkNode | null;
  highlightedNodes: Set<string>;
  selectedCommunity: string | null;
  zoomLevel: number;
  center: { x: number; y: number };
  isSimulationRunning: boolean;
}

// Network component props
export interface NetworkGraphProps {
  publications: Publication[];
  networkType?: 'author' | 'institution' | 'domain' | 'mixed';
  selectedMetric?: 'collaborations' | 'citations';
  filter?: Partial<NetworkFilter>;
  layout?: Partial<NetworkLayout>;
  onNodeClick?: (node: NetworkNode) => void;
  onEdgeClick?: (edge: NetworkEdge) => void;
  onSelectionChange?: (selectedNodes: NetworkNode[]) => void;
  height?: number;
  interactive?: boolean;
}

// Temporal network analysis
export interface TemporalNetworkSlice {
  year: number;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metrics: NetworkMetrics;
  newNodes: string[]; // Nodes that appeared this year
  newEdges: string[]; // Edges that appeared this year
  departedNodes: string[]; // Nodes that disappeared this year
}

export interface TemporalNetworkData {
  timeSlices: TemporalNetworkSlice[];
  overallMetrics: {
    nodeGrowthRate: number;
    edgeGrowthRate: number;
    networkStability: number;
    emergingCommunities: string[];
    decliningCommunities: string[];
  };
}

// Search and exploration
export interface NetworkSearchResult {
  nodeId: string;
  nodeName: string;
  nodeType: 'author' | 'institution' | 'domain';
  relevanceScore: number;
  matchType: 'exact' | 'partial' | 'semantic';
  context: string;
  relatedNodes: string[];
}

// Export/sharing formats
export interface NetworkExportData {
  format: 'json' | 'graphml' | 'gexf' | 'csv';
  includeMetrics: boolean;
  includePositions: boolean;
  filterApplied: NetworkFilter;
  timestamp: string;
  metadata: {
    totalPublications: number;
    dateRange: [number, number];
    generatedBy: string;
  };
}