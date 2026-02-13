
import React, { useState, useMemo, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Zap, ShieldAlert, Binary, RefreshCcw, Landmark, ArrowRight } from 'lucide-react';
import { Institution, Exposure } from '../types';

interface SystemicSimulatorProps {
  institutions: Institution[];
  exposures: Exposure[];
  onSimulationComplete?: (data: { loss: number; failures: number; active: boolean }) => void;
}

interface SimResult {
  failedNodes: Set<string>;
  rounds: string[][];
  totalLoss: number;
  depth: number;
}

const SystemicSimulator: React.FC<SystemicSimulatorProps> = ({ 
  institutions, 
  exposures, 
  onSimulationComplete 
}) => {
  const [patientZero, setPatientZero] = useState<string>('');
  const [lgd, setLgd] = useState<number>(1.0);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // 1. Simulation Logic (Furfine Algorithm)
  const runSimulation = (startId: string, shock: number) => {
    if (!startId) return;
    setIsRunning(true);
    
    // Simulate thinking time for impact
    setTimeout(() => {
      const failed = new Set<string>([startId]);
      const rounds: string[][] = [[startId]];
      let currentFailed = [startId];
      
      // Initial state: Equity = Assets / Leverage
      const state = institutions.map(i => ({
        id: i.institution_id,
        equity: (i.total_assets || 100) / (i.leverage_ratio || 15),
        assets: i.total_assets || 0
      }));

      let depth = 0;
      while (currentFailed.length > 0 && depth < 20) {
        const nextFailures: string[] = [];
        
        currentFailed.forEach(fId => {
          // Identify creditors: who lent money TO the failed institution?
          // link.target is the debtor (one who failed), link.source is the creditor (one affected)
          const affectedLinks = exposures.filter(e => e.target === fId);
          
          affectedLinks.forEach(link => {
            if (failed.has(link.source)) return;
            
            const creditor = state.find(s => s.id === link.source);
            if (creditor) {
              const loss = (link.amount || 0) * shock;
              creditor.equity -= loss;
              
              if (creditor.equity <= 0) {
                nextFailures.push(link.source);
                failed.add(link.source);
              }
            }
          });
        });

        if (nextFailures.length === 0) break;
        rounds.push(nextFailures);
        currentFailed = nextFailures;
        depth++;
      }

      const totalLoss = Array.from(failed).reduce((sum, id) => {
        const inst = institutions.find(i => i.institution_id === id);
        return sum + (inst?.total_assets || 0);
      }, 0);

      setSimResult({ failedNodes: failed, rounds, totalLoss, depth });
      setIsRunning(false);
      
      // CRITICAL: Notify parent about simulation results
      onSimulationComplete?.({
        loss: totalLoss,
        failures: failed.size,
        active: true
      });
    }, 600);
  };

  const handleReset = () => {
    setSimResult(null);
    setPatientZero('');
    onSimulationComplete?.({
      loss: 0,
      failures: 0,
      active: false
    });
  };

  // 2. Data Processing for Visualizer (Spiderweb Fix)
  const graphData = useMemo(() => {
    // We filter for top nodes and any that are involved in the contagion
    const top50 = [...institutions]
      .sort((a, b) => (b.total_assets || 0) - (a.total_assets || 0))
      .slice(0, 50);
    
    const activeIds = new Set(top50.map(i => i.institution_id));
    if (simResult) {
      simResult.failedNodes.forEach(id => activeIds.add(id));
      // Also add banks that have links to failed nodes to show the immediate risk
      exposures.forEach(e => {
        if (simResult.failedNodes.has(e.target) || simResult.failedNodes.has(e.source)) {
          activeIds.add(e.source);
          activeIds.add(e.target);
        }
      });
    }

    const filteredNodes = institutions.filter(i => activeIds.has(i.institution_id));
    const nodeIds = new Set(filteredNodes.map(i => i.institution_id));

    // CRITICAL: Ensure links point to existing node IDs
    const filteredLinks = exposures
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({
        ...e,
        // D3 expects source/target to match the nodeId
        source: e.source,
        target: e.target
      }));

    return { nodes: filteredNodes, links: filteredLinks };
  }, [institutions, exposures, simResult]);

  // 3. Systemic Threats for Leaderboard
  const threats = useMemo(() => {
    return institutions
      .slice(0, 50)
      .map(inst => {
        const creditorsCount = exposures.filter(e => e.target === inst.institution_id).length;
        const totalDebt = exposures.filter(e => e.target === inst.institution_id).reduce((s, e) => s + e.amount, 0);
        return {
          id: inst.institution_id,
          name: inst.name,
          score: (inst.total_assets / 100) * (creditorsCount || 1),
          assets: inst.total_assets,
          creditors: creditorsCount,
          totalDebt: totalDebt
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [institutions, exposures]);

  const topBanksForSelect = useMemo(() => {
    return [...institutions]
      .sort((a, b) => (b.total_assets || 0) - (a.total_assets || 0))
      .slice(0, 50);
  }, [institutions]);

  return (
    <div className="flex flex-col h-full gap-6 select-none">
      {/* Control Station */}
      <div className="bg-slate-800/60 backdrop-blur-2xl border border-slate-700 p-8 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-8 shadow-2xl">
        <div className="flex items-center gap-12 flex-1 min-w-[450px]">
          <div className="flex-1">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
              <Landmark size={12} className="text-blue-500" />
              Patient Zero Selection
            </label>
            <div className="relative group">
              <select
                value={patientZero}
                onChange={(e) => setPatientZero(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>Choose target for collapse...</option>
                {topBanksForSelect.map(b => (
                  <option key={b.institution_id} value={b.institution_id}>
                    {b.institution_id} - {b.name} (${Math.round(b.total_assets)}B Assets)
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-blue-500 transition-colors">
                <Zap size={16} />
              </div>
            </div>
          </div>
          
          <div className="w-[280px]">
            <div className="flex justify-between items-end mb-3">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <ShieldAlert size={12} className="text-amber-500" />
                LGD Severity Shock
              </label>
              <span className="text-xs font-black text-blue-400 font-mono">{Math.round(lgd * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.05" value={lgd} 
              onChange={(e) => setLgd(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-black px-8 py-4 rounded-2xl transition-all uppercase tracking-widest text-xs border border-slate-600/50"
          >
            <RefreshCcw size={14} />
            Reset
          </button>
          <button 
            onClick={() => runSimulation(patientZero, lgd)}
            disabled={!patientZero || isRunning}
            className="group flex items-center gap-3 bg-red-600 hover:bg-red-500 disabled:opacity-20 text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-red-900/40 transition-all uppercase tracking-widest text-sm"
          >
            {isRunning ? (
              <RefreshCcw className="animate-spin" size={18} />
            ) : (
              <Zap className="group-hover:scale-125 transition-transform" size={18} />
            )}
            <span>{isRunning ? 'Propagating...' : 'Execute Stress Test'}</span>
          </button>
        </div>
      </div>

      {/* Impact Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Failed Nodes', value: simResult?.failedNodes.size || 0, color: 'text-red-500', icon: AlertCircle },
          { label: 'Wiped Assets', value: `$${(simResult?.totalLoss || 0).toFixed(1)}B`, color: 'text-white', icon: Landmark },
          { label: 'Cascade Depth', value: simResult?.depth || 0, color: 'text-amber-500', icon: ArrowRight },
          { label: 'Systemic Fragility', value: `${((simResult?.totalLoss || 0) / institutions.reduce((a, b) => a + (b.total_assets || 0), 0) * 100).toFixed(1)}%`, color: 'text-blue-500', icon: ShieldAlert }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-slate-800/40 border border-slate-700 p-6 rounded-3xl relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-default"
          >
            <stat.icon size={80} className="absolute -right-6 -bottom-6 text-slate-700/10 group-hover:text-slate-700/20 transition-all rotate-12" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              {stat.label}
            </p>
            <p className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Domino Web Visualizer */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden relative shadow-inner">
          <ForceGraph2D
            graphData={graphData}
            nodeId="institution_id"
            nodeRelSize={4}
            nodeVal={d => Math.log10((d.total_assets || 10) + 1) * 8}
            nodeLabel={node => `
              <div style="background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); border: 1px solid #1e293b; padding: 16px; border-radius: 20px; font-family: 'Inter', sans-serif; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); min-width: 220px;">
                <div style="font-weight: 900; color: #f8fafc; font-size: 15px; margin-bottom: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span>${node.name}</span>
                  <span style="font-size: 10px; opacity: 0.5; font-family: monospace;">${node.institution_id}</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #64748b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">Total Assets:</span>
                    <span style="color: #3b82f6; font-weight: 900; font-size: 13px;">$${Math.round(node.total_assets)}B</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #64748b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">Leverage Ratio:</span>
                    <span style="color: #f59e0b; font-weight: 900; font-size: 13px;">${(node.leverage_ratio || 0).toFixed(1)}x</span>
                  </div>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #64748b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em;">Solvency Status:</span>
                    <span style="color: ${simResult?.failedNodes.has(node.institution_id) ? '#ef4444' : '#10b981'}; font-weight: 900; font-size: 10px; background: ${simResult?.failedNodes.has(node.institution_id) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; padding: 4px 10px; border-radius: 8px; border: 1px solid ${simResult?.failedNodes.has(node.institution_id) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'};">
                      ${simResult?.failedNodes.has(node.institution_id) ? 'FAILED' : 'SOLVENT'}
                    </span>
                  </div>
                </div>
              </div>
            `}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const r = Math.log10((node.total_assets || 10) + 1) * 2.8;
              const isFailed = simResult?.failedNodes.has(node.institution_id);
              const isZero = node.institution_id === patientZero;
              
              // Shadow/Glow
              if (isZero || isFailed) {
                ctx.shadowColor = isZero ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)';
                ctx.shadowBlur = 15 / globalScale;
              }

              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
              ctx.fillStyle = isZero ? '#3b82f6' : isFailed ? '#ef4444' : '#1e293b';
              ctx.fill();

              ctx.shadowBlur = 0; // Reset shadow

              // Border
              if (isFailed || isZero) {
                 ctx.strokeStyle = isZero ? '#60a5fa' : '#f87171';
                 ctx.lineWidth = 2 / globalScale;
                 ctx.stroke();
              }

              // Patient Zero Pulse
              if (isZero) {
                const pulse = (Math.sin(Date.now() / 200) + 1) / 2;
                ctx.beginPath();
                ctx.arc(node.x, node.y, r + (pulse * 8 / globalScale), 0, 2 * Math.PI, false);
                ctx.strokeStyle = `rgba(59, 130, 246, ${0.8 - pulse})`;
                ctx.lineWidth = 1 / globalScale;
                ctx.stroke();
              }
              
              // Labels on zoom
              if (globalScale > 2) {
                const fontSize = 11 / globalScale;
                ctx.font = `bold ${fontSize}px Inter`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = '#64748b';
                ctx.fillText(node.name.split(' ')[1] || node.name, node.x, node.y + r + 3);
              }
            }}
            linkWidth={1.5}
            linkColor={link => {
              const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).institution_id;
              const targetId = typeof link.target === 'string' ? link.target : (link.target as any).institution_id;
              
              const sourceFailed = simResult?.failedNodes.has(sourceId);
              const targetFailed = simResult?.failedNodes.has(targetId);
              
              // Contagion Path Fix: Both ends failed = Bright Red
              return sourceFailed && targetFailed ? '#ef4444' : '#334155';
            }}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={link => {
               const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).institution_id;
               const targetId = typeof link.target === 'string' ? link.target : (link.target as any).institution_id;
               return simResult?.failedNodes.has(sourceId) && simResult?.failedNodes.has(targetId) ? '#ef4444' : '#475569';
            }}
            backgroundColor="#0f172a"
          />
          <div className="absolute top-8 left-8 flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl px-6 py-3 rounded-2xl border border-slate-800 shadow-2xl pointer-events-none">
             <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-100"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-200"></div>
             </div>
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Contagion Network Monitoring</span>
          </div>
        </div>

        {/* Systemic Threat Index */}
        <div className="lg:col-span-4 bg-slate-800/20 border border-slate-700/50 rounded-[3rem] p-10 flex flex-col shadow-2xl overflow-hidden group">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
              <Landmark size={16} className="text-blue-500" />
              High Priority Exposure
            </h3>
            <span className="text-[9px] text-slate-500 font-bold uppercase bg-slate-900 px-4 py-1.5 rounded-full border border-slate-700">Audit Rank</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 custom-scroll pr-4">
            {threats.map((rank, i) => (
              <motion.div 
                key={rank.id} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ x: 5, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                onClick={() => { setPatientZero(rank.id); setSimResult(null); }}
                className={`relative bg-slate-900/40 border border-slate-800/50 p-5 rounded-2xl transition-all cursor-pointer ${patientZero === rank.id ? 'border-blue-500/50 ring-2 ring-blue-500/10 bg-blue-500/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-600 w-5">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-xs font-black text-slate-200">{rank.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Binary size={10} className="text-slate-600" />
                        <p className="text-[9px] text-slate-600 font-mono uppercase">${Math.round(rank.assets)}B Assets</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black ${rank.score > 150 ? 'text-red-500' : 'text-amber-500'}`}>
                      {rank.score > 150 ? 'G-SIB' : 'D-SIB'}
                    </p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                       <p className="text-[9px] text-slate-500 font-bold">{rank.creditors} Creditors</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-700/50">
             <div className="flex items-center justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest">
                <span>Network Integrity</span>
                <span className="text-emerald-500">98.2%</span>
             </div>
             <div className="h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-emerald-500 w-[98.2%]"></div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemicSimulator;
