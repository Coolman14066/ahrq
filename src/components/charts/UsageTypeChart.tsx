import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

interface UsageTypeChartProps {
  data: Array<{ name: string; value: number; percentage?: number; color?: string }>;
  height?: number;
}

export const UsageTypeChart: React.FC<UsageTypeChartProps> = ({ data, height = 350 }) => {
  console.log('[UsageTypeChart] Rendering with data:', data);
  
  // Default colors for usage types
  const defaultColors = {
    'Primary Analysis': '#3B82F6',
    'Research Enabler': '#10B981', 
    'Contextual Reference': '#F59E0B',
    'Unknown': '#6B7280'
  };
  
  // Ensure data is properly formatted
  const chartData = data.map((item) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage || Math.round((item.value / data.reduce((sum, d) => sum + d.value, 0)) * 100),
    color: item.color || defaultColors[item.name as keyof typeof defaultColors] || '#6B7280'
  }));
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-xl border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600 mt-1">
            Count: <span className="font-semibold">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-semibold">{data.percentage}%</span>
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Custom label to show value on top of bars
  const renderCustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize={14}
        fontWeight="600"
      >
        {value}
      </text>
    );
  };
  
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData}
          margin={{ top: 30, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#E5E7EB" 
            vertical={false}
          />
          <XAxis 
            dataKey="name"
            tick={{ 
              fill: '#4B5563',
              fontSize: 13,
              fontWeight: 500
            }}
            angle={-20}
            textAnchor="end"
            height={80}
            tickMargin={10}
          />
          <YAxis 
            tick={{ 
              fill: '#4B5563',
              fontSize: 12
            }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            <LabelList 
              dataKey="value" 
              position="top" 
              content={renderCustomLabel}
            />
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600">
              {item.name} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};