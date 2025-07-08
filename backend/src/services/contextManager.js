export class ContextManager {
  constructor() {
    this.contexts = new Map();
  }
  
  updateContext(sessionId, newContext) {
    const existingContext = this.contexts.get(sessionId) || {};
    
    // Merge new context with existing
    const mergedContext = {
      ...existingContext,
      ...newContext,
      timestamp: new Date().toISOString(),
      sessionId
    };
    
    // Track context changes for insights
    if (existingContext.activeView && existingContext.activeView !== newContext.activeView) {
      mergedContext.viewTransition = {
        from: existingContext.activeView,
        to: newContext.activeView,
        timestamp: new Date().toISOString()
      };
    }
    
    this.contexts.set(sessionId, mergedContext);
    return mergedContext;
  }
  
  getContext(sessionId) {
    return this.contexts.get(sessionId) || this.getDefaultContext();
  }
  
  getDefaultContext() {
    return {
      activeView: 'overview',
      selectedFilters: {
        years: [2010, 2024],
        publicationTypes: [],
        usageTypes: [],
        domains: [],
        authors: []
      },
      visiblePublications: [],
      highlightedElements: {
        nodes: [],
        edges: [],
        sankeyPaths: []
      },
      recentActions: [],
      currentFocus: 'general',
      currentMetrics: {
        totalPublications: 0,
        avgPolicyImpact: 0,
        topAuthors: [],
        emergingTrends: []
      }
    };
  }
  
  trackAction(sessionId, action) {
    const context = this.getContext(sessionId);
    
    if (!context.recentActions) {
      context.recentActions = [];
    }
    
    context.recentActions.push({
      type: action.type,
      parameters: action.parameters,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 20 actions
    if (context.recentActions.length > 20) {
      context.recentActions = context.recentActions.slice(-20);
    }
    
    this.contexts.set(sessionId, context);
  }
  
  analyzeUserBehavior(sessionId) {
    const context = this.getContext(sessionId);
    const actions = context.recentActions || [];
    
    const analysis = {
      primaryInterest: this.detectPrimaryInterest(actions, context),
      explorationPattern: this.detectExplorationPattern(actions),
      focusAreas: this.detectFocusAreas(context),
      suggestedNextSteps: []
    };
    
    // Generate suggestions based on behavior
    if (analysis.primaryInterest === 'authors') {
      analysis.suggestedNextSteps.push(
        'Explore the collaboration network view',
        'Search for specific author publications',
        'Analyze collaboration patterns over time'
      );
    } else if (analysis.primaryInterest === 'policy') {
      analysis.suggestedNextSteps.push(
        'View the policy impact flow in Sankey diagram',
        'Filter for high-impact publications',
        'Analyze policy trends over time'
      );
    }
    
    return analysis;
  }
  
  detectPrimaryInterest(actions, context) {
    const interests = {
      authors: 0,
      policy: 0,
      trends: 0,
      domains: 0
    };
    
    // Analyze actions
    actions.forEach(action => {
      if (action.type.includes('author') || action.type.includes('network')) {
        interests.authors++;
      }
      if (action.type.includes('policy') || action.type.includes('impact')) {
        interests.policy++;
      }
      if (action.type.includes('trend') || action.type.includes('time')) {
        interests.trends++;
      }
      if (action.type.includes('domain') || action.type.includes('field')) {
        interests.domains++;
      }
    });
    
    // Weight by current view
    if (context.activeView === 'network') interests.authors += 2;
    if (context.activeView === 'sankey') interests.policy += 2;
    if (context.activeView === 'trends') interests.trends += 2;
    
    // Find primary interest
    return Object.entries(interests)
      .sort(([,a], [,b]) => b - a)[0][0];
  }
  
  detectExplorationPattern(actions) {
    if (actions.length < 3) return 'initial';
    
    const viewChanges = actions.filter(a => a.type === 'switchView').length;
    const filters = actions.filter(a => a.type.includes('filter')).length;
    const searches = actions.filter(a => a.type.includes('search')).length;
    
    if (viewChanges > actions.length * 0.4) return 'exploratory';
    if (filters > actions.length * 0.4) return 'focused';
    if (searches > actions.length * 0.3) return 'investigative';
    
    return 'balanced';
  }
  
  detectFocusAreas(context) {
    const areas = [];
    
    if (context.selectedFilters.domains.length > 0) {
      areas.push({
        type: 'domains',
        values: context.selectedFilters.domains
      });
    }
    
    if (context.selectedFilters.authors.length > 0) {
      areas.push({
        type: 'authors',
        values: context.selectedFilters.authors
      });
    }
    
    if (context.highlightedElements.nodes.length > 0) {
      areas.push({
        type: 'network_elements',
        count: context.highlightedElements.nodes.length
      });
    }
    
    return areas;
  }
  
  getContextSummary(sessionId) {
    const context = this.getContext(sessionId);
    const behavior = this.analyzeUserBehavior(sessionId);
    
    return {
      currentState: {
        view: context.activeView,
        filtersApplied: Object.entries(context.selectedFilters)
          .filter(([,v]) => Array.isArray(v) ? v.length > 0 : v)
          .map(([k,]) => k),
        publicationCount: context.visiblePublications.length,
        focusArea: context.currentFocus
      },
      userBehavior: behavior,
      metrics: context.currentMetrics,
      lastUpdate: context.timestamp
    };
  }
  
  clearContext(sessionId) {
    this.contexts.delete(sessionId);
  }
}