import express from 'express';

export default function createDataRoutes(dataQueryEngine, insightsEngine) {
  const router = express.Router();
  
  console.log('[ROUTES] Creating data routes');

  // GET /api/data/query
  router.get('/query', async (req, res) => {
    console.log('[ROUTE] GET /api/data/query called');
    try {
      const { q, context } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: 'Query parameter q is required' });
      }
      
      const parsedContext = context ? JSON.parse(context) : {};
      const results = await dataQueryEngine.executeQuery(q, parsedContext);
      
      res.json(results);
    } catch (error) {
      console.error('[ROUTE ERROR] Data query error:', error);
      res.status(500).json({ 
        error: 'Failed to execute query',
        details: error.message 
      });
    }
  });

  // POST /api/data/query
  router.post('/query', async (req, res) => {
    console.log('[ROUTE] POST /api/data/query called');
    try {
      const { query, context } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await dataQueryEngine.executeQuery(query, context || {});
      
      res.json(results);
    } catch (error) {
      console.error('[ROUTE ERROR] Data query error:', error);
      res.status(500).json({ 
        error: 'Failed to execute query',
        details: error.message 
      });
    }
  });

  // GET /api/data/insights
  router.get('/insights', async (req, res) => {
    console.log('[ROUTE] GET /api/data/insights called');
    try {
      const { context } = req.query;
      const parsedContext = context ? JSON.parse(context) : {};
      
      const insights = await insightsEngine.generateContextualInsights(parsedContext);
      
      res.json({ insights });
    } catch (error) {
      console.error('[ROUTE ERROR] Insights generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate insights',
        details: error.message 
      });
    }
  });

  // GET /api/data/stats
  router.get('/stats', async (req, res) => {
    console.log('[ROUTE] GET /api/data/stats called');
    try {
      const data = dataQueryEngine.data || [];
      
      // Calculate general statistics
      const stats = {
        totalPublications: data.length,
        yearRange: data.length > 0 ? [
          Math.min(...data.map(p => p.year)),
          Math.max(...data.map(p => p.year))
        ] : [0, 0],
        avgPolicyImpact: data.reduce((sum, p) => sum + p.policy_impact_score, 0) / data.length || 0,
        avgQualityScore: data.reduce((sum, p) => sum + p.quality_score, 0) / data.length || 0,
        publicationTypes: {},
        usageTypes: {},
        topDomains: {},
        topAuthors: []
      };
      
      // Count by type
      data.forEach(pub => {
        stats.publicationTypes[pub.publication_type] = 
          (stats.publicationTypes[pub.publication_type] || 0) + 1;
        stats.usageTypes[pub.usage_type] = 
          (stats.usageTypes[pub.usage_type] || 0) + 1;
        stats.topDomains[pub.research_domain] = 
          (stats.topDomains[pub.research_domain] || 0) + 1;
      });
      
      // Get top domains
      stats.topDomains = Object.entries(stats.topDomains)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
      
      // Extract top authors
      const authorCounts = {};
      data.forEach(pub => {
        const authors = pub.authors.split(';').map(a => a.trim()).filter(a => a);
        authors.forEach(author => {
          authorCounts[author] = (authorCounts[author] || 0) + 1;
        });
      });
      
      stats.topAuthors = Object.entries(authorCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([author, count]) => ({ author, count }));
      
      res.json(stats);
    } catch (error) {
      console.error('[ROUTE ERROR] Stats calculation error:', error);
      res.status(500).json({ 
        error: 'Failed to calculate statistics',
        details: error.message 
      });
    }
  });

  // GET /api/data/schema
  router.get('/schema', async (req, res) => {
    console.log('[ROUTE] GET /api/data/schema called');
    try {
      // Return the data schema for client reference
      const schema = {
        publication: {
          fields: {
            id: { type: 'number', description: 'Unique identifier' },
            publication_type: { type: 'string', enum: ['GOVERNMENT', 'POLICY', 'OTHER'] },
            title: { type: 'string', description: 'Publication title' },
            authors: { type: 'string', description: 'Semi-colon separated authors' },
            year: { type: 'number', description: 'Publication year' },
            journal: { type: 'string', description: 'Journal or venue' },
            publisher: { type: 'string', description: 'Publisher' },
            usage_type: { type: 'string', enum: ['PRIMARY_ANALYSIS', 'RESEARCH_ENABLER', 'CONTEXTUAL_REFERENCE'] },
            usage_justification: { type: 'string', description: 'Usage justification' },
            usage_description: { type: 'string', description: 'Detailed usage description' },
            research_domain: { type: 'string', description: 'Research domain' },
            geographic_focus: { type: 'string', description: 'Geographic scope' },
            data_years_used: { type: 'string', description: 'Years of data used' },
            key_findings: { type: 'string', description: 'Key findings' },
            policy_implications: { type: 'string', description: 'Policy implications' },
            doi_url: { type: 'string', description: 'DOI or URL' },
            notes: { type: 'string', description: 'Additional notes' },
            quality_score: { type: 'number', description: 'Computed quality score (0-100)' },
            policy_impact_score: { type: 'number', description: 'Computed policy impact score (0-100)' }
          }
        }
      };
      
      res.json(schema);
    } catch (error) {
      console.error('[ROUTE ERROR] Schema retrieval error:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve schema',
        details: error.message 
      });
    }
  });

  // POST /api/data/explain
  router.post('/explain', async (req, res) => {
    console.log('[ROUTE] POST /api/data/explain called');
    try {
      const { visualizationType, element, context } = req.body;
      
      // Generate explanation based on visualization type
      let explanation = '';
      
      switch (visualizationType) {
        case 'network':
          explanation = `This network visualization shows author collaborations. 
          Node size represents publication count, color indicates policy impact score.
          Edge thickness shows collaboration strength.`;
          break;
          
        case 'sankey':
          explanation = `This Sankey diagram shows how publications flow from types 
          through usage patterns to policy impact categories. 
          Flow width represents the number of publications.`;
          break;
          
        case 'trends':
          explanation = `This trend analysis shows publication patterns over time.
          You can see volume trends, domain evolution, and quality metrics.`;
          break;
          
        default:
          explanation = 'This visualization helps analyze AHRQ research impact.';
      }
      
      if (element) {
        explanation += `\n\nYou're currently looking at: ${element}`;
      }
      
      res.json({ explanation, visualizationType, element });
    } catch (error) {
      console.error('[ROUTE ERROR] Explanation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate explanation',
        details: error.message 
      });
    }
  });

  console.log('[ROUTES] Data routes created successfully');
  return router;
}