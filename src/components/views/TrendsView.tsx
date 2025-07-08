import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Zap, ArrowUp, ArrowDown, Grid, Target } from 'lucide-react';
import { StatisticalInsightsPanel } from '../charts/StatisticalInsightsPanel';
import { TemporalAnalysisChart } from '../charts/TemporalAnalysisChart';
import { CrossDomainHeatmap } from '../charts/CrossDomainHeatmap';
import { SankeyDiagram } from '../visualizations/SankeyDiagram';

interface TrendsViewProps {
  filteredPublications: any[];
  researchMomentum: {
    accelerating: any[];
    stable: any[];
    declining: any[];
  };
  emergingTopics: Array<{
    topic: string;
    count: number;
    papers: string[];
  }>;
  yearData: any[];
  pubTypeData: Array<{
    name: string;
    value: number;
    percentage?: number;
  }>;
  crossDomainData: any[];
  domainStats: Array<{
    domain: string;
    total: number;
    primary: number;
    enabler: number;
    contextual: number;
    trend: 'rising' | 'declining' | 'stable';
    recentGrowth: number;
  }>;
  usageData: Array<{
    name: string;
    value: number;
  }>;
  domainData: Array<{
    name: string;
    value: number;
    percentage?: number;
  }>;
  publicationsData: any[];
  onDomainSelect: (domain: string) => void;
  onUsageTypeSelect: (usageType: string) => void;
}

export const TrendsView: React.FC<TrendsViewProps> = ({
  filteredPublications,
  researchMomentum,
  emergingTopics,
  yearData,
  pubTypeData,
  crossDomainData,
  domainStats,
  usageData,
  domainData,
  publicationsData,
  onDomainSelect,
  onUsageTypeSelect,
}) => {
  return (
    <div className="space-y-6">
      {/* Statistical Insights Panel */}
      <StatisticalInsightsPanel 
        publications={filteredPublications} 
        className=""
      />
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Research Momentum Analysis</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-gray-900">Accelerating</p>
                  <p className="text-3xl font-bold text-gray-900">{researchMomentum.accelerating.length}</p>
                  <p className="text-sm text-gray-700">Research domains</p>
                </div>
                <ArrowUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-gray-900">Stable</p>
                  <p className="text-3xl font-bold text-gray-900">{researchMomentum.stable.length}</p>
                  <p className="text-sm text-gray-700">Research domains</p>
                </div>
                <div className="h-5 w-5 flex items-center justify-center">
                  <div className="h-0.5 w-4 bg-gray-600"></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-gray-900">Decelerating</p>
                  <p className="text-3xl font-bold text-gray-900">{researchMomentum.declining.length}</p>
                  <p className="text-sm text-gray-700">Research domains</p>
                </div>
                <ArrowDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Emerging Research Themes (2023-2025)</h3>
        <div className="space-y-3">
          {emergingTopics.length > 0 ? (
            emergingTopics.slice(0, 3).map((topic) => {
              return (
                <div key={topic.topic} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center flex-grow">
                    <Zap className="h-5 w-5 text-gray-600 mr-4" />
                    <div className="flex-grow">
                      <p className="font-medium text-gray-900">{topic.topic}</p>
                      <p className="text-sm text-gray-700" title={topic.papers.join(', ')}>
                        {topic.papers.length > 0 ? `Including: ${topic.papers[0].substring(0, 50)}...` : 'Emerging research area'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 text-right ml-4">{topic.count} papers</span>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center py-4">No emerging topics identified in recent publications</p>
          )}
        </div>
      </div>

      {/* Temporal Analysis with Year-over-Year Growth */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Calendar className="mr-2" size={20} />
          Temporal Analysis & Growth Trends
        </h3>
        <p className="text-gray-600 mb-4">
          Year-over-year publication trends with growth indicators and projections
        </p>
        <TemporalAnalysisChart 
          data={yearData}
          showGrowthRate={true}
          showCumulative={false}
          height={400}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Publication Type Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pubTypeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cross-Domain Analysis Heatmap */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Grid className="mr-2" size={20} />
          Cross-Domain Analysis: Research Domain vs Usage Type
        </h3>
        <p className="text-gray-600 mb-4">
          Interactive heatmap showing the distribution of usage types across different research domains
        </p>
        <CrossDomainHeatmap 
          data={crossDomainData}
          onCellClick={(domain, usageType) => {
            // Filter publications based on selection
            onDomainSelect(domain);
            onUsageTypeSelect(usageType.replace(/ /g, '_').toUpperCase());
            console.log(`Filtering by domain: ${domain}, usage: ${usageType}`);
          }}
        />
        
        {/* Domain Statistics Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domainStats.slice(0, 6).map((stat) => (
            <div key={stat.domain} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{stat.domain}</h4>
                  <p className="text-xs text-gray-600 mt-1">Total: {stat.total} publications</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      Primary: {stat.primary}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      Enabler: {stat.enabler}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      Context: {stat.contextual}
                    </span>
                  </div>
                </div>
                <div className="flex items-center">
                  {stat.trend === 'rising' && (
                    <div className="text-green-600">
                      <ArrowUp className="h-4 w-4" />
                      <span className="text-xs">{stat.recentGrowth}%</span>
                    </div>
                  )}
                  {stat.trend === 'declining' && (
                    <div className="text-red-600">
                      <ArrowDown className="h-4 w-4" />
                      <span className="text-xs">{stat.recentGrowth}%</span>
                    </div>
                  )}
                  {stat.trend === 'stable' && (
                    <div className="text-gray-400">
                      <div className="h-0.5 w-4 bg-gray-400"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Research Impact Flow Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Target className="mr-2" size={20} />
          Research Impact Flow
        </h3>
        <p className="text-gray-600 mb-4">
          Visualizing how research flows from publication types through usage patterns to policy outcomes
        </p>
        <SankeyDiagram 
          publications={publicationsData}
          flowType="policy_impact"
          onNodeClick={(node) => {
            console.log('Selected node:', node);
          }}
          onLinkClick={(link) => {
            console.log('Selected flow:', link);
          }}
          height={500}
        />
        
        {/* Impact Flow Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Most Influential Type</h4>
            <p className="text-sm text-gray-700">
              {pubTypeData[0]?.name || 'Academic Journal'} ({pubTypeData[0]?.value || 0} publications)
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Primary Usage Pattern</h4>
            <p className="text-sm text-gray-700">
              {usageData[0]?.name || 'Primary Analysis'} ({usageData[0]?.value || 0} uses)
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Top Policy Impact</h4>
            <p className="text-sm text-gray-700">
              {domainData[0]?.name || 'Healthcare Quality'} ({domainData[0]?.value || 0} influences)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};