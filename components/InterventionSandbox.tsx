
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, Brain, ShieldAlert, CheckCircle, RefreshCcw, Landmark, Info } from 'lucide-react';
import { generateMockInstitutions } from '../constants';
import { Institution } from '../types';

const InterventionSandbox: React.FC = () => {
  // 1. State Management
  const [mode, setMode] = useState<'MANUAL' | 'AI'>('MANUAL');
  const [targetId, setTargetId] = useState<string>('INST-0001');
  
  // Regulatory Control States
  const [capitalBuffer, setCapitalBuffer] = useState(2.5);
  const [exposureReduction, setExposureReduction] = useState(15);
  const [liquidityInjection, setLiquidityInjection] = useState(250);
  const [capEnforcement, setCapEnforcement] = useState(true);
  const [tradingRestriction, setTradingRestriction] = useState(false);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<{ before: any, after: any } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Institution list for target selection
  const institutions = useMemo(() => generateMockInstitutions(), []);
  const selectedInstitution = useMemo(() => 
    institutions.find(i => i.institution_id === targetId) || institutions[0]
  , [targetId, institutions]);

  // 2. The Weighted Impact Algorithm
  const runTargetedSimulation = () => {
    if (!selectedInstitution && mode === 'MANUAL') {
      alert("Please select a target institution first.");
      return;
    }

    setIsSimulating(true);
    
    // Simulate thinking time for engine
    setTimeout(() => {
      // BASELINE VALUES (Global Risk Profile)
      const baselineProb = 85;
      const baselineLoss = 89;
      const baselineFailures = 12;

      let reductionPercentage = 0;

      if (mode === 'AI') {
        // AI Mode: Global Maximum Intervention Protocol
        // Optimized for system-wide coverage
        reductionPercentage = 42.5; // High fixed reduction for "Optimal rescue"
      } else {
        // MANUAL Mode: Targeted Intervention Logic (V5.1 Formula)
        
        // STEP 1: Calculate the "Power" of the Policy Intervention
        const policyIntensity =
          (capitalBuffer * 1.5) +             // Strongest lever
          (exposureReduction * 0.8) +         // Moderate lever
          (liquidityInjection / 500);         // $500B = 1 unit of impact

        // STEP 2: Calculate the "Systemic Weight" of the Target Bank
        // Normalize assets against a baseline of $500B.
        const assetValue = selectedInstitution.total_assets || 500;
        const systemicWeight = assetValue / 500;

        // STEP 3: Compute Final Risk Reduction %
        reductionPercentage = policyIntensity * systemicWeight;

        // STEP 4: Apply Constraints (Realism)
        if (reductionPercentage > 45) reductionPercentage = 45;
        if (reductionPercentage < 0.1) reductionPercentage = 0.1;
      }

      // STEP 5: Update the "After" Results
      setResults({
        before: { prob: baselineProb, loss: baselineLoss, failures: baselineFailures },
        after: { 
          prob: Math.max(0, baselineProb - reductionPercentage), 
          loss: Math.max(0, baselineLoss - (reductionPercentage * 1.5)), 
          failures: Math.max(0, Math.floor(baselineFailures - (reductionPercentage / 5)))
        }
      });

      // STEP 6: Update the Feedback
      if (mode === 'MANUAL') {
        const assetValue = selectedInstitution.total_assets || 500;
        const systemicWeight = assetValue / 500;
        setSuccessMessage(
          `Targeted intervention on ${selectedInstitution.name} reduced systemic tail-risk by ${reductionPercentage.toFixed(1)}% due to its ${systemicWeight > 1.5 ? 'high' : 'moderate'} network centrality.`
        );
      } else {
        setSuccessMessage("AI Strategy Applied: Maximum Intervention Protocol. Global risk floor established.");
      }

      setIsSimulating(false);
    }, 1200);
  };

  // 3. Mode Toggle Logics
  const applyAIStrategy = () => {
    setMode('AI');
    setResults(null);
    setCapitalBuffer(8.5);
    setExposureReduction(40);
    setLiquidityInjection(500);
    setCapEnforcement(true);
    setTradingRestriction(true);
    // Auto run after delay
    setTimeout(() => runTargetedSimulation(), 50);
  };

  const switchToManual = () => {
    setMode('MANUAL');
    setResults(null);
    setSuccessMessage(null);
    setCapitalBuffer(2.5);
    setExposureReduction(15);
    setLiquidityInjection(250);
    setCapEnforcement(true);
    setTradingRestriction(false);
  };

  const chartData = results ? [
    { name: 'Crisis Prob (%)', before: results.before.prob, after: results.after.prob },
    { name: 'Systemic Loss ($T)', before: results.before.loss, after: results.after.loss },
  ] : [];

  const isLocked = mode === 'AI';
  const labelSuffix = mode === 'MANUAL' ? ' (Targeted)' : ' (Global)';

  return (
    <div className="space-y-8 animate-fadeIn h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* Regulatory Toolkit Panel */}
        <div className={`lg:col-span-5 bg-slate-800/40 p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl flex flex-col transition-all duration-500 ${isLocked ? 'ring-2 ring-blue-500/30 bg-slate-800/60' : ''}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Settings size={16} className="text-blue-500" />
              Regulatory Toolkit
            </h3>
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-700 shadow-inner">
               <button 
                  onClick={applyAIStrategy}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${mode === 'AI' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
               >
                  <Brain size={12} /> AI RECOMMENDED
               </button>
               <button 
                  onClick={switchToManual}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'MANUAL' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
               >
                  MANUAL MODE
               </button>
            </div>
          </div>

          {/* Target Institution Selection (Manual Mode Only) */}
          <div className={`mb-10 transition-all duration-500 ${isLocked ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}`}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 flex items-center gap-2">
              <Landmark size={12} className="text-blue-500" />
              Target Institution
            </label>
            <div className="relative group">
              <select 
                value={targetId} 
                onChange={(e) => {
                  setTargetId(e.target.value);
                  setResults(null);
                  setSuccessMessage(null);
                }}
                disabled={isLocked}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none shadow-inner transition-all"
              >
                {institutions.map(inst => (
                  <option key={inst.institution_id} value={inst.institution_id}>
                    {inst.name} (${Math.round(inst.total_assets)}B Assets)
                  </option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <i className="fas fa-chevron-down text-xs"></i>
              </div>
            </div>
            <p className="text-[9px] text-slate-600 font-bold uppercase mt-3 tracking-tighter flex items-center gap-1">
              <Info size={10} />
              Intervention potency scales with systemic asset value ($500B Baseline)
            </p>
          </div>

          {/* Parameter Sliders */}
          <div className={`space-y-8 flex-1 transition-all duration-500 ${isLocked ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <div>
              <div className="flex justify-between mb-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Increase Capital Buffer{labelSuffix}</label>
                <span className={`text-xs font-black transition-colors ${isLocked ? 'text-blue-400' : 'text-white'}`}>{capitalBuffer.toFixed(1)}%</span>
              </div>
              <input 
                type="range" min="0" max="20" step="0.5" value={capitalBuffer}
                disabled={isLocked}
                onChange={(e) => setCapitalBuffer(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between mb-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reduce Exposure{labelSuffix}</label>
                <span className={`text-xs font-black transition-colors ${isLocked ? 'text-indigo-400' : 'text-white'}`}>{exposureReduction}%</span>
              </div>
              <input 
                type="range" min="0" max="50" value={exposureReduction}
                disabled={isLocked}
                onChange={(e) => setExposureReduction(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Liquidity Injection ($B){labelSuffix}</label>
              <input 
                type="number" value={liquidityInjection}
                disabled={isLocked}
                onChange={(e) => setLiquidityInjection(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
              />
            </div>

            <div className={`flex items-center justify-between p-5 bg-slate-900/40 rounded-3xl border transition-all ${isLocked ? 'border-blue-500/20' : 'border-slate-700/50'}`}>
               <p className="text-xs font-black text-slate-200">Systemic Cap Enforcement</p>
               <button 
                  disabled={isLocked}
                  onClick={() => setCapEnforcement(!capEnforcement)}
                  className={`w-12 h-6 rounded-full transition-all relative ${capEnforcement ? 'bg-emerald-600' : 'bg-slate-700'}`}
               >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${capEnforcement ? 'left-7' : 'left-1'}`} />
               </button>
            </div>
          </div>

          <button 
            onClick={runTargetedSimulation}
            disabled={isSimulating || (isLocked && results !== null)}
            className={`mt-10 w-full font-black py-5 rounded-[2rem] shadow-xl transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 ${
              isLocked ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
            }`}
          >
            {isSimulating ? <RefreshCcw size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
            {isSimulating ? "COMPUTING IMPACT..." : isLocked ? "AI PROTOCOL RUNNING" : "RUN TARGETED SIMULATION"}
          </button>
        </div>

        {/* Impact Analysis Panel */}
        <div className="lg:col-span-7 space-y-8 flex flex-col min-h-0">
           <div className="bg-slate-800/40 p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10">System-Wide Risk Delta</h3>
              
              <div className="grid grid-cols-3 gap-6 mb-10">
                 {[
                   { label: 'Crisis Prob (%)', before: results?.before.prob + '%', after: results?.after.prob.toFixed(1) + '%' },
                   { label: 'Systemic Loss ($T)', before: '$' + results?.before.loss + 'T', after: '$' + (results?.after.loss || 0).toFixed(1) + 'T' },
                   { label: 'Bank Failures', before: results?.before.failures, after: results?.after.failures },
                 ].map((stat, i) => (
                    <div key={i} className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-700/50 flex flex-col items-center justify-center text-center">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 h-8 flex items-center">{stat.label}</p>
                       <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-slate-600 line-through opacity-40">{results ? stat.before : '---'}</span>
                          <span className={`text-3xl font-black ${results ? (mode === 'AI' ? 'text-emerald-500' : 'text-blue-500') : 'text-slate-700'}`}>
                            {results ? stat.after : '---'}
                          </span>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="flex-1 min-h-0">
                {results ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontWeight="black" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '16px' }}
                        itemStyle={{ fontWeight: 'black', fontSize: '11px', color: '#f8fafc' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ color: '#f1f5f9', paddingTop: '20px' }} />
                      <Bar dataKey="before" fill="#334155" radius={[6, 6, 0, 0]} name="Baseline Risk Profile" />
                      <Bar dataKey="after" radius={[6, 6, 0, 0]} name="Post-Intervention Profile">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={mode === 'AI' ? '#10b981' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/20">
                    <ShieldAlert size={64} className="mb-6 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-[0.3em] opacity-30">Awaiting Simulation Parameters</p>
                  </div>
                )}
              </div>
           </div>

           <AnimatePresence>
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`border-2 p-8 rounded-[3rem] flex items-center gap-8 shadow-2xl transition-all ${mode === 'AI' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-900/10' : 'bg-blue-500/10 border-blue-500/30 shadow-blue-900/10'}`}
              >
                  <div className={`p-5 rounded-3xl ${mode === 'AI' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>
                    {mode === 'AI' ? <Brain size={32} /> : <CheckCircle size={32} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className={`text-xl font-black ${mode === 'AI' ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {mode === 'AI' ? "AI PROTOCOL OPTIMIZED" : "INTERVENTION SUCCESS"}
                      </h4>
                      {mode === 'AI' && <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Global Rescue</span>}
                    </div>
                    <p className={`text-sm font-medium leading-relaxed ${mode === 'AI' ? 'text-emerald-500/80' : 'text-slate-400'}`}>
                      {successMessage}
                    </p>
                  </div>
              </motion.div>
            )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InterventionSandbox;
