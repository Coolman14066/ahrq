// Debug utilities for tracking data flow issues

export const debugLog = (location: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.group(`[${timestamp}] DEBUG: ${location}`);
  console.log(message);
  if (data !== undefined) {
    console.log('Data:', data);
  }
  console.groupEnd();
};

export const validatePublications = (publications: any[], location: string) => {
  debugLog(location, 'Validating publications array', {
    isArray: Array.isArray(publications),
    length: publications?.length || 0,
    firstItem: publications?.[0],
    hasRequiredFields: publications?.length > 0 ? {
      publication_type: !!publications[0].publication_type,
      usage_type: !!publications[0].usage_type,
      research_domain: !!publications[0].research_domain,
      policy_implications: !!publications[0].policy_implications
    } : 'No items to check'
  });
  
  return publications;
};

export const validateSankeyData = (nodes: any[], links: any[], location: string) => {
  debugLog(location, 'Validating Sankey data', {
    nodes: {
      count: nodes?.length || 0,
      sample: nodes?.slice(0, 3),
      hasIds: nodes?.every(n => n.id !== undefined)
    },
    links: {
      count: links?.length || 0,
      sample: links?.slice(0, 3),
      hasSourceTarget: links?.every(l => l.source !== undefined && l.target !== undefined),
      undefinedLinks: links?.filter(l => !l || l.source === undefined || l.target === undefined)
    }
  });
  
  return { nodes, links };
};