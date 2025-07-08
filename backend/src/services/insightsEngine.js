export class InsightsEngine {
  constructor() {
    this.insightTemplates = this.loadInsightTemplates();
  }
  
  loadInsightTemplates() {
    return {
      trends: {
        increasing: "📈 {metric} has increased by {percentage}% from {startYear} to {endYear}",
        decreasing: "📉 {metric} has decreased by {percentage}% from {startYear} to {endYear}",
        stable: "➡️ {metric} has remained stable around {average} from {startYear} to {endYear}",
        spike: "🚀 Notable spike in {metric} during {year} with {value}",
        cyclical: "🔄 {metric} shows cyclical patterns with peaks every {cycle} years"
      },
      
      network: {
        highCollaborator: "🤝 {author} is a key collaborator with {count} unique partnerships",
        clusterDetected: "🔗 Identified a research cluster of {size} authors in {domain}",
        bridgeNode: "🌉 {author} connects {count} otherwise separate research groups",
        emergingCollaboration: "✨ New collaboration trend between {domain1} and {domain2} researchers",
        isolatedResearcher: "🏝️ {count} authors have no collaborations in the network"
      },
      
      policy: {
        highImpact: "⭐ {count} publications show exceptional policy impact (score > {threshold})",
        impactByType: "📊 {type} publications have {percentage}% higher policy impact on average",
        emergingPolicy: "🆕 Emerging policy focus on {topic} with {count} recent publications",
        policyGap: "🔍 Limited policy research in {domain} despite high publication volume",
        crossDomain: "🔀 {percentage}% of high-impact work spans multiple research domains"
      },
      
      quality: {
        improvingQuality: "📈 Publication quality scores have improved {percentage}% over time",
        qualityByDomain: "🏆 {domain} shows the highest average quality score of {score}",
        completenessIssue: "⚠️ {percentage}% of publications lack complete policy implications data",
        exemplaryWork: "🌟 {count} publications achieve perfect quality scores",
        qualityCorrelation: "🔗 Strong correlation between quality scores and policy impact"
      },
      
      usage: {
        primaryAnalysis: "🎯 {percentage}% of publications use AHRQ data for primary analysis",
        usageShift: "🔄 Shift from {oldType} to {newType} usage patterns since {year}",
        domainSpecific: "🏥 {domain} relies heavily on {usageType} approaches",
        methodologyTrend: "📐 Increasing use of AHRQ methodology frameworks (+{percentage}%)",
        dataYearPattern: "📅 Most studies use AHRQ data from {popularYears}"
      }
    };
  }
  
  async generateContextualInsights(context) {
    const insights = [];
    
    // Generate view-specific insights
    switch (context.activeView) {
      case 'overview':
        insights.push(...await this.generateOverviewInsights(context));
        break;
      case 'network':
        insights.push(...await this.generateNetworkInsights(context));
        break;
      case 'sankey':
        insights.push(...await this.generateFlowInsights(context));
        break;
      case 'trends':
        insights.push(...await this.generateTrendInsights(context));
        break;
    }
    
    // Add general insights based on current data
    insights.push(...await this.generateDataInsights(context));
    
    // Prioritize insights
    return this.prioritizeInsights(insights, context);
  }
  
  async generateOverviewInsights(context) {
    const insights = [];
    const metrics = context.currentMetrics;
    
    // High-level summary insight
    if (metrics.totalPublications > 100) {
      insights.push({
        type: 'summary',
        priority: 'high',
        message: `Analyzing ${metrics.totalPublications} AHRQ-related publications reveals diverse research applications`,
        category: 'overview',
        actionable: false
      });
    }
    
    // Policy impact insight
    if (metrics.avgPolicyImpact > 60) {
      insights.push({
        type: 'policy',
        priority: 'high',
        message: this.fillTemplate('policy.highImpact', {
          count: Math.floor(metrics.totalPublications * 0.3),
          threshold: 70
        }),
        category: 'policy',
        actionable: true,
        action: { type: 'filter', parameters: { minPolicyImpact: 70 } }
      });
    }
    
    // Top authors insight
    if (metrics.topAuthors && metrics.topAuthors.length > 0) {
      insights.push({
        type: 'network',
        priority: 'medium',
        message: `Top contributors include ${metrics.topAuthors.slice(0, 3).join(', ')}`,
        category: 'authors',
        actionable: true,
        action: { type: 'switchView', parameters: { view: 'network' } }
      });
    }
    
    return insights;
  }
  
  async generateNetworkInsights(context) {
    const insights = [];
    
    // Collaboration density
    if (context.networkMetrics) {
      const { density, avgDegree, largestComponentSize, nodeCount } = context.networkMetrics;
      
      if (density > 0.1) {
        insights.push({
          type: 'network',
          priority: 'high',
          message: `High collaboration density (${(density * 100).toFixed(1)}%) indicates a well-connected research community`,
          category: 'collaboration'
        });
      }
      
      if (avgDegree > 5) {
        insights.push({
          type: 'network',
          priority: 'medium',
          message: this.fillTemplate('network.highCollaborator', {
            author: context.networkMetrics.topDegreeCentrality[0]?.nodeId || 'Top author',
            count: Math.floor(avgDegree * 2)
          }),
          category: 'collaboration'
        });
      }
      
      // Component analysis
      const componentRatio = largestComponentSize / nodeCount;
      if (componentRatio < 0.8) {
        insights.push({
          type: 'network',
          priority: 'medium',
          message: this.fillTemplate('network.isolatedResearcher', {
            count: Math.floor(nodeCount * (1 - componentRatio))
          }),
          category: 'collaboration',
          actionable: true,
          action: { type: 'highlight', parameters: { isolated: true } }
        });
      }
    }
    
    // Highlighted elements insights
    if (context.highlightedElements?.nodes?.length > 0) {
      insights.push({
        type: 'focus',
        priority: 'high',
        message: `Focusing on ${context.highlightedElements.nodes.length} selected researchers`,
        category: 'interaction'
      });
    }
    
    return insights;
  }
  
  async generateFlowInsights(context) {
    const insights = [];
    
    if (context.sankeyMetrics) {
      const { flowDistribution, bottlenecks, strongPaths } = context.sankeyMetrics;
      
      // Flow concentration
      if (flowDistribution) {
        const topPath = strongPaths?.[0];
        if (topPath && topPath.percentage > 20) {
          insights.push({
            type: 'flow',
            priority: 'high',
            message: `Major research pathway: ${topPath.path} (${topPath.percentage.toFixed(1)}% of publications)`,
            category: 'flow',
            actionable: true,
            action: { type: 'highlightPath', parameters: { path: topPath.path } }
          });
        }
      }
      
      // Bottleneck detection
      if (bottlenecks && bottlenecks.length > 0) {
        insights.push({
          type: 'flow',
          priority: 'medium',
          message: `Research bottleneck at ${bottlenecks[0].node}: ${bottlenecks[0].reason}`,
          category: 'flow'
        });
      }
      
      // Policy impact distribution
      const policyCategories = context.currentMetrics?.policyImpactDistribution;
      if (policyCategories) {
        const topCategory = Object.entries(policyCategories)
          .sort(([,a], [,b]) => b - a)[0];
        if (topCategory) {
          insights.push({
            type: 'policy',
            priority: 'medium',
            message: this.fillTemplate('policy.emergingPolicy', {
              topic: topCategory[0],
              count: topCategory[1]
            }),
            category: 'policy'
          });
        }
      }
    }
    
    return insights;
  }
  
  async generateTrendInsights(context) {
    const insights = [];
    
    if (context.trendMetrics) {
      const { yearlyGrowth, trendDirection, volatility, forecast } = context.trendMetrics;
      
      // Growth trends
      if (yearlyGrowth) {
        const recentGrowth = yearlyGrowth.slice(-3);
        const avgGrowth = recentGrowth.reduce((a, b) => a + b, 0) / recentGrowth.length;
        
        if (avgGrowth > 10) {
          insights.push({
            type: 'trend',
            priority: 'high',
            message: this.fillTemplate('trends.increasing', {
              metric: 'Publication volume',
              percentage: avgGrowth.toFixed(1),
              startYear: context.selectedFilters.years[0],
              endYear: context.selectedFilters.years[1]
            }),
            category: 'trends'
          });
        }
      }
      
      // Trend patterns
      if (trendDirection) {
        if (volatility > 0.3) {
          insights.push({
            type: 'trend',
            priority: 'medium',
            message: 'High variability in publication patterns suggests evolving research priorities',
            category: 'trends'
          });
        }
      }
      
      // Domain evolution
      const domainTrends = context.currentMetrics?.domainEvolution;
      if (domainTrends) {
        const emergingDomains = domainTrends.filter(d => d.growth > 50);
        if (emergingDomains.length > 0) {
          insights.push({
            type: 'trend',
            priority: 'high',
            message: `Emerging research areas: ${emergingDomains.map(d => d.name).join(', ')}`,
            category: 'domains',
            actionable: true,
            action: { 
              type: 'filter', 
              parameters: { domains: emergingDomains.map(d => d.name) } 
            }
          });
        }
      }
    }
    
    return insights;
  }
  
  async generateDataInsights(context) {
    const insights = [];
    
    // Filter-based insights
    if (context.selectedFilters) {
      const activeFilters = Object.entries(context.selectedFilters)
        .filter(([,v]) => Array.isArray(v) ? v.length > 0 : v)
        .length;
      
      if (activeFilters > 2) {
        insights.push({
          type: 'filter',
          priority: 'low',
          message: `Viewing a focused subset with ${activeFilters} active filters`,
          category: 'interaction'
        });
      }
    }
    
    // Data quality insights
    if (context.dataQuality) {
      const { completeness, accuracy } = context.dataQuality;
      
      if (completeness < 0.8) {
        insights.push({
          type: 'quality',
          priority: 'medium',
          message: this.fillTemplate('quality.completenessIssue', {
            percentage: ((1 - completeness) * 100).toFixed(1)
          }),
          category: 'quality'
        });
      }
    }
    
    // Cross-domain insights
    if (context.crossDomainMetrics) {
      const { collaborationRate, impactBonus } = context.crossDomainMetrics;
      
      if (collaborationRate > 0.3) {
        insights.push({
          type: 'collaboration',
          priority: 'medium',
          message: this.fillTemplate('policy.crossDomain', {
            percentage: (collaborationRate * 100).toFixed(1)
          }),
          category: 'collaboration'
        });
      }
    }
    
    return insights;
  }
  
  fillTemplate(templatePath, values) {
    const parts = templatePath.split('.');
    let template = this.insightTemplates;
    
    for (const part of parts) {
      template = template[part];
      if (!template) return templatePath; // Fallback to path if template not found
    }
    
    let message = template;
    for (const [key, value] of Object.entries(values)) {
      message = message.replace(`{${key}}`, value);
    }
    
    return message;
  }
  
  prioritizeInsights(insights, context) {
    // Score insights based on relevance
    const scored = insights.map(insight => ({
      ...insight,
      score: this.calculateInsightScore(insight, context)
    }));
    
    // Sort by score and priority
    scored.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.score - a.score;
    });
    
    // Return top insights
    return scored.slice(0, 5);
  }
  
  calculateInsightScore(insight, context) {
    let score = 0;
    
    // Relevance to current view
    if (insight.category === context.activeView) score += 20;
    
    // Actionable insights score higher
    if (insight.actionable) score += 15;
    
    // Recent data scores higher
    if (insight.temporal === 'recent') score += 10;
    
    // Relevance to user behavior
    const userInterest = context.userBehavior?.primaryInterest;
    if (userInterest && insight.category.includes(userInterest)) score += 15;
    
    // Novel insights (not shown recently)
    if (!context.shownInsights?.includes(insight.message)) score += 10;
    
    return score;
  }
}