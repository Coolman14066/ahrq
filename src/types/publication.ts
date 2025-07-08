// Publication interface definition for AHRQ Dashboard
export interface Publication {
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
  // Computed fields for analysis
  geographic_reach?: 'LOCAL' | 'STATE' | 'REGIONAL' | 'NATIONAL' | 'INTERNATIONAL';
  methodological_rigor?: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Additional types for advanced analytics
export interface AuthorCollaboration {
  author1: string;
  author2: string;
  collaborationCount: number;
  sharedDomains: string[];
  publications: Publication[];
}

export interface InstitutionData {
  name: string;
  publicationCount: number;
  collaborations: string[];
  primaryDomains: string[];
}

export interface ResearchTrend {
  year: number;
  domain: string;
  publicationCount: number;
}

export interface PolicyOutcome {
  description: string;
  relatedPublications: Publication[];
  timeToImplementation: number;
  geographicScope: string;
  effectivenessScore: number;
}

// Visualization-specific types
export interface NetworkNode {
  id: string;
  name: string;
  type: 'author' | 'institution' | 'domain';
  size: number;
  color?: string;
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  weight: number;
  type: 'collaboration' | 'citation' | 'domain_overlap';
}

export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: 'publication' | 'policy_change' | 'milestone';
  impact: number;
  relatedPublications: Publication[];
}

// Filter and search types
export interface FilterOptions {
  searchQuery: string;
  selectedDomain: string;
  selectedYear: string;
  selectedUsageType: string;
  selectedPubType: string;
  selectedGeographicReach: string;
}

export interface SearchResult {
  publication: Publication;
  relevanceScore: number;
  matchedFields: string[];
}