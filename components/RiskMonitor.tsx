
import React from 'react';
import { motion } from 'framer-motion';
import { Institution, CrisisPrediction } from '../types';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface RiskMonitorProps {
  institutions: Institution[];
  predictions: CrisisPrediction[];
}

const getRiskColorClass = (score: number) => {
  if (score >= 61) return 'text-red-500';
  if (score >= 31) return 'text-orange-500';
  return 'text-green-500';
};

const getRiskBgClass = (score: number) => {
  if (score >= 61) return 'bg-red-500';
  if (score >= 31) return 'bg-orange-500';
  return 'bg-green-500';
};

const CircularGauge: React.FC<{ value: number }> = ({ value }) => {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  const getColor = (v: number) => {
    if (v >= 61) return '#ef4444'; // Red
    if (v >= 31) return '#f97316'; // Orange
    return '#22c55e'; // Green
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="128" cy="128" r={radius}
          stroke="currentColor" strokeWidth="12"
          fill="transparent" className="text-slate-800"
        />
        <motion.circle
          cx="128" cy="128" r={radius}
          stroke={getColor(value)} strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-black text-white">{Math.round(value)}%</span>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Overall Risk Index</span>
      </div>
    </div>
  );
};

const RiskMonitor: React.FC<RiskMonitorProps> = ({ institutions, predictions }) => {
  const currentRisk = predictions[predictions.length - 1]?.probability * 100 || 42;
  const prob3m = predictions[Math.min(predictions.length - 1, 3)]?.probability * 100 || 28;
  const prob6m = predictions[Math.min(predictions.length - 1, 6)]?.probability * 100 || 35;

  const sortedNodes = [...institutions].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Top Section: Systemic Risk Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center bg-slate-800/40 p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700/50 mb-4 w-full text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">T+3 Probability</p>
            <p className="text-4xl font-black text-blue-500">{prob3m.toFixed(1)}%</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700/50 w-full text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">T+6 Probability</p>
            <p className="text-4xl font-black text-indigo-500">{prob6m.toFixed(1)}%</p>
          </div>
        </div>

        <div className="flex justify-center order-first lg:order-none">
          <CircularGauge value={currentRisk} />
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Status Summary</h3>
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-200">Critical Exposures Detected</p>
              <p className="text-[10px] text-slate-500">High-risk threshold breached</p>
            </div>
          </div>
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700/50 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-200">Liquidity Stabilized</p>
              <p className="text-[10px] text-slate-500">Aggregate buffer within safe zones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Leaderboard */}
      <div className="bg-slate-800/40 rounded-[3rem] border border-slate-700/50 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-700/50 flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Systemic Risk Leaderboard</h2>
          <span className="text-[10px] font-black text-slate-500 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">LIVE FEED • FEB 2026</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Rank</th>
                <th className="px-8 py-5">Institution</th>
                <th className="px-8 py-5">Risk Score</th>
                <th className="px-8 py-5">CDS Spread</th>
                <th className="px-8 py-5">Leverage</th>
                <th className="px-8 py-5">Centrality</th>
                <th className="px-8 py-5">Liquidity %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {sortedNodes.slice(0, 15).map((node, idx) => (
                <tr key={node.institution_id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6 text-sm font-black text-slate-500">#{idx + 1}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white group-hover:text-blue-400 transition-colors cursor-pointer">{node.name}</span>
                      <span className="text-[10px] font-mono text-slate-600 uppercase">{node.institution_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getRiskBgClass(node.riskScore)}`} 
                          style={{ width: `${node.riskScore}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-black ${getRiskColorClass(node.riskScore)}`}>
                        {node.riskScore.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-slate-300">{(node.cds_spread || 0).toFixed(0)} bps</td>
                  <td className="px-8 py-6 text-sm font-black text-slate-300">{(node.leverage_ratio || 0).toFixed(1)}x</td>
                  <td className="px-8 py-6 text-sm font-black text-blue-500">{(node.centrality || 0).toFixed(3)}</td>
                  <td className="px-8 py-6 text-sm font-black text-slate-300">{((node.liquidity_ratio || 0) * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskMonitor;
