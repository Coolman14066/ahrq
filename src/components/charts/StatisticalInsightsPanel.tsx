import React from 'react';
import { Brain, TrendingUp, Award, AlertCircle, Users, FileText, Zap } from 'lucide-react';
import { Publication } from '../../types/publication';

interface InsightData {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'stable';
  category: 'impact' | 'growth' | 'quality' | 'collaboration';
  icon?: React.ReactNode;
}

interface StatisticalInsightsPanelProps {
  publications: Publication[];
  className?: string;
}

export const StatisticalInsightsPanel: React.FC<StatisticalInsightsPanelProps> = ({ 
  publications, 
  className = '' 
}) => {
  // Calculate key insights
  const insights = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const recentPubs = publications.filter(p => p.year >= currentYear - 2);
    
    // Calculate growth rate using complete years only
    const yearCounts: { [year: number]: number } = {};
    publications.forEach(pub => {
      yearCounts[pub.year] = (yearCounts[pub.year] || 0) + 1;
    });
    
    // Calculate compound annual growth rate (CAGR) over last 3 years for more stable metric
    const currentYearCount = yearCounts[currentYear] || 0;
    const threeYearsAgo = currentYear - 3;
    const threeYearsAgoCount = yearCounts[threeYearsAgo] || 0;
    
    let recentGrowth = 0;
    if (threeYearsAgoCount > 0) {
      // CAGR formula: ((Ending Value / Beginning Value)^(1/Years)) - 1
      const growthRatio = yearCounts[currentYear - 1] / threeYearsAgoCount;
      recentGrowth = (Math.pow(growthRatio, 1/3) - 1) * 100;
    } else {
      // If no publications 3 years ago, check year-over-year
      const lastYear = currentYear - 1;
      const twoYearsAgo = currentYear - 2;
      if (yearCounts[twoYearsAgo] > 0) {
        recentGrowth = ((yearCounts[lastYear] - yearCounts[twoYearsAgo]) / yearCounts[twoYearsAgo]) * 100;
      }
    }

    // Count primary analysis
    const primaryAnalysisCount = publications.filter(p => p.usage_type === 'PRIMARY_ANALYSIS').length;
    const primaryAnalysisPercentage = Math.round((primaryAnalysisCount / publications.length) * 100);

    // Policy impact calculation removed - no longer needed

    // Domain diversity
    const uniqueDomains = new Set(publications.map(p => p.research_domain)).size;
    const domainCounts: { [domain: string]: number } = {};
    publications.forEach(pub => {
      const domain = pub.research_domain || 'Unknown';
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    });
    const topDomain = Object.entries(domainCounts)
      .sort(([,a], [,b]) => b - a)[0];

    // Multi-institutional collaborations - count publications with multiple authors
    const multiAuthorPubs = publications.filter(pub => {
      if (!pub.authors) return false;
      // Check for multiple authors indicated by semicolons or "and"
      const hasMultipleAuthors = pub.authors.includes(';') || 
                                 pub.authors.includes(' and ') ||
                                 pub.authors.includes('[+ others]') ||
                                 pub.authors.split(',').length > 2; // More than 2 commas likely means multiple authors
      return hasMultipleAuthors;
    }).length;

    // Recent surge domains
    const recentDomainCounts: { [domain: string]: number } = {};
    recentPubs.forEach(pub => {
      const domain = pub.research_domain || 'Unknown';
      recentDomainCounts[domain] = (recentDomainCounts[domain] || 0) + 1;
    });
    const surgingDomain = Object.entries(recentDomainCounts)
      .sort(([,a], [,b]) => b - a)[0];

    const insightsList: InsightData[] = [
      {
        title: 'Research Growth Rate',
        value: recentGrowth !== 0 ? `${recentGrowth > 0 ? '+' : ''}${recentGrowth.toFixed(1)}%` : 'Stable',
        description: recentGrowth !== 0 ? `3-year compound annual growth rate` : `Consistent publication volume`,
        trend: recentGrowth > 5 ? 'up' : recentGrowth < -5 ? 'down' : 'stable',
        category: 'growth',
        icon: <TrendingUp className="h-5 w-5" />
      },
      {
        title: 'Primary Analysis Focus',
        value: `${primaryAnalysisPercentage}%`,
        description: `${primaryAnalysisCount} ${primaryAnalysisCount === 1 ? 'publication' : 'publications'} directly analyze AHRQ data`,
        trend: primaryAnalysisPercentage > 30 ? 'up' : 'stable',
        category: 'impact',
        icon: <Brain className="h-5 w-5" />
      },
      {
        title: 'Research Diversity',
        value: uniqueDomains,
        description: `${uniqueDomains === 1 ? 'Research domain' : 'Different research domains'} represented`,
        trend: uniqueDomains > 10 ? 'up' : 'stable',
        category: 'quality',
        icon: <FileText className="h-5 w-5" />
      },
      {
        title: 'Leading Domain',
        value: topDomain?.[0] || 'Unknown',
        description: `${topDomain?.[1] || 0} publications (${Math.round((topDomain?.[1] / publications.length) * 100)}%)`,
        trend: 'stable',
        category: 'impact',
        icon: <Award className="h-5 w-5" />
      },
      {
        title: 'Collaborative Research',
        value: `${Math.round((multiAuthorPubs / publications.length) * 100)}%`,
        description: `${multiAuthorPubs} multi-institutional publications`,
        trend: multiAuthorPubs > publications.length * 0.4 ? 'up' : 'stable',
        category: 'collaboration',
        icon: <Users className="h-5 w-5" />
      },
      {
        title: 'Emerging Focus Area',
        value: surgingDomain?.[0] || 'Unknown',
        description: `${surgingDomain?.[1] || 0} recent publications`,
        trend: 'up',
        category: 'growth',
        icon: <Zap className="h-5 w-5" />
      },
      {
        title: 'Recent Activity',
        value: `${Math.round((recentPubs.length / publications.length) * 100)}%`,
        description: `${recentPubs.length} publications in last 2 years`,
        trend: recentPubs.length > publications.length * 0.3 ? 'up' : 'stable',
        category: 'growth',
        icon: <AlertCircle className="h-5 w-5" />
      }
    ];

    return insightsList;
  }, [publications]);

  // Standardized color scheme
  const standardStyles = {
    bg: 'bg-gray-50',
    icon: 'text-blue-600',
    title: 'text-gray-900',
    value: 'text-gray-900',
    desc: 'text-gray-700'
  };

  const getTrendIcon = (trend?: InsightData['trend']) => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Brain className="mr-2" size={20} />
        Statistical Insights & Key Findings
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, index) => {
          const styles = standardStyles;
          
          return (
            <div 
              key={index} 
              className={`${styles.bg} rounded-lg p-6 transition-colors`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={styles.icon}>
                  {insight.icon}
                </div>
                {insight.trend && (
                  <span className={`text-sm font-bold ${
                    insight.trend === 'up' ? 'text-green-600' : 
                    insight.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {getTrendIcon(insight.trend)}
                  </span>
                )}
              </div>
              
              <h4 className={`text-base font-medium ${styles.title} mb-1`}>
                {insight.title}
              </h4>
              
              <p className={`text-3xl font-bold ${styles.value} mb-1`}>
                {insight.value}
              </p>
              
              <p className={`text-sm ${styles.desc}`}>
                {insight.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary section */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Takeaways</h4>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>• AHRQ Compendium research shows {insights[0].value} growth in publication volume</li>
          <li>• {insights[1].value} of publications perform primary analysis of AHRQ data</li>
          <li>• Research spans {insights[2].value} domains with {insights[3].description}</li>
          <li>• {insights[4].value} of research involves multi-institutional collaboration</li>
        </ul>
      </div>
    </div>
  );
};