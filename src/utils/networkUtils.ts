import { Publication } from '../types/publication';
import { 
  NetworkNode, 
  NetworkEdge, 
  AuthorCollaboration, 
  InstitutionNetwork, 
  NetworkMetrics,
  NetworkFilter
} from '../types/network';
import { AuthorService } from '../services/authorService';

/**
 * Parse and normalize author names from publication author strings
 * Uses the centralized AuthorService for consistent parsing
 */
export const parseAuthors = (authorString: string): string[] => {
  const parsed = AuthorService.parseAuthors(authorString);
  return parsed.authors
    .filter(author => !author.isInstitution)
    .map(author => author.fullName);
};

/**
 * Extract author collaborations from publications
 */
export const extractAuthorCollaborations = (publications: Publication[]): AuthorCollaboration[] => {
  const collaborationMap = new Map<string, AuthorCollaboration>();
  
  publications.forEach(pub => {
    const authors = parseAuthors(pub.authors);
    
    // Create collaborations for each pair of authors
    for (let i = 0; i < authors.length; i++) {
      for (let j = i + 1; j < authors.length; j++) {
        const author1 = authors[i];
        const author2 = authors[j];
        
        // Create consistent key (alphabetical order)
        const key = author1 < author2 ? `${author1}|${author2}` : `${author2}|${author1}`;
        
        if (!collaborationMap.has(key)) {
          collaborationMap.set(key, {
            author1: author1 < author2 ? author1 : author2,
            author2: author1 < author2 ? author2 : author1,
            collaborationCount: 0,
            sharedPublications: [],
            sharedDomains: [],
            sharedInstitutions: [],
            collaborationStrength: 0,
            temporalPattern: []
          });
        }
        
        const collab = collaborationMap.get(key)!;
        collab.collaborationCount++;
        collab.sharedPublications.push(pub);
        
        // Add domain if not already present
        if (!collab.sharedDomains.includes(pub.research_domain)) {
          collab.sharedDomains.push(pub.research_domain);
        }
      }
    }
  });
  
  // Calculate collaboration strength and metrics
  collaborationMap.forEach((collab) => {
    // Temporal pattern analysis
    const yearCounts = new Map<number, number>();
    collab.sharedPublications.forEach(pub => {
      yearCounts.set(pub.year, (yearCounts.get(pub.year) || 0) + 1);
    });
    
    collab.temporalPattern = Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);
    
    // Collaboration strength based on frequency and recency
    const totalYears = collab.temporalPattern.length;
    const recentYears = collab.temporalPattern.filter(p => p.year >= 2020).length;
    const recencyBonus = recentYears / Math.max(totalYears, 1);
    
    collab.collaborationStrength = Math.min(
      (collab.collaborationCount / 10) * 0.7 + recencyBonus * 0.3, 
      1.0
    );
  });
  
  return Array.from(collaborationMap.values());
};

/**
 * Build author network nodes from publications
 */
export const buildAuthorNodes = (publications: Publication[]): NetworkNode[] => {
  const authorMap = new Map<string, {
    publications: Publication[];
    collaborators: Set<string>;
    domains: Set<string>;
    institutions: Set<string>;
  }>();
  
  // Collect author data
  publications.forEach(pub => {
    const authors = parseAuthors(pub.authors);
    
    authors.forEach(author => {
      if (!authorMap.has(author)) {
        authorMap.set(author, {
          publications: [],
          collaborators: new Set(),
          domains: new Set(),
          institutions: new Set()
        });
      }
      
      const authorData = authorMap.get(author)!;
      authorData.publications.push(pub);
      authorData.domains.add(pub.research_domain);
      
      // Add collaborators
      authors.forEach(otherAuthor => {
        if (otherAuthor !== author) {
          authorData.collaborators.add(otherAuthor);
        }
      });
    });
  });
  
  // Convert to network nodes
  return Array.from(authorMap.entries()).map(([author, data]) => {
    const years = data.publications.map(pub => pub.year);
    
    return {
      id: author,
      name: author,
      type: 'author' as const,
      size: data.publications.length,
      publicationCount: data.publications.length,
      collaborationCount: data.collaborators.size,
      yearRange: [Math.min(...years), Math.max(...years)] as [number, number],
      domains: Array.from(data.domains),
      recentActivity: data.publications.filter(pub => pub.year >= 2021).length
    };
  });
};

/**
 * Build collaboration edges from collaboration data
 */
export const buildCollaborationEdges = (collaborations: AuthorCollaboration[]): NetworkEdge[] => {
  return collaborations
    .filter(collab => collab.collaborationCount >= 1) // Minimum threshold
    .map(collab => ({
      id: `${collab.author1}|${collab.author2}`,
      source: collab.author1,
      target: collab.author2,
      weight: collab.collaborationStrength,
      type: 'collaboration' as const,
      firstCollaboration: Math.min(...collab.temporalPattern.map(p => p.year)),
      lastCollaboration: Math.max(...collab.temporalPattern.map(p => p.year)),
      collaborationYears: collab.temporalPattern.map(p => p.year),
      sharedPublications: collab.collaborationCount,
      totalInteractions: collab.collaborationCount
    }));
};

/**
 * Extract institution information from publications
 */
export const extractInstitutionData = (publications: Publication[]): InstitutionNetwork[] => {
  // This is a simplified implementation - in reality, you'd need to parse
  // institution information from author affiliations or a separate field
  const institutionMap = new Map<string, {
    publications: Publication[];
    authors: Set<string>;
    domains: Set<string>;
    collaborators: Set<string>;
  }>();
  
  // For this implementation, we'll extract from geographic focus as a proxy
  publications.forEach(pub => {
    const institution = extractInstitutionFromGeographic(pub.geographic_focus);
    if (institution) {
      if (!institutionMap.has(institution)) {
        institutionMap.set(institution, {
          publications: [],
          authors: new Set(),
          domains: new Set(),
          collaborators: new Set()
        });
      }
      
      const instData = institutionMap.get(institution)!;
      instData.publications.push(pub);
      instData.domains.add(pub.research_domain);
      
      const authors = parseAuthors(pub.authors);
      authors.forEach(author => instData.authors.add(author));
    }
  });
  
  return Array.from(institutionMap.entries()).map(([name, data]) => {
    const years = data.publications.map(pub => pub.year);
    
    return {
      name,
      id: name.replace(/\s+/g, '_').toLowerCase(),
      totalPublications: data.publications.length,
      uniqueAuthors: Array.from(data.authors),
      authorCount: data.authors.size,
      collaboratorInstitutions: Array.from(data.collaborators),
      primaryDomains: Array.from(data.domains),
      networkCentrality: 0, // To be calculated
      yearRange: [Math.min(...years), Math.max(...years)] as [number, number],
      collaborationStrength: {}
    };
  });
};

/**
 * Extract institution name from geographic focus (simplified)
 */
const extractInstitutionFromGeographic = (geographic: string): string | null => {
  // This is a simplified approach - you'd want more sophisticated parsing
  if (geographic.includes('University') || geographic.includes('College')) {
    return geographic.split(',')[0].trim();
  }
  if (geographic.includes('Health System') || geographic.includes('Medical Center')) {
    return geographic.split(',')[0].trim();
  }
  return null;
};

/**
 * Calculate basic network metrics
 */
export const calculateNetworkMetrics = (nodes: NetworkNode[], edges: NetworkEdge[]): NetworkMetrics => {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
  const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;
  
  // Calculate degree for each node
  const degreeMap = new Map<string, number>();
  nodes.forEach(node => degreeMap.set(node.id, 0));
  
  edges.forEach(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    
    degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
    degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
  });
  
  const degrees = Array.from(degreeMap.values());
  const avgDegree = degrees.reduce((sum, deg) => sum + deg, 0) / degrees.length || 0;
  const maxDegree = Math.max(...degrees, 0);
  
  // Simple clustering coefficient approximation
  const clusteringCoefficient = 0.3; // Placeholder - would need full implementation
  
  // Component analysis (simplified)
  const componentCount = 1; // Placeholder - would need graph traversal
  const largestComponentSize = nodeCount;
  
  // Top centrality nodes (simplified - just using degree)
  const topDegreeNodes = Array.from(degreeMap.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([nodeId, value]) => ({ nodeId, value }));
  
  return {
    nodeCount,
    edgeCount,
    density,
    avgDegree,
    maxDegree,
    clusteringCoefficient,
    componentCount,
    largestComponentSize,
    topBetweennessCentrality: topDegreeNodes, // Placeholder
    topDegreeCentrality: topDegreeNodes,
    topEigenvectorCentrality: topDegreeNodes // Placeholder
  };
};

/**
 * Filter network based on criteria
 */
export const filterNetwork = (
  nodes: NetworkNode[], 
  edges: NetworkEdge[], 
  filter: NetworkFilter
): { nodes: NetworkNode[]; edges: NetworkEdge[] } => {
  // Filter nodes
  let filteredNodes = nodes.filter(node => {
    if (!filter.nodeTypes.includes(node.type)) return false;
    if (node.yearRange[1] < filter.yearRange[0] || node.yearRange[0] > filter.yearRange[1]) return false;
    if (filter.selectedDomains.length > 0 && node.domains) {
      if (!node.domains.some(domain => filter.selectedDomains.includes(domain))) return false;
    }
    return true;
  });
  
  // Limit nodes if specified
  if (filter.maxNodes > 0 && filteredNodes.length > filter.maxNodes) {
    filteredNodes = filteredNodes
      .sort((a, b) => b.size - a.size) // Sort by size (publication count)
      .slice(0, filter.maxNodes);
  }
  
  const nodeIds = new Set(filteredNodes.map(node => node.id));
  
  // Filter edges
  const filteredEdges = edges.filter(edge => {
    if (!filter.edgeTypes.includes(edge.type)) return false;
    if (edge.sharedPublications < filter.minCollaborations) return false;
    
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    
    return nodeIds.has(sourceId) && nodeIds.has(targetId);
  });
  
  return { nodes: filteredNodes, edges: filteredEdges };
};

/**
 * Build complete author collaboration network
 */
export const buildAuthorNetwork = (publications: Publication[], filter?: Partial<NetworkFilter>) => {
  const collaborations = extractAuthorCollaborations(publications);
  const nodes = buildAuthorNodes(publications);
  const edges = buildCollaborationEdges(collaborations);
  
  const defaultFilter: NetworkFilter = {
    nodeTypes: ['author'],
    edgeTypes: ['collaboration'],
    minCollaborations: 1,
    yearRange: [2010, 2024],
    maxNodes: 100,
    selectedDomains: [],
    selectedInstitutions: [],
    showOnlyLargestComponent: false
  };
  
  const appliedFilter = { ...defaultFilter, ...filter };
  const { nodes: filteredNodes, edges: filteredEdges } = filterNetwork(nodes, edges, appliedFilter);
  
  const metrics = calculateNetworkMetrics(filteredNodes, filteredEdges);
  
  return {
    nodes: filteredNodes,
    edges: filteredEdges,
    metrics,
    collaborations,
    filter: appliedFilter
  };
};

/**
 * Generate network layout positions using a simple algorithm
 */
export const generateNetworkLayout = (
  nodes: NetworkNode[], 
  _edges: NetworkEdge[], 
  width: number, 
  height: number
): NetworkNode[] => {
  // Simple circular layout as starting positions
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3;
  
  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
};