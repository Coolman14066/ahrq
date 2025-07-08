import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { premiumTheme } from '../../styles/premium-theme';

interface TemporalData {
  year: number;
  publications: number;
  growth: number;
  cumulativeTotal?: number;
  domainBreakdown?: { [key: string]: number };
}

interface TemporalAnalysisChartProps {
  data: TemporalData[];
  showGrowthRate?: boolean;
  showCumulative?: boolean;
  height?: number;
}

export const TemporalAnalysisChart: React.FC<TemporalAnalysisChartProps> = ({
  data,
  showGrowthRate = true,
  showCumulative = false,
  height = 400
}) => {
  // Calculate cumulative totals if needed
  const enrichedData = data.map((item, index) => {
    const cumulativeTotal = data.slice(0, index + 1).reduce((sum, d) => sum + d.publications, 0);
    return { ...item, cumulativeTotal };
  });

  // Calculate average growth rate
  const avgGrowth = data.reduce((sum, d) => sum + (d.growth || 0), 0) / data.filter(d => d.growth !== undefined).length;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    const yearData = payload[0]?.payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900">Year {label}</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-gray-600">
            Publications: <span className="font-medium text-gray-900">{yearData.publications}</span>
          </p>
          {yearData.growth !== undefined && (
            <p className="text-sm text-gray-600">
              Growth: <span className={`font-medium ${yearData.growth > 0 ? 'text-green-600' : yearData.growth < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {yearData.growth > 0 ? '+' : ''}{yearData.growth}%
              </span>
            </p>
          )}
          {showCumulative && (
            <p className="text-sm text-gray-600">
              Cumulative: <span className="font-medium text-gray-900">{yearData.cumulativeTotal}</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Growth Rate Summary */}
      {showGrowthRate && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Average Growth</p>
                <p className="text-lg font-semibold text-gray-900">
                  {avgGrowth > 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
                </p>
              </div>
              {avgGrowth > 5 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : avgGrowth < -5 ? (
                <TrendingDown className="h-5 w-5 text-red-500" />
              ) : (
                <Minus className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Peak Year</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.reduce((max, d) => d.publications > max.publications ? d : max).year}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Publications</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.reduce((sum, d) => sum + d.publications, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chart */}
      <ResponsiveContainer width="100%" height={height}>
        {showCumulative ? (
          <AreaChart data={enrichedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={premiumTheme.colors.primary.base} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={premiumTheme.colors.primary.base} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: premiumTheme.colors.neutral.supporting, fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis 
              tick={{ fill: premiumTheme.colors.neutral.supporting, fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cumulativeTotal"
              stroke={premiumTheme.colors.primary.base}
              fillOpacity={1}
              fill="url(#colorGradient)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="publications"
              stroke={premiumTheme.colors.accent.base}
              strokeWidth={2}
              dot={{ fill: premiumTheme.colors.accent.base, r: 4 }}
            />
          </AreaChart>
        ) : (
          <LineChart data={enrichedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              tick={{ fill: premiumTheme.colors.neutral.supporting, fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis 
              yAxisId="left"
              tick={{ fill: premiumTheme.colors.neutral.supporting, fontSize: 12 }}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            {showGrowthRate && (
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fill: premiumTheme.colors.neutral.supporting, fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => `${value}%`}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="publications"
              stroke={premiumTheme.colors.primary.base}
              strokeWidth={3}
              dot={{ fill: premiumTheme.colors.primary.base, r: 5 }}
              activeDot={{ r: 7 }}
              yAxisId="left"
            />
            {showGrowthRate && (
              <Line
                type="monotone"
                dataKey="growth"
                stroke={premiumTheme.colors.accent.light}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: premiumTheme.colors.accent.light, r: 3 }}
                yAxisId="right"
              />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* Trend Analysis */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Trend Analysis</h4>
        <div className="space-y-2 text-sm text-blue-800">
          {data.length >= 3 && (() => {
            const recentYears = data.slice(-3);
            const recentGrowth = recentYears.reduce((sum, d) => sum + (d.growth || 0), 0) / recentYears.length;
            const isAccelerating = recentGrowth > avgGrowth;
            
            return (
              <>
                <p>• Recent 3-year average growth: {recentGrowth.toFixed(1)}%</p>
                <p>• Trend: {isAccelerating ? 'Accelerating' : 'Decelerating'} research activity</p>
                <p>• Projection: Based on current trends, expect {Math.round(data[data.length - 1].publications * (1 + recentGrowth / 100))} publications next year</p>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};