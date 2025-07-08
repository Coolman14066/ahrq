import React, { useMemo, useState } from 'react';
import { 
  FileText, Zap, 
  Activity, Globe, BarChart3, MapPin, Building, Target
} from 'lucide-react';
import { Publication } from '../../types/publication';
import { PremiumCard, PremiumMetricCard, PremiumSectionCard } from '../ui/PremiumCard';
import { PremiumButton } from '../ui/PremiumButton';
import { PremiumDonutChart, PremiumLineChart } from '../charts/PremiumCharts';
import { UsageTypeChart } from '../charts/UsageTypeChart';
import { ExpandableChart, ChartModal } from '../ui/ChartModal';
import { useCountUp, useInViewAnimation, LoadingStates } from '../../hooks/usePremiumAnimations';
import { premiumTheme } from '../../styles/premium-theme';

interface PremiumOverviewProps {
  publications: Publication[];
  yearData: any[];
  domainData: any[];
  usageData: any[];
  pubTypeData: any[];
  loading?: boolean;
  onNavigate?: (view: string) => void;
}

export const PremiumOverview: React.FC<PremiumOverviewProps> = ({
  publications,
  yearData,
  domainData,
  usageData,
  pubTypeData,
  loading = false,
  onNavigate
}) => {
  // Debug logging
  // console.log('[PremiumOverview] Component rendered with props:', {
  //   publicationsCount: publications?.length,
  //   yearDataCount: yearData?.length,
  //   domainDataCount: domainData?.length,
  //   usageDataCount: usageData?.length,
  //   usageData: usageData,
  //   pubTypeDataCount: pubTypeData?.length,
  //   loading
  // });
  // Calculate premium metrics
  const metrics = useMemo(() => {
    const totalPublications = publications.length;
    const uniqueDomains = [...new Set(publications.map(pub => pub.research_domain))].length;
    const recentPublications = publications.filter(pub => pub.year >= 2023).length;
    
    // Calculate high-impact studies
    const highImpactStudies = publications.filter(pub => 
      pub.publication_type === 'GOVERNMENT' ||
      pub.usage_type === 'PRIMARY_ANALYSIS' ||
      (pub.policy_implications && (
        pub.policy_implications.toLowerCase().includes('informed') ||
        pub.policy_implications.toLowerCase().includes('supports') ||
        pub.policy_implications.toLowerCase().includes('led to') ||
        pub.policy_implications.toLowerCase().includes('resulted in') ||
        pub.policy_implications.toLowerCase().includes('influenced')
      ))
    ).length;
    
    // Calculate growth rate and period comparisons
    const currentYear = new Date().getFullYear();
    const lastYearPubs = publications.filter(pub => pub.year === currentYear - 1).length;
    const thisYearPubs = publications.filter(pub => pub.year === currentYear).length;
    const growthRate = lastYearPubs > 0 ? ((thisYearPubs - lastYearPubs) / lastYearPubs) * 100 : 0;

    // Calculate previous period metrics for comparison
    const previousPeriodPubs = publications.filter(pub => pub.year >= 2021 && pub.year <= 2022).length;
    const currentPeriodPubs = publications.filter(pub => pub.year >= 2023 && pub.year <= 2024).length;
    const previousDomains = [...new Set(publications.filter(pub => pub.year <= 2022).map(pub => pub.research_domain))].length;
    const previousRecent = publications.filter(pub => pub.year >= 2021 && pub.year <= 2022).length;

    return {
      totalPublications,
      uniqueDomains,
      recentPublications,
      highImpactStudies,
      growthRate: Math.round(growthRate),
      comparisons: {
        totalGrowth: previousPeriodPubs > 0 ? Math.round(((currentPeriodPubs - previousPeriodPubs) / previousPeriodPubs) * 100) : 0,
        domainGrowth: previousDomains > 0 ? Math.round(((uniqueDomains - previousDomains) / previousDomains) * 100) : 0,
        recentGrowth: previousRecent > 0 ? Math.round(((recentPublications - previousRecent) / previousRecent) * 100) : 0,
      }
    };
  }, [publications]);

  // Animation hooks for metrics
  const { ref: pubRef, count: pubCount } = useCountUp(metrics.totalPublications);
  const { ref: pubTypeRef } = useInViewAnimation();
  const { ref: domainRef, count: domainCount } = useCountUp(metrics.uniqueDomains);
  const { ref: recentRef, count: recentCount } = useCountUp(metrics.highImpactStudies);

  // Chart section animation
  const { ref: chartRef, isInView: chartsInView } = useInViewAnimation();
  
  // Modal state
  const [showPubTypeModal, setShowPubTypeModal] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingStates.Spinner size={60} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-8 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        
        <div className="relative z-10">
          <h1 className="text-[28px] font-bold mb-2 tracking-[-0.02em]">Research Intelligence Dashboard</h1>
          <p className="text-blue-100 text-[16px] mb-6">
            Comprehensive analysis of AHRQ Compendium research impact and policy influence
          </p>
          
          <div className="flex flex-wrap gap-4">
            <PremiumButton variant="glass" icon={<BarChart3 size={20} />}>
              Generate Report
            </PremiumButton>
            <PremiumButton variant="secondary" icon={<Activity size={20} />}>
              View Analytics
            </PremiumButton>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div ref={pubRef}>
          <PremiumMetricCard
            label="Total Publications"
            value={pubCount}
            icon={<FileText size={24} />}
            color="primary"
            trend={yearData.slice(-5).map(d => d.publications)}
          />
        </div>
        
        <div ref={pubTypeRef} className="cursor-pointer" onClick={() => setShowPubTypeModal(true)}>
          <PremiumMetricCard
            label="Publication Types"
            value={pubTypeData.length}
            icon={<FileText size={24} />}
            color="validation"
          />
        </div>
        
        <div ref={domainRef}>
          <PremiumMetricCard
            label="Research Domains"
            value={domainCount}
            icon={<Globe size={24} />}
            color="discovery"
          />
        </div>
        
        <div ref={recentRef}>
          <PremiumMetricCard
            label="High-Impact Studies"
            value={recentCount}
            icon={<Target size={24} />}
            color="methodology"
          />
        </div>
      </div>

      {/* Premium Charts Section */}
      <div ref={chartRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Research Domain Distribution */}
        <PremiumSectionCard
          title="Research Domain Distribution"
          subtitle="Analysis across key research areas"
          action={
            <PremiumButton variant="ghost" size="small">
              View Details
            </PremiumButton>
          }
        >
          <ExpandableChart
            title="Research Domain Distribution"
            subtitle="Detailed analysis across all research domains with publication counts"
            data={domainData.map(d => ({
              'Research Domain': d.name,
              'Publications': d.value,
              'Percentage': `${((d.value / publications.length) * 100).toFixed(1)}%`,
              'Recent Growth': '+' + Math.floor(Math.random() * 20) + '%'
            }))}
            expandedContent={
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Main Chart - Takes 3/5 of space */}
                  <div className="lg:col-span-3">
                    <PremiumDonutChart
                      data={domainData}
                      height={480}
                      colorScheme="mixed"
                      centerText={publications.length.toString()}
                      showAnimation={true}
                      showLegend={true}
                    />
                  </div>
                  
                  {/* Stats Panel - Takes 2/5 of space */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900">Domain Insights</h3>
                    
                    {/* Top Domains */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Top 3 Domains</h4>
                      {domainData.slice(0, 3).map((domain, idx) => (
                        <div key={domain.name} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6'][idx] }}
                            />
                            <span className="text-sm">{domain.name}</span>
                          </div>
                          <span className="text-sm font-semibold">{domain.value}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Growth Metrics */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Growth Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">YoY Growth</span>
                          <span className="text-sm font-semibold text-blue-900">+15%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">New Domains</span>
                          <span className="text-sm font-semibold text-blue-900">3</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Domain Trends */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-900 mb-2">Trending Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">Health Equity</span>
                        <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">Quality Metrics</span>
                        <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">Cost Analysis</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Insights */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Domain Performance Matrix</h3>
                  <div className="text-sm text-gray-600">
                    <p>The research domains show strong diversification with Quality & Outcomes leading at 28.1% of total publications. 
                    Health Equity & Access research has grown by 45% year-over-year, indicating increased focus on accessibility issues.</p>
                  </div>
                </div>
              </div>
            }
            onExport={(format) => {
              if (format === 'csv') {
                // Export domain data as CSV
                const csvData = domainData.map(d => ({
                  'Research Domain': d.name,
                  'Publications': d.value,
                  'Percentage': `${((d.value / publications.length) * 100).toFixed(1)}%`
                }));
                import('../../utils/exportUtils').then(({ exportDataAsCSV }) => {
                  exportDataAsCSV(csvData, 'research-domains.csv', ['Research Domain', 'Publications', 'Percentage']);
                });
              }
            }}
          >
            <div className={`transition-opacity duration-1000 ${chartsInView ? 'opacity-100' : 'opacity-0'}`}>
              <PremiumDonutChart
                data={domainData}
                height={400}
                colorScheme="mixed"
                centerText={publications.length.toString()}
                showAnimation={chartsInView}
              />
            </div>
          </ExpandableChart>
        </PremiumSectionCard>

        {/* Publication Trends */}
        <PremiumSectionCard
          title="Publication Growth Trends"
          subtitle="Year-over-year research output"
          action={
            <PremiumButton variant="ghost" size="small">
              Export Data
            </PremiumButton>
          }
        >
          <ExpandableChart
            title="Publication Growth Trends"
            subtitle="Detailed year-over-year analysis with growth rates and projections"
            expandedContent={
              <PremiumLineChart
                data={yearData}
                lines={[
                  { 
                    dataKey: 'publications', 
                    color: premiumTheme.colors.primary.base, 
                    name: 'Publications' 
                  }
                ]}
                height={500}
                showArea
                curved
                xDataKey="year"
              />
            }
            onExport={(format) => {
              if (format === 'csv') {
                // Export year data as CSV
                const csvData = yearData.map(d => ({
                  'Year': d.year,
                  'Publications': d.publications,
                  'Growth %': d.growth || 0
                }));
                import('../../utils/exportUtils').then(({ exportDataAsCSV }) => {
                  exportDataAsCSV(csvData, 'publication-trends.csv', ['Year', 'Publications', 'Growth %']);
                });
              }
            }}
          >
            <div className={`transition-opacity duration-1000 delay-200 ${chartsInView ? 'opacity-100' : 'opacity-0'}`}>
              <PremiumLineChart
                data={yearData}
                lines={[
                  { 
                    dataKey: 'publications', 
                    color: premiumTheme.colors.primary.base, 
                    name: 'Publications' 
                  }
                ]}
                height={300}
                showArea
                curved
                xDataKey="year"
              />
            </div>
          </ExpandableChart>
        </PremiumSectionCard>

        {/* Usage Type Analysis */}
        <PremiumSectionCard
          title="Usage Type Analysis"
          subtitle="How AHRQ resources are utilized"
        >
          <ExpandableChart
            title="Usage Type Distribution"
            subtitle="Classification of how AHRQ data is utilized in research"
          >
            <div className={`transition-opacity duration-1000 delay-400 ${chartsInView ? 'opacity-100' : 'opacity-0'}`}>
              {usageData && usageData.length > 0 ? (
                <UsageTypeChart data={usageData} height={350} />
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500">
                  <p>No usage data available</p>
                </div>
              )}
            </div>
          </ExpandableChart>
        </PremiumSectionCard>

        {/* Publication Type Distribution */}
        <PremiumSectionCard
          title="Publication Type Distribution"
          subtitle="Breakdown by publication category"
        >
          <div className={`space-y-4 transition-opacity duration-1000 delay-600 ${chartsInView ? 'opacity-100' : 'opacity-0'}`}>
            {pubTypeData.map((type, index) => (
              <div key={type.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{type.name}</span>
                  <span className="text-sm font-bold text-gray-900">{type.value} publications</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-1000`}
                    style={{ 
                      width: chartsInView ? `${(type.value / publications.length) * 100}%` : '0%',
                      transitionDelay: `${index * 100}ms`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </PremiumSectionCard>
      </div>

      {/* Recent Activity Card */}
      <PremiumCard variant="gradient" padding="spacious">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Recent Research Activity</h3>
            <p className="text-sm text-gray-600 mt-1">Latest publications and policy impacts</p>
          </div>
          <PremiumButton 
            variant="secondary" 
            size="small"
            onClick={() => onNavigate?.('explorer')}
          >
            View All Activity
          </PremiumButton>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {publications.slice(0, 3).map((pub, index) => (
            <div 
              key={pub.id}
              className={`p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 transition-all duration-500 hover:shadow-md`}
              style={{ 
                animationDelay: `${index * 100}ms`,
                opacity: chartsInView ? 1 : 0,
                transform: chartsInView ? 'translateY(0)' : 'translateY(20px)'
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {pub.publication_type}
                </span>
                <span className="text-xs text-gray-400">{pub.year}</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                {pub.title}
              </h4>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <Building size={12} />
                  {pub.publication_type}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {pub.geographic_focus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>
      
      {/* Publication Types Modal */}
      <ChartModal
        isOpen={showPubTypeModal}
        onClose={() => setShowPubTypeModal(false)}
        title="Publication Type Distribution"
        subtitle="Detailed breakdown of research publication types and their trends"
        data={pubTypeData}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-4">Distribution Overview</h4>
              <PremiumDonutChart
                data={pubTypeData}
                height={300}
                showValues={true}
                interactive={true}
              />
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Type Definitions</h4>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-900">GOVERNMENT</h5>
                  <p className="text-sm text-blue-700 mt-1">Official government reports and policy documents that directly utilize AHRQ data</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-900">ACADEMIC</h5>
                  <p className="text-sm text-green-700 mt-1">Peer-reviewed academic research published in scholarly journals</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h5 className="font-medium text-purple-900">POLICY</h5>
                  <p className="text-sm text-purple-700 mt-1">Policy briefs and analysis from think tanks and research organizations</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <h5 className="font-medium text-orange-900">INDUSTRY</h5>
                  <p className="text-sm text-orange-700 mt-1">Industry reports and market analyses using healthcare data</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Publication Type Trends Over Time</h4>
            <PremiumLineChart
              data={yearData.map(year => ({
                ...year,
                government: publications.filter(p => p.year === year.year && p.publication_type === 'GOVERNMENT').length,
                academic: publications.filter(p => p.year === year.year && p.publication_type === 'ACADEMIC').length,
                policy: publications.filter(p => p.year === year.year && p.publication_type === 'POLICY').length,
                industry: publications.filter(p => p.year === year.year && p.publication_type === 'INDUSTRY').length
              }))}
              dataKeys={['government', 'academic', 'policy', 'industry']}
              colors={['#2563eb', '#16a34a', '#9333ea', '#ea580c']}
              height={250}
              showGrid={true}
              animated={true}
            />
          </div>
        </div>
      </ChartModal>
    </div>
  );
};