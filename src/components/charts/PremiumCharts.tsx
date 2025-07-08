import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Area, AreaChart
} from 'recharts';
import { premiumTheme } from '../../styles/premium-theme';

// Premium color palette for charts
const CHART_COLORS = {
  primary: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
  discovery: ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4', '#ccfbf1'],
  validation: ['#166534', '#22c55e', '#4ade80', '#86efac', '#dcfce7'],
  methodology: ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  mixed: [
    '#1e3a8a', '#0f766e', '#166534', '#7c3aed', '#d97706', '#dc2626',
    '#3b82f6', '#14b8a6', '#22c55e', '#a78bfa', '#f59e0b', '#ef4444'
  ]
};

// Premium Donut Chart with external labels
interface PremiumDonutChartProps {
  data: Array<{ name: string; value: number; percentage?: number }>;
  height?: number;
  colorScheme?: keyof typeof CHART_COLORS;
  centerText?: string;
  showAnimation?: boolean;
  showLegend?: boolean;
}

export const PremiumDonutChart: React.FC<PremiumDonutChartProps> = React.memo(({
  data,
  height = 400,
  colorScheme = 'primary',
  centerText,
  showAnimation = true,
  showLegend = false,
}) => {
  const colors = CHART_COLORS[colorScheme];
  
  // Process data to group small segments
  const processedData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const threshold = 5; // Group items less than 5%
    
    const mainItems: typeof data = [];
    const otherItems: typeof data = [];
    
    data.forEach(item => {
      const percentage = (item.value / total) * 100;
      if (percentage >= threshold) {
        mainItems.push({ ...item, percentage: parseFloat(percentage.toFixed(1)) });
      } else {
        otherItems.push(item);
      }
    });
    
    // Add "Other" category if there are small items
    if (otherItems.length > 0) {
      const otherValue = otherItems.reduce((sum, item) => sum + item.value, 0);
      const otherPercentage = (otherValue / total) * 100;
      mainItems.push({
        name: 'Other',
        value: otherValue,
        percentage: parseFloat(otherPercentage.toFixed(1))
      });
    }
    
    return mainItems;
  }, [data]);
  
  // Custom label component with collision detection
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, value, index, name, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 50;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';
    
    // Leader line coordinates
    const x1 = cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN);
    const y1 = cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN);
    const x2 = cx + (outerRadius + 35) * Math.cos(-midAngle * RADIAN);
    const y2 = cy + (outerRadius + 35) * Math.sin(-midAngle * RADIAN);
    const x3 = x > cx ? x - 10 : x + 10;
    
    // Don't render label if segment is too small
    if (percent < 2) return null;
    
    return (
      <g>
        {/* Leader line */}
        <path
          d={`M ${x1},${y1} L ${x2},${y2} L ${x3},${y}`}
          stroke={colors[index % colors.length]}
          strokeWidth={1.5}
          fill="none"
          opacity={0.6}
          className="transition-all duration-300"
        />
        {/* Label text */}
        <text 
          x={x} 
          y={y - 8} 
          fill={premiumTheme.colors.neutral.charcoal}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          className="text-[11px] font-medium"
        >
          {name}
        </text>
        <text 
          x={x} 
          y={y + 8} 
          fill={colors[index % colors.length]}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          className="text-[11px] font-semibold"
        >
          {parseFloat((percent * 100).toFixed(1))}%
        </text>
      </g>
    );
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-lg shadow-xl border border-gray-100">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            Value: <span className="font-semibold">{payload[0].value}</span>
          </p>
          {payload[0].payload.percentage && (
            <p className="text-sm text-gray-600">
              Percentage: <span className="font-semibold">{payload[0].payload.percentage}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={processedData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={70}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={showAnimation ? 800 : 0}
            animationEasing="ease-out"
          >
            {processedData.map((_entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
                className="transition-all duration-300 hover:opacity-80"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      {centerText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center relative">
            {/* Background circle for depth */}
            <div className="absolute inset-0 -inset-4 bg-gradient-to-b from-gray-50 to-gray-100 rounded-full opacity-50" />
            <div className="relative z-10">
              <p className="text-[32px] font-bold text-[#1e293b] tracking-tight">{centerText}</p>
              <p className="text-xs font-medium text-[#64748b] mt-1">Total Studies</p>
              <p className="text-[10px] text-[#94a3b8] mt-0.5">2021-2025</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Color Legend */}
      {showLegend && (
        <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {processedData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm shadow-sm"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm font-medium text-gray-700">
                {entry.name}
              </span>
              <span className="text-sm text-gray-500">
                ({entry.percentage || parseFloat(((entry.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1))}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Premium Bar Chart with gradients
interface PremiumBarChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  height?: number;
  colorScheme?: keyof typeof CHART_COLORS;
  showGrid?: boolean;
  horizontal?: boolean;
}

export const PremiumBarChart: React.FC<PremiumBarChartProps> = React.memo(({
  data,
  height = 300,
  colorScheme = 'primary',
  showGrid = false,
  horizontal = false,
}) => {
  console.log('[PremiumBarChart] Received data:', data);
  console.log('[PremiumBarChart] Data length:', data?.length);
  
  // Enhanced debug logging for chart data
  console.log('[DEBUG PremiumBarChart] Data structure analysis:', {
    dataType: typeof data,
    isArray: Array.isArray(data),
    firstItem: data?.[0],
    dataKeys: data?.length > 0 ? Object.keys(data[0]) : 'no data',
    dataValues: data?.map((d, idx) => ({
      index: idx,
      name: d.name,
      nameType: typeof d.name,
      value: d.value,
      valueType: typeof d.value
    }))
  });
  
  // Handle empty or invalid data
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <p className="text-gray-500 text-sm">No usage data available</p>
          <p className="text-gray-400 text-xs mt-1">Data will appear once publications are loaded</p>
        </div>
      </div>
    );
  }
  
  const colors = CHART_COLORS[colorScheme];
  
  // Create gradient definitions
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-lg shadow-xl border border-gray-100">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Value: <span className="font-semibold text-blue-600">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const BarComponent = (props: any) => {
    const { fill, x, y, width, height } = props;
    const radius = 6;
    
    return (
      <g>
        <defs>
          <linearGradient id={`${gradientId}-${props.index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fill} stopOpacity={0.9} />
            <stop offset="100%" stopColor={fill} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`url(#${gradientId}-${props.index})`}
          rx={radius}
          ry={radius}
          className="transition-all duration-300 hover:opacity-80"
        />
      </g>
    );
  };

  // Ensure data has the correct structure
  const chartData = data.map((item, index) => {
    console.log(`[DEBUG BarChart] Item ${index}:`, item);
    return {
      ...item,
      name: String(item.name || `Item ${index}`), // Ensure name is a string
      value: Number(item.value || 0), // Ensure value is a number
    };
  });
  
  console.log('[DEBUG BarChart] Final chart data:', chartData);
  
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={chartData} 
          layout={horizontal ? 'horizontal' : 'vertical'}
          margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="0" 
              stroke={premiumTheme.colors.neutral.boundary}
              strokeOpacity={0.5}
              vertical={false}
            />
          )}
          <XAxis 
            type={horizontal ? 'number' : 'category'}
            dataKey={horizontal ? undefined : 'name'}
            tick={{ 
              fill: premiumTheme.colors.neutral.supporting, 
              fontSize: 12
            }}
            angle={-45}
            textAnchor="end"
            axisLine={{ stroke: 'transparent' }}
            tickLine={false}
            interval={0}
            height={60}
            tickFormatter={(value) => {
              console.log('[DEBUG XAxis] Formatting tick:', value, typeof value);
              return String(value || '');
            }}
          />
          <YAxis 
            type={horizontal ? 'category' : 'number'}
            dataKey={horizontal ? 'name' : undefined}
            tick={{ fill: premiumTheme.colors.neutral.supporting, fontSize: 12 }}
            axisLine={{ stroke: 'transparent' }}
            tickLine={false}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
          />
          <Bar 
            dataKey="value" 
            shape={BarComponent}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// Premium Line/Area Chart
interface PremiumLineChartProps {
  data: Array<{ [key: string]: any }>;
  lines: Array<{ dataKey: string; color: string; name: string }>;
  height?: number;
  showArea?: boolean;
  showGrid?: boolean;
  curved?: boolean;
  xDataKey?: string;
}

export const PremiumLineChart: React.FC<PremiumLineChartProps> = React.memo(({
  data,
  lines,
  height = 300,
  showArea = false,
  showGrid = true,
  curved = true,
  xDataKey = 'name',
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-lg shadow-xl border border-gray-100">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const Chart = showArea ? AreaChart : LineChart;
  const DataLine: any = showArea ? Area : Line;

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart 
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <defs>
            {lines.map((line, index) => (
              <linearGradient key={index} id={`gradient-${line.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity={0.3}/>
                <stop offset="100%" stopColor={line.color} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="0" 
              stroke={premiumTheme.colors.neutral.boundary}
              strokeOpacity={0.2}
              vertical={false}
            />
          )}
          <XAxis 
            dataKey={xDataKey}
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: 'transparent' }}
            tickLine={false}
            tickMargin={12}
            tickFormatter={(value) => {
              // Format year values if xDataKey is 'year'
              if (xDataKey === 'year' && typeof value === 'number') {
                return value.toString();
              }
              return value;
            }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: 'transparent' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {lines.map((line, index) => (
            <DataLine
              key={index}
              type={curved ? 'monotone' : 'linear'}
              dataKey={line.dataKey}
              stroke={line.color || '#1e3a8a'}
              strokeWidth={4}
              fill={showArea ? `url(#gradient-${line.dataKey})` : 'none'}
              name={line.name}
              dot={{ fill: '#ffffff', strokeWidth: 3, r: 5, stroke: line.color || '#1e3a8a' }}
              activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          ))}
        </Chart>
      </ResponsiveContainer>
    </div>
  );
});

// Mini sparkline component for inline metrics
interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = premiumTheme.colors.primary.base,
  height = 40,
  width = 100,
}) => {
  const chartData = data.map((value, index) => ({ value, index }));
  
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};