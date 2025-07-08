import React, { useMemo } from 'react';
import { Tooltip } from '../ui/Tooltip';
import { CrossDomainData } from '../../utils/dataValidation';

interface CrossDomainHeatmapProps {
  data: CrossDomainData[];
  onCellClick?: (domain: string, usageType: string) => void;
}

export const CrossDomainHeatmap: React.FC<CrossDomainHeatmapProps> = ({ data, onCellClick }) => {
  // Extract unique domains and usage types
  const { domains, usageTypes, matrix } = useMemo(() => {
    const uniqueDomains = Array.from(new Set(data.map(d => d.domain))).sort();
    const uniqueUsageTypes = Array.from(new Set(data.map(d => d.usageType))).sort();
    
    // Create matrix for easy lookup
    const matrixMap = new Map<string, CrossDomainData>();
    data.forEach(item => {
      matrixMap.set(`${item.domain}|${item.usageType}`, item);
    });
    
    return {
      domains: uniqueDomains,
      usageTypes: uniqueUsageTypes,
      matrix: matrixMap
    };
  }, [data]);

  // Get color intensity based on count using theme colors
  const getColorIntensity = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-gray-50';
    const ratio = count / maxCount;
    if (ratio <= 0.2) return 'bg-primary-lightest hover:bg-primary-lighter';
    if (ratio <= 0.4) return 'bg-primary-lighter hover:bg-primary-light';
    if (ratio <= 0.6) return 'bg-primary-light hover:bg-primary-base';
    if (ratio <= 0.8) return 'bg-primary-base hover:bg-primary-dark';
    return 'bg-primary-dark hover:bg-primary-darker';
  };

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] p-6">
        {/* Header */}
        <div className="flex items-end mb-6 pb-4">
          <div className="w-56 mr-6"></div>
          {usageTypes.map((usageType) => (
            <div key={usageType} className="flex-1 min-w-[80px] px-2">
              <div className="text-sm font-semibold text-gray-800 transform -rotate-30 origin-bottom-left whitespace-nowrap pb-4">
                {usageType}
              </div>
            </div>
          ))}
        </div>

        {/* Rows */}
        {domains.map((domain) => (
          <div key={domain} className="flex items-center mb-3">
            <div className="w-56 pr-6">
              <div className="text-sm font-semibold text-gray-800 line-clamp-2" title={domain}>
                {domain}
              </div>
            </div>
            {usageTypes.map((usageType) => {
              const cellData = matrix.get(`${domain}|${usageType}`);
              const count = cellData?.count || 0;
              const percentage = cellData?.percentage || 0;

              return (
                <div key={`${domain}-${usageType}`} className="flex-1 min-w-[80px] px-1">
                  <Tooltip
                    title={
                      <div className="text-sm p-1">
                        <div className="font-bold text-base mb-1">{domain}</div>
                        <div className="text-gray-600 mb-2">{usageType}</div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Count:</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Domain %:</span>
                            <span className="font-semibold">{percentage}% of {cellData?.domainTotal || 0} in domain</span>
                          </div>
                          {cellData?.totalPublications && (
                            <div className="flex justify-between">
                              <span>Overall %:</span>
                              <span className="font-semibold">{((count / cellData.totalPublications) * 100).toFixed(1)}% of all publications</span>
                            </div>
                          )}
                        </div>
                      </div>
                    }
                    placement="top"
                    arrow
                  >
                    <div
                      className={`
                        h-16 rounded-lg flex flex-col items-center justify-center cursor-pointer
                        transition-all duration-200 border-2 border-transparent shadow-sm
                        ${count > 0 ? getColorIntensity(count, maxCount) : 'bg-gray-50'}
                        ${count > 0 ? 'hover:border-primary-base hover:shadow-lg hover:scale-105' : ''}
                      `}
                      onClick={() => count > 0 && onCellClick?.(domain, usageType)}
                    >
                      {count > 0 && (
                        <>
                          <span className={`text-sm font-bold ${cellData && cellData.count > maxCount / 2 ? 'text-white' : 'text-gray-900'}`}>
                            {count}
                          </span>
                          <span className={`text-xs ${cellData && cellData.count > maxCount / 2 ? 'text-white/80' : 'text-gray-600'}`}>
                            {percentage}%
                          </span>
                        </>
                      )}
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-10 flex items-center justify-center space-x-6">
          <span className="text-sm font-medium text-gray-600">Less</span>
          <div className="flex space-x-3">
            <Tooltip title="0% - 20%" placement="bottom">
              <div className="w-12 h-12 rounded-lg bg-primary-lightest border border-gray-200 cursor-help" />
            </Tooltip>
            <Tooltip title="20% - 40%" placement="bottom">
              <div className="w-12 h-12 rounded-lg bg-primary-lighter border border-gray-200 cursor-help" />
            </Tooltip>
            <Tooltip title="40% - 60%" placement="bottom">
              <div className="w-12 h-12 rounded-lg bg-primary-light border border-gray-200 cursor-help" />
            </Tooltip>
            <Tooltip title="60% - 80%" placement="bottom">
              <div className="w-12 h-12 rounded-lg bg-primary-base border border-gray-200 cursor-help" />
            </Tooltip>
            <Tooltip title="80% - 100%" placement="bottom">
              <div className="w-12 h-12 rounded-lg bg-primary-dark border border-gray-200 cursor-help" />
            </Tooltip>
          </div>
          <span className="text-sm font-medium text-gray-600">More</span>
        </div>
      </div>
    </div>
  );
};