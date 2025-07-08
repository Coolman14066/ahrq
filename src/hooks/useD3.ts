import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * Custom hook for integrating D3.js with React components
 * Manages D3 lifecycle, SVG references, and cleanup
 */
export const useD3 = (
  renderChartFn: (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void,
  dependencies: any[]
) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      
      // Clear previous content
      svg.selectAll("*").remove();
      
      // Render the chart
      renderChartFn(svg);
    }
    
    // Cleanup function
    return () => {
      if (ref.current) {
        const svg = d3.select(ref.current);
        // Remove event listeners and stop any ongoing transitions
        svg.selectAll("*").interrupt();
        svg.selectAll("*").on("click", null);
        svg.selectAll("*").on("mouseover", null);
        svg.selectAll("*").on("mouseout", null);
      }
    };
  }, dependencies);

  return ref;
};

/**
 * Hook for responsive D3 visualizations that adapt to container size
 */
export const useResponsiveD3 = (
  renderChartFn: (
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    dimensions: { width: number; height: number }
  ) => void,
  dependencies: any[]
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width;
    const height = Math.max(400, width * 0.6); // Maintain aspect ratio

    // Set SVG dimensions
    svg.attr("width", width).attr("height", height);

    // Clear previous content
    svg.selectAll("*").remove();

    // Render with current dimensions
    renderChartFn(svg, { width, height });

    // Handle resize events
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      const newWidth = newRect.width;
      const newHeight = Math.max(400, newWidth * 0.6);

      svg.attr("width", newWidth).attr("height", newHeight);
      svg.selectAll("*").remove();
      renderChartFn(svg, { width: newWidth, height: newHeight });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup function
    return () => {
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").interrupt();
        svg.selectAll("*").on("click", null);
        svg.selectAll("*").on("mouseover", null);
        svg.selectAll("*").on("mouseout", null);
      }
      resizeObserver.disconnect();
    };
  }, dependencies);

  return { containerRef, svgRef };
};

/**
 * Utility function to create tooltips for D3 visualizations
 */
export const createTooltip = () => {
  return d3
    .select("body")
    .append("div")
    .attr("class", "d3-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("z-index", "1000");
};

/**
 * Utility function to position and show tooltip
 */
export const showTooltip = (
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
  content: string,
  event: MouseEvent
) => {
  tooltip
    .style("visibility", "visible")
    .html(content)
    .style("left", `${event.pageX + 10}px`)
    .style("top", `${event.pageY - 10}px`);
};

/**
 * Utility function to hide tooltip
 */
export const hideTooltip = (
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>
) => {
  tooltip.style("visibility", "hidden");
};