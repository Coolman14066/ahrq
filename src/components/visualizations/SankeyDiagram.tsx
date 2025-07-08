import React, { useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { useResponsiveD3, createTooltip, showTooltip, hideTooltip } from '../../hooks/useD3';
import { SankeyDiagramProps, SankeyNode, SankeyLink, GeographicCategory } from '../../types/sankey';
import { buildSankeyFlow, getDefaultColorScheme, generateFlowInsights } from '../../utils/sankeyUtils';
import { TrendingUp, Filter, Eye, Info } from 'lucide-react';


export const SankeyDiagram: React.FC<SankeyDiagramProps> = ({
  publications = [],
  flowType = 'policy_impact',
  filter = {},
  onNodeClick,
  onLinkClick,
  height = 600,
  interactive = true
}) => {
  const [selectedNode, setSelectedNode] = useState<SankeyNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<SankeyLink | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filter);
  const [tooltip, setTooltip] = useState<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Process Sankey data with error handling
  const sankeyData = useMemo(() => {
    try {
      setError(null);
      console.log('[SankeyDiagram] Building flow with:', {
        publicationCount: publications?.length || 0,
        filterActive: Object.keys(activeFilter).length > 0
      });
      return buildSankeyFlow(publications, activeFilter);
    } catch (err) {
      console.error('[SankeyDiagram] Error building Sankey flow:', err);
      setError(err instanceof Error ? err.message : 'Failed to build flow visualization');
      // Return empty flow data
      return {
        nodes: [],
        links: [],
        levels: {},
        metrics: null,
        totalPublications: 0,
        totalFlowValue: 0
      };
    }
  }, [publications, activeFilter]);

  // Generate insights
  const insights = useMemo(() => {
    // Only generate insights if we have valid data and no error
    if (error || !sankeyData.metrics || sankeyData.nodes.length === 0) {
      return [];
    }
    return generateFlowInsights(sankeyData);
  }, [sankeyData, error]);

  // Color scheme
  const colorScheme = useMemo(() => getDefaultColorScheme(), []);

  // Get node color
  const getNodeColor = useCallback((node: SankeyNode) => {
    const categoryColors = colorScheme[node.category];
    if (categoryColors && typeof categoryColors === 'object') {
      return (categoryColors as any)[node.name] || '#6B7280';
    }
    return '#6B7280';
  }, [colorScheme]);

  // Get link color and opacity
  const getLinkColor = useCallback((link: SankeyLink) => {
    const sourceNode = sankeyData.nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source.id));
    if (sourceNode) {
      const baseColor = getNodeColor(sourceNode);
      return baseColor;
    }
    return '#94A3B8';
  }, [sankeyData.nodes, getNodeColor]);

  // Generate tooltip content
  const generateNodeTooltip = useCallback((node: SankeyNode) => {
    return `
      <div style="text-align: left; font-size: 12px; max-width: 250px;">
        <strong>${node.name}</strong><br/>
        <span style="color: #3B82F6;">Publications:</span> ${node.publicationCount}<br/>
        <span style="color: #8B5CF6;">Flow Value:</span> ${node.value.toFixed(1)}<br/>
        <span style="color: #6B7280;">Period:</span> ${node.yearRange[0]}-${node.yearRange[1]}<br/>
        ${node.topAuthors.length > 0 ? `<span style="color: #EC4899;">Top Authors:</span> ${node.topAuthors.slice(0, 2).join(', ')}` : ''}
      </div>
    `;
  }, []);

  const generateLinkTooltip = useCallback((link: SankeyLink) => {
    const sourceName = typeof link.source === 'string' ? link.source : link.source.name;
    const targetName = typeof link.target === 'string' ? link.target : link.target.name;
    
    return `
      <div style="text-align: left; font-size: 12px; max-width: 300px;">
        <strong>${sourceName} → ${targetName}</strong><br/>
        <span style="color: #3B82F6;">Publications:</span> ${link.publications.length}<br/>
        <span style="color: #8B5CF6;">Flow Weight:</span> ${link.value.toFixed(1)}<br/>
        <span style="color: #6B7280;">Strength:</span> ${(link.strengthScore * 100).toFixed(1)}%
      </div>
    `;
  }, []);

  // D3 rendering function
  const renderSankey = useCallback((svg: any, dimensions: { width: number; height: number }) => {
    const { width, height } = dimensions;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create tooltip if it doesn't exist
    let tooltipElement = tooltip;
    if (!tooltipElement) {
      tooltipElement = createTooltip();
      setTooltip(tooltipElement);
    }

    // Clear previous content
    svg.selectAll("*").remove();

    // Validate data before rendering
    if (!sankeyData || !sankeyData.nodes || sankeyData.nodes.length === 0) {
      // Display "No data" message
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#6B7280')
        .text('No data available for visualization');
      return;
    }

    // Create main container
    const container = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    try {
      // Create Sankey generator
      const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
        .nodeWidth(15)
        .nodePadding(10)
        .nodeId((d: any) => d.id) // Explicitly tell d3-sankey to use the 'id' field
        .extent([[1, 1], [innerWidth - 1, innerHeight - 6]]);

      // Prepare data for D3 Sankey - ensure depth property exists
      const sankeyInput = {
        nodes: sankeyData.nodes.map(node => ({ 
          ...node,
          depth: node.depth !== undefined ? node.depth : node.level // Ensure depth exists
        })),
        links: sankeyData.links.map(link => ({ 
          ...link,
          // Ensure source and target are strings
          source: typeof link.source === 'string' ? link.source : link.source.id,
          target: typeof link.target === 'string' ? link.target : link.target.id
        }))
      };
      
      // Validate all links reference existing nodes
      const nodeIds = new Set(sankeyData.nodes.map(n => n.id));
      const invalidLinks = sankeyData.links.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return !nodeIds.has(sourceId) || !nodeIds.has(targetId);
      });
      if (invalidLinks.length > 0) {
        console.error('[SankeyDiagram] Invalid links found:', invalidLinks);
        console.error('[SankeyDiagram] Available node IDs:', Array.from(nodeIds));
        // Don't proceed if we have invalid links
        container.append('text')
          .attr('x', innerWidth / 2)
          .attr('y', innerHeight / 2)
          .attr('text-anchor', 'middle')
          .attr('font-size', '14px')
          .attr('fill', '#DC2626')
          .text(`Error: ${invalidLinks.length} invalid links found. Check console for details.`);
        return;
      }

      // Validate data structure
      if (!sankeyInput.nodes.every(n => typeof n.depth === 'number' && n.depth >= 0)) {
        console.error('[SankeyDiagram] Invalid node depth values:', sankeyInput.nodes);
        throw new Error('Invalid node depth values');
      }

      // Generate Sankey layout
      let nodes: any[], links: any[];
      try {
        const result = sankeyGenerator(sankeyInput);
        nodes = result.nodes;
        links = result.links;
      } catch (sankeyError: any) {
        console.error('[SankeyDiagram] D3-Sankey error details:', {
          error: sankeyError,
          message: sankeyError.message,
          stack: sankeyError.stack,
          nodeCount: sankeyInput.nodes.length,
          linkCount: sankeyInput.links.length,
          firstNode: sankeyInput.nodes[0],
          firstLink: sankeyInput.links[0]
        });
        throw sankeyError;
      }

      // Create links (must be drawn first to appear behind nodes)
      const linkSelection = container.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(links)
      .enter().append('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d: any) => getLinkColor(d))
      .attr('stroke-width', (d: any) => Math.max(1, d.width || 1))
      .attr('stroke-opacity', 0.6)
      .attr('fill', 'none')
      .style('cursor', interactive ? 'pointer' : 'default');

    // Create nodes
    const nodeSelection = container.append('g')
      .attr('class', 'nodes')
      .selectAll('rect')
      .data(nodes)
      .enter().append('rect')
      .attr('x', (d: any) => d.x0 || 0)
      .attr('y', (d: any) => d.y0 || 0)
      .attr('width', (d: any) => (d.x1 || 0) - (d.x0 || 0))
      .attr('height', (d: any) => (d.y1 || 0) - (d.y0 || 0))
      .attr('fill', (d: any) => getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', interactive ? 'pointer' : 'default');

    // Add node labels
    container.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .attr('x', (d: any) => {
        const nodeWidth = (d.x1 || 0) - (d.x0 || 0);
        const nodeX = d.x0 || 0;
        // Position labels to the right of nodes in first 3 levels, left for last level
        return d.level < 3 ? nodeX + nodeWidth + 6 : nodeX - 6;
      })
      .attr('y', (d: any) => ((d.y1 || 0) + (d.y0 || 0)) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.level < 3 ? 'start' : 'end')
      .text((d: any) => d.name)
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .style('pointer-events', 'none');

    // Add level headers
    const levelHeaders = ['Publication Type', 'Usage Type', 'Research Domain', 'Geographic Focus'];
    const levelPositions = [0, innerWidth * 0.25, innerWidth * 0.5, innerWidth * 0.75];
    
    levelPositions.forEach((x, i) => {
      container.append('text')
        .attr('x', x)
        .attr('y', -5)
        .attr('text-anchor', 'start')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', '#1F2937')
        .text(levelHeaders[i]);
    });

    // Interactive behaviors
    if (interactive) {
      // Node interactions
      nodeSelection
        .on('mouseover', function(this: any, event: any, d: any) {
          d3.select(this)
            .attr('stroke', '#000')
            .attr('stroke-width', 2);
          
          if (tooltipElement) {
            showTooltip(tooltipElement, generateNodeTooltip(d), event);
          }
          
          // Highlight connected links
          linkSelection.attr('stroke-opacity', (link: any) => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return (sourceId === d.id || targetId === d.id) ? 0.8 : 0.2;
          });
          
          // Fade non-connected nodes
          nodeSelection.attr('opacity', (node: any) => {
            const hasConnection = links.some(link => {
              const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
              const targetId = typeof link.target === 'object' ? link.target.id : link.target;
              return (sourceId === d.id || targetId === d.id) && 
                     (sourceId === node.id || targetId === node.id);
            });
            return hasConnection || node.id === d.id ? 1 : 0.3;
          });
        })
        .on('mouseout', function(this: any, _event: any, _d: any) {
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
          
          if (tooltipElement) {
            hideTooltip(tooltipElement);
          }
          
          // Restore default opacity
          linkSelection.attr('stroke-opacity', 0.6);
          nodeSelection.attr('opacity', 1);
        })
        .on('click', function(_event: any, d: any) {
          setSelectedNode(d);
          onNodeClick?.(d);
        });

      // Link interactions
      linkSelection
        .on('mouseover', function(this: any, event: any, d: any) {
          d3.select(this)
            .attr('stroke-opacity', 0.8)
            .attr('stroke-width', Math.max(2, (d.width || 1) + 1));
          
          if (tooltipElement) {
            showTooltip(tooltipElement, generateLinkTooltip(d), event);
          }
        })
        .on('mouseout', function(this: any, _event: any, d: any) {
          d3.select(this)
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', Math.max(1, d.width || 1));
          
          if (tooltipElement) {
            hideTooltip(tooltipElement);
          }
        })
        .on('click', function(_event: any, d: any) {
          setSelectedLink(d);
          onLinkClick?.(d);
        });
    }
    } catch (error) {
      console.error('[SankeyDiagram] Error rendering Sankey diagram:', error);
      // Display error message
      container.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#DC2626')
        .text('Error rendering visualization');
    }

  }, [sankeyData, getNodeColor, getLinkColor, generateNodeTooltip, generateLinkTooltip, 
      interactive, tooltip, onNodeClick, onLinkClick]);

  const { containerRef, svgRef } = useResponsiveD3(renderSankey, [sankeyData, selectedNode, selectedLink]);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Filter size={14} />
          Filters
        </button>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp size={14} />
          <span>Flow Type: {flowType}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Eye size={14} />
          <span>{sankeyData.totalPublications} publications</span>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading visualization</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-3">Flow Filters</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year Range</label>
              <select
                value={`${activeFilter.yearRange?.[0] || 2010}-${activeFilter.yearRange?.[1] || 2025}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split('-').map(Number);
                  setActiveFilter({
                    ...activeFilter,
                    yearRange: [start, end]
                  });
                }}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="2010-2025">All Years</option>
                <option value="2020-2025">2020-2025</option>
                <option value="2022-2025">2022-2025</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geographic Focus</label>
              <select
                value={activeFilter.geographicCategories?.[0] || 'all'}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setActiveFilter({
                      ...activeFilter,
                      geographicCategories: []
                    });
                  } else {
                    setActiveFilter({
                      ...activeFilter,
                      geographicCategories: [e.target.value as GeographicCategory]
                    });
                  }
                }}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Locations</option>
                <option value="USA">National (USA)</option>
                <option value="State-level">State Level</option>
                <option value="Regional">Regional</option>
                <option value="Local">Local</option>
                <option value="International">International</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sankey Diagram */}
      <div ref={containerRef} className="w-full border border-gray-200 rounded-lg bg-white">
        <svg ref={svgRef} className="w-full" style={{ height: `${height}px` }} />
      </div>

      {/* Flow Metrics */}
      {sankeyData.metrics && !error && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Total Nodes</div>
            <div className="text-xl font-bold text-blue-900">{sankeyData.metrics.totalNodes}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-green-800">Flow Links</div>
            <div className="text-xl font-bold text-green-900">{sankeyData.metrics.totalLinks}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-purple-800">Avg Flow Value</div>
            <div className="text-xl font-bold text-purple-900">{sankeyData.metrics.avgFlowValue.toFixed(1)}</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-orange-800">Publications</div>
            <div className="text-xl font-bold text-orange-900">{sankeyData.totalPublications}</div>
          </div>
        </div>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow border">
          <h4 className="font-semibold mb-2 flex items-center">
            <Info size={16} className="mr-2" />
            {selectedNode.category.replace('_', ' ').toUpperCase()}: {selectedNode.name}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Publications:</span> {selectedNode.publicationCount}
            </div>
            <div>
              <span className="font-medium">Year Range:</span> {selectedNode.yearRange[0]}-{selectedNode.yearRange[1]}
            </div>
            <div>
              <span className="font-medium">Flow Value:</span> {selectedNode.value.toFixed(1)}
            </div>
            <div>
              <span className="font-medium">Category:</span> {selectedNode.category.replace('_', ' ')}
            </div>
          </div>
          {selectedNode.topAuthors.length > 0 && (
            <div className="mt-2">
              <span className="font-medium text-sm">Top Authors:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedNode.topAuthors.map(author => (
                  <span key={author} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {author}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow border">
          <h4 className="font-semibold mb-3">Flow Insights</h4>
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, index) => (
              <div key={index} className={`p-3 rounded ${
                insight.significance === 'high' ? 'bg-red-50 border-l-4 border-red-400' :
                insight.significance === 'medium' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                'bg-blue-50 border-l-4 border-blue-400'
              }`}>
                <h5 className="font-medium text-sm">{insight.title}</h5>
                <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                <div className="text-xs text-gray-500 mt-2">
                  Confidence: {(insight.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SankeyDiagram;