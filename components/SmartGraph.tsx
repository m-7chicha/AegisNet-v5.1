
import React, { useMemo, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Institution, Exposure } from '../types';
import { COLORS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartGraphProps {
  nodes: Institution[];
  links: Exposure[];
  failedNodes?: Set<string>;
  onNodeClick?: (id: string) => void;
}

const SmartGraph: React.FC<SmartGraphProps> = ({ nodes, links, failedNodes, onNodeClick }) => {
  const [selectedNode, setSelectedNode] = useState<Institution | null>(null);

  // Intelligent Filtering Logic
  const graphData = useMemo(() => {
    if (!nodes || nodes.length === 0) return { nodes: [], links: [] };

    // 1. Sort by total_assets to find Systemic Core
    const sortedByAssets = [...nodes].sort((a, b) => (b.total_assets || 0) - (a.total_assets || 0));
    const systemicCore = sortedByAssets.slice(0, 200);
    const systemicCoreIds = new Set(systemicCore.map(n => n.institution_id));

    // 2. Identify Danger Zone nodes (Risk > 80%)
    const dangerZone = nodes.filter(n => (n.riskScore || 0) > 80 && !systemicCoreIds.has(n.institution_id));
    
    // 3. Combined Active Set
    const filteredNodes = [...systemicCore, ...dangerZone];
    const filteredNodeIds = new Set(filteredNodes.map(n => n.institution_id));

    // 4. Identify Top 10 for explicit labeling
    const top10Ids = new Set(sortedByAssets.slice(0, 10).map(n => n.institution_id));

    // 5. Filter links between the active set
    // IMPORTANT: We extract the IDs back to strings to prevent D3 object reference errors 
    // when data is refreshed or processed multiple times.
    const filteredLinks = links
      .filter(l => {
        const sourceId = typeof l.source === 'string' ? l.source : (l.source as any).institution_id;
        const targetId = typeof l.target === 'string' ? l.target : (l.target as any).institution_id;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId) && (l.amount || 0) > 5;
      })
      .map(l => ({
        ...l,
        source: typeof l.source === 'string' ? l.source : (l.source as any).institution_id,
        target: typeof l.target === 'string' ? l.target : (l.target as any).institution_id
      }));

    // Attach visibility flag for labeling
    const nodesWithLabelConfig = filteredNodes.map(n => ({
      ...n,
      showLabel: top10Ids.has(n.institution_id)
    }));

    return { nodes: nodesWithLabelConfig, links: filteredLinks };
  }, [nodes, links]);

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
      <ForceGraph2D
        graphData={graphData}
        nodeId="institution_id" // CRITICAL: Map the internal D3 ID to our identifier
        nodeLabel={(node: any) => `${node.name || 'Bank'} (Risk: ${(node.riskScore || 0).toFixed(1)}%)`}
        nodeRelSize={4}
        // Logarithmic scale to prevent massive overlaps
        nodeVal={(node: any) => Math.log10((node.total_assets || 10) + 1) * 8}
        nodeColor={(node: any) => {
          if (failedNodes?.has(node.institution_id)) return '#ef4444'; // Red for failed
          const risk = node.riskScore || 0;
          // Gradient logic: Green -> Yellow -> Red
          return risk > 75 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#10b981';
        }}
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          const risk = node.riskScore || 0;
          const color = failedNodes?.has(node.institution_id) ? '#ef4444' : risk > 75 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#10b981';
          const r = Math.log10((node.total_assets || 10) + 1) * 2;

          // Draw circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
          
          // Draw label only for top nodes or when zoomed in
          if (node.showLabel || globalScale > 2) {
            ctx.font = `${fontSize}px Inter`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#f8fafc';
            ctx.fillText(label, node.x, node.y + r + fontSize);
          }
        }}
        linkColor={() => 'rgba(51, 65, 85, 0.4)'}
        linkWidth={(link: any) => Math.sqrt(link.amount || 1) / 3}
        linkDirectionalArrowLength={2}
        linkDirectionalArrowRelPos={1}
        backgroundColor="#0f172a"
        onNodeClick={(node: any) => {
          setSelectedNode(node);
          onNodeClick?.(node.institution_id);
        }}
      />

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-6 right-6 w-72 bg-slate-800/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-700 shadow-2xl z-20"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">{selectedNode.name || 'Unknown'}</h3>
                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">{selectedNode.institution_id}</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                <i className="fas fa-times text-slate-400"></i>
              </button>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Risk Factor</p>
                  <p className={`text-sm font-black ${(selectedNode.riskScore || 0) > 70 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {(selectedNode.riskScore || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Total Assets</p>
                  <p className="text-sm font-black text-blue-400">
                    ${(selectedNode.total_assets || 0).toFixed(0)}B
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 space-y-3">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">Leverage</span>
                    <span className="text-slate-200 font-black">{(selectedNode.leverage_ratio || 0).toFixed(1)}x</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">Liquidity</span>
                    <span className="text-slate-200 font-black">{(selectedNode.liquidity_ratio || 0).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase">CDS Spread</span>
                    <span className="text-slate-200 font-black">{(selectedNode.cds_spread || 0).toFixed(0)} bps</span>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-6 flex space-x-6 text-[9px] uppercase font-black text-slate-500 tracking-[0.2em] bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div> Stable</div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div> Vulnerable</div>
        <div className="flex items-center"><div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div> Critical</div>
      </div>
    </div>
  );
};

export default SmartGraph;
