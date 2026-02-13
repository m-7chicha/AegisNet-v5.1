
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Institution, Exposure } from '../types';
import { COLORS } from '../constants';

interface NetworkGraphProps {
  nodes: Institution[];
  links: Exposure[];
  onNodeClick?: (id: string) => void;
  failedNodes?: Set<string>;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ nodes, links, onNodeClick, failedNodes }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Zoom behavior
    svg.call(d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
      g.attr('transform', event.transform);
    }));

    // Fixed: Used institution_id for simulation link indexing
    const simulation = d3.forceSimulation<any>(nodes)
      .force('link', d3.forceLink<any, any>(links).id(d => d.institution_id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', d => Math.sqrt(d.amount));

    // Fixed: Used total_assets and institution_id
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => Math.sqrt(d.total_assets) * 1.5 + 5)
      .attr('fill', d => {
        if (failedNodes?.has(d.institution_id)) return COLORS.critical;
        return d.riskScore > 75 ? COLORS.warning : COLORS.primary;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (event, d: any) => onNodeClick?.(d.institution_id));

    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.name)
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8')
      .attr('dx', 12)
      .attr('dy', 4);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node
        .attr('cx', d => (d as any).x)
        .attr('cy', d => (d as any).y);

      label
        .attr('x', d => (d as any).x)
        .attr('y', d => (d as any).y);
    });

    return () => simulation.stop();
  }, [nodes, links, failedNodes]);

  return (
    <div className="w-full h-full bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default NetworkGraph;