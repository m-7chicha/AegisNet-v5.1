
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Institution } from '../types';

interface SimulationPanelProps {
  institutions: Institution[];
  onIgnite: (targetId: string, shock: number) => void;
  failedNodes: Set<string>;
  onReset: () => void;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ institutions, onIgnite, failedNodes, onReset }) => {
  const [targetId, setTargetId] = useState('');
  const [shock, setShock] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBanks = useMemo(() => {
    if (!searchTerm) return institutions.slice(0, 10);
    return institutions.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.institution_id.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [institutions, searchTerm]);

  const totalAssetsAtRisk = useMemo(() => {
    let total = 0;
    failedNodes.forEach(id => {
      const inst = institutions.find(i => i.institution_id === id);
      if (inst) total += (inst.total_assets || 0);
    });
    return total;
  }, [failedNodes, institutions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left Column: The Trigger */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl h-full flex flex-col">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center">
            <i className="fas fa-radiation mr-3 text-red-500"></i>
            Control Room
          </h3>

          <div className="space-y-8 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-widest">Select Patient Zero</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search bank name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <div className="mt-2 max-h-40 overflow-y-auto bg-slate-900 rounded-xl border border-slate-800 custom-scroll">
                  {filteredBanks.map(bank => (
                    <button
                      key={bank.institution_id}
                      onClick={() => {
                        setTargetId(bank.institution_id);
                        setSearchTerm(bank.name);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-800 transition-colors ${targetId === bank.institution_id ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-400'}`}
                    >
                      {bank.name} <span className="text-[10px] opacity-50 ml-2">{bank.institution_id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Shock Magnitude</label>
                <span className="text-xl font-black text-red-500">{shock}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={shock}
                onChange={(e) => setShock(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between mt-2 text-[9px] text-slate-600 font-bold">
                <span>LIQUIDITY STRESS</span>
                <span>SOLVENCY CRASH</span>
              </div>
            </div>
          </div>

          <div className="pt-8 space-y-3">
            <button
              onClick={() => onIgnite(targetId, shock / 100)}
              disabled={!targetId}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center space-x-3 uppercase tracking-widest"
            >
              <i className="fas fa-bolt"></i>
              <span>Ignite Contagion</span>
            </button>
            <button
              onClick={onReset}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-widest"
            >
              Reset Simulation
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: The Aftermath */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Total Value Wiped</p>
            <p className="text-4xl font-black text-white">
              <span className="text-blue-500">$</span>{totalAssetsAtRisk.toFixed(1)} <span className="text-sm font-medium text-slate-500">B</span>
            </p>
          </div>
          <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Institutions Failed</p>
            <p className="text-4xl font-black text-red-500">
              {failedNodes.size}
            </p>
          </div>
        </div>

        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 flex-1 flex flex-col overflow-hidden">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Contagion Propagation Path</h4>
          <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-2">
            {failedNodes.size === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">
                No active contagion simulation.
              </div>
            ) : (
              Array.from(failedNodes).map((id, idx) => {
                const inst = institutions.find(i => i.institution_id === id);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={id}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-red-500/20"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-xs font-bold text-red-500">CASCADE {idx + 1}</span>
                      <span className="text-sm font-bold text-slate-200">{inst?.name || id}</span>
                    </div>
                    <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-1 rounded font-bold">INSOLVENT</span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationPanel;
