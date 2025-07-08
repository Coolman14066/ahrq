import React, { useState, useMemo, useCallback, useRef } from 'react';
import * as d3 from 'd3';
import { useResponsiveD3, createTooltip, showTooltip, hideTooltip } from '../../hooks/useD3';
import { NetworkNode, NetworkEdge, NetworkGraphProps } from '../../types/network';
import { buildAuthorNetwork } from '../../utils/networkUtils';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Settings } from 'lucide-react';

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  publications,
  networkType = 'author',
  selectedMetric = 'collaborations',
  filter = {},
  onNodeClick,
  height = 600,
  interactive = true
}) => {
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [tooltip, setTooltip] = useState<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  
  const simulationRef = useRef<d3.Simulation<NetworkNode, NetworkEdge> | null>(null);

  // Process network data
  const networkData = useMemo(() => {
    if (networkType === 'author') {
      return buildAuthorNetwork(publications, filter);
    }
    // For now, only author networks are implemented
    return buildAuthorNetwork(publications, filter);
  }, [publications, networkType, filter]);

  // Node color based on type and metrics
  const getNodeColor = useCallback((node: NetworkNode) => {
    switch (selectedMetric) {
      case 'collaborations': {
        const collabScale = d3.scaleSequential(d3.interpolateBlues)
          .domain([0, Math.max(...networkData.nodes.map(n => n.collaborationCount))]);
        return collabScale(node.collaborationCount);
      }
      default:
        return node.type === 'author' ? '#3B82F6' : '#10B981';
    }
  }, [selectedMetric, networkData.nodes]);

  // Node size based on publication count
  const getNodeSize = useCallback((node: NetworkNode) => {
    const minSize = 5;
    const maxSize = 20;
    const scale = d3.scaleSqrt()
      .domain([1, Math.max(...networkData.nodes.map(n => n.publicationCount))])
      .range([minSize, maxSize]);
    return scale(node.publicationCount);
  }, [networkData.nodes]);

  // Edge width based on collaboration strength
  const getEdgeWidth = useCallback((edge: NetworkEdge) => {
    const minWidth = 1;
    const maxWidth = 5;
    const scale = d3.scaleLinear()
      .domain([0, Math.max(...networkData.edges.map(e => e.weight))])
      .range([minWidth, maxWidth]);
    return scale(edge.weight);
  }, [networkData.edges]);

  // Generate tooltip content
  const generateNodeTooltip = useCallback((node: NetworkNode) => {
    return `
      <div style="text-align: left; font-size: 12px;">
        <strong>${node.name}</strong><br/>
        <span style="color: #3B82F6;">Publications:</span> ${node.publicationCount}<br/>
        <span style="color: #10B981;">Collaborations:</span> ${node.collaborationCount}<br/>
        <span style="color: #6B7280;">Active:</span> ${node.yearRange[0]}-${node.yearRange[1]}
      </div>
    `;
  }, []);

  // D3 rendering function
  const renderNetwork = useCallback((svg: any, dimensions: { width: number; height: number }) => {
    const { width, height } = dimensions;
    
    // Create tooltip if it doesn't exist
    let tooltipElement = tooltip;
    if (!tooltipElement) {
      tooltipElement = createTooltip();
      setTooltip(tooltipElement);
    }

    // Clear previous content
    svg.selectAll("*").remove();

    // Check if we have data to render
    if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
      // Display "No data" message
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#6B7280')
        .text(networkData?.edges?.length === 0 ? 
          'No collaborations found in the current data' : 
          'No network data available');
      
      // Add additional help text
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2 + 25)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#9CA3AF')
        .text('Try adjusting filters or checking data format');
      return;
    }

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // Create container for zoomable content
    const container = svg.append("g").attr("class", "network-container");

    // Create simulation
    const simulation = d3.forceSimulation<NetworkNode>(networkData.nodes)
      .force("link", d3.forceLink<NetworkNode, NetworkEdge>(networkData.edges).id((d: NetworkNode) => d.id).distance(50))
      .force("charge", d3.forceManyBody<NetworkNode>().strength(-300))
      .force("center", d3.forceCenter<NetworkNode>(width / 2, height / 2))
      .force("collision", d3.forceCollide<NetworkNode>().radius((d: NetworkNode) => getNodeSize(d) + 2))
      .on("tick", ticked);

    simulationRef.current = simulation;

    // Create edges
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(networkData.edges)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: NetworkEdge) => getEdgeWidth(d));

    // Create nodes
    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(networkData.nodes)
      .enter().append("circle")
      .attr("r", (d: NetworkNode) => getNodeSize(d))
      .attr("fill", (d: NetworkNode) => getNodeColor(d))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", interactive ? "pointer" : "default");

    // Add node labels
    const labels = container.append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(networkData.nodes.filter((d: NetworkNode) => d.publicationCount > 3)) // Only show labels for prolific authors
      .enter().append("text")
      .text((d: NetworkNode) => d.name.split(' ').slice(-1)[0]) // Show last name only
      .attr("font-size", 10)
      .attr("fill", "#333")
      .attr("text-anchor", "middle")
      .attr("dy", (d: NetworkNode) => getNodeSize(d) + 12)
      .style("pointer-events", "none");

    // Interactive behaviors
    if (interactive) {
      // Drag behavior
      node.call(d3.drag<SVGCircleElement, NetworkNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

      // Hover behavior
      node
        .on("mouseover", function(this: any, event: MouseEvent, d: NetworkNode) {
          d3.select(this)
            .attr("stroke", "#000")
            .attr("stroke-width", 3);
          
          if (tooltipElement) {
            showTooltip(tooltipElement, generateNodeTooltip(d), event);
          }
          
          // Highlight connected nodes
          const connectedNodes = new Set<string>();
          networkData.edges.forEach(edge => {
            const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
            
            if (sourceId === d.id || targetId === d.id) {
              connectedNodes.add(sourceId);
              connectedNodes.add(targetId);
            }
          });
          
          setHighlightedNodes(connectedNodes);
          
          // Highlight connected edges
          link.attr("stroke-opacity", (edge: NetworkEdge) => {
            const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
            const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
            return (sourceId === d.id || targetId === d.id) ? 1 : 0.2;
          });
          
          // Fade non-connected nodes
          node.attr("opacity", (node: NetworkNode) => connectedNodes.has(node.id) ? 1 : 0.3);
        })
        .on("mouseout", function(this: any, _event: MouseEvent, _d: NetworkNode) {
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);
          
          if (tooltipElement) {
            hideTooltip(tooltipElement);
          }
          
          setHighlightedNodes(new Set());
          
          // Restore default opacity
          link.attr("stroke-opacity", 0.6);
          node.attr("opacity", 1);
        })
        .on("click", function(_event: MouseEvent, d: NetworkNode) {
          setSelectedNode(d);
          onNodeClick?.(d);
        });
    }

    // Simulation tick function
    function ticked() {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: NetworkNode) => d.x)
        .attr("cy", (d: NetworkNode) => d.y);
      
      labels
        .attr("x", (d: NetworkNode) => d.x)
        .attr("y", (d: NetworkNode) => d.y);
    }

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>, d: NetworkNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>, d: NetworkNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Control simulation state
    if (!isSimulationRunning) {
      simulation.stop();
    }

  }, [networkData, getNodeColor, getNodeSize, getEdgeWidth, generateNodeTooltip, 
      interactive, isSimulationRunning, tooltip, onNodeClick]);

  const { containerRef, svgRef } = useResponsiveD3(renderNetwork, [networkData, selectedMetric, isSimulationRunning]);

  // Control functions
  const toggleSimulation = () => {
    setIsSimulationRunning(!isSimulationRunning);
    if (simulationRef.current) {
      if (isSimulationRunning) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.alphaTarget(0.3).restart();
      }
    }
  };

  const resetLayout = () => {
    if (simulationRef.current) {
      simulationRef.current.alpha(1).restart();
    }
  };

  const zoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().scaleBy as any, 1.5
    );
  };

  const zoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom().scaleBy as any, 0.75
    );
  };

  return (
    <div className="relative w-full">
      {/* Network Visualization */}
      <div ref={containerRef} className="w-full border border-gray-200 rounded-lg bg-white relative">
        <svg ref={svgRef} className="w-full" style={{ height: `${height}px` }} />
        
        {/* Control Panel */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Show/Hide Controls"
          >
            <Settings size={16} />
          </button>
          
          {showControls && (
            <div className="bg-white rounded-lg shadow-md p-2 space-y-1">
              <button
                onClick={toggleSimulation}
                className="w-full p-2 flex items-center justify-center gap-2 text-sm bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                title={isSimulationRunning ? "Pause Simulation" : "Start Simulation"}
              >
                {isSimulationRunning ? <Pause size={14} /> : <Play size={14} />}
                {isSimulationRunning ? "Pause" : "Play"}
              </button>
              
              <button
                onClick={resetLayout}
                className="w-full p-2 flex items-center justify-center gap-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                title="Reset Layout"
              >
                <RotateCcw size={14} />
                Reset
              </button>
              
              <button
                onClick={zoomIn}
                className="w-full p-2 flex items-center justify-center gap-2 text-sm bg-green-50 hover:bg-green-100 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={14} />
                Zoom In
              </button>
              
              <button
                onClick={zoomOut}
                className="w-full p-2 flex items-center justify-center gap-2 text-sm bg-red-50 hover:bg-red-100 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
                Zoom Out
              </button>
            </div>
          )}
        </div>
        
        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 left-4 bg-white rounded px-2 py-1 text-xs text-gray-600 shadow-sm">
          Zoom: {(zoomLevel * 100).toFixed(0)}%
        </div>
      </div>

      {/* Network Metrics */}
      {networkData.metrics && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-800">Authors</div>
            <div className="text-xl font-bold text-blue-900">{networkData.metrics.nodeCount}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-green-800">Collaborations</div>
            <div className="text-xl font-bold text-green-900">{networkData.metrics.edgeCount}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-purple-800">Network Density</div>
            <div className="text-xl font-bold text-purple-900">{(networkData.metrics.density * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-orange-800">Avg Connections</div>
            <div className="text-xl font-bold text-orange-900">{networkData.metrics.avgDegree.toFixed(1)}</div>
          </div>
        </div>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow border">
          <h4 className="font-semibold mb-2">Selected Author: {selectedNode.name}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Publications:</span> {selectedNode.publicationCount}
            </div>
            <div>
              <span className="font-medium">Collaborators:</span> {selectedNode.collaborationCount}
            </div>
          </div>
          {selectedNode.domains && (
            <div className="mt-2">
              <span className="font-medium text-sm">Research Domains:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedNode.domains.map(domain => (
                  <span key={domain} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {domain}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;