
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { Calendar, Info, TrendingUp, AlertTriangle } from 'lucide-react';

const INITIAL_SHAP_DATA = [
  { name: 'Leverage Ratio', value: 4.2 },
  { name: 'VIX Index', value: 2.8 },
  { name: 'CDS Spreads', value: 1.5 },
  { name: 'Centrality', value: 0.8 },
  { name: 'GDP Growth', value: -1.2 },
  { name: 'Liquidity Ratio', value: -3.5 },
];

const RISK_DRIVERS = [
  { rank: 1, factor: 'Excessive Interbank Leverage', impact: 'High' },
  { rank: 2, factor: 'Market Volatility Spikes', impact: 'High' },
  { rank: 3, factor: 'Credit Default Swap Contagion', impact: 'Med' },
  { rank: 4, factor: 'Regional Liquidity Gaps', impact: 'Med' },
  { rank: 5, factor: 'Global GDP Slowdown', impact: 'Low' },
];

const PredictionPage: React.FC = () => {
  const [targetDate, setTargetDate] = useState('2026-08-14');
  const [shapData, setShapData] = useState(INITIAL_SHAP_DATA);
  const [severity, setSeverity] = useState(7.4);
  const [prob3m, setProb3m] = useState(15.2);
  const [prob6m, setProb6m] = useState(28.4);

  // Simulation: randomize data slightly on date change
  useEffect(() => {
    const randomized = INITIAL_SHAP_DATA.map(item => ({
      ...item,
      value: item.value + (Math.random() - 0.5) * 1.5
    }));
    setShapData(randomized);
    setSeverity(Math.min(10, Math.max(0, 7.4 + (Math.random() - 0.5) * 2)));
    setProb3m(Math.min(100, Math.max(0, 15.2 + (Math.random() - 0.5) * 5)));
    setProb6m(Math.min(100, Math.max(0, 28.4 + (Math.random() - 0.5) * 10)));
  }, [targetDate]);

  const getSeverityLabel = (s: number) => {
    if (s <= 3) return { text: 'Light', color: 'text-green-500' };
    if (s <= 6) return { text: 'Moderate', color: 'text-orange-500' };
    return { text: 'Severe', color: 'text-red-500' };
  };

  const severityInfo = getSeverityLabel(severity);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Controls */}
      <div className="flex justify-between items-center bg-slate-800/40 p-8 rounded-[2rem] border border-slate-700/50">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Crisis Prediction & Explainability</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">SHAP-based local & global risk factor analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-black text-slate-500 uppercase">Target Horizon</label>
          <div className="relative group">
            <input 
              type="date" 
              value={targetDate} 
              onChange={(e) => setTargetDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 text-sm font-bold text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:border-blue-500 transition-all"
            />
            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-blue-500 transition-all" />
          </div>
        </div>
      </div>

      {/* Probability Cards (V5.1 Addition) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700/50 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Probability (Next 3 Months)</p>
            <p className="text-4xl font-black text-blue-500">{prob3m.toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-700/50 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Probability (Next 6 Months)</p>
            <p className="text-4xl font-black text-indigo-500">{prob6m.toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Severity Gauge */}
        <div className="lg:col-span-4 bg-slate-800/40 p-10 rounded-[2.5rem] border border-slate-700/50 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Systemic Severity Gauge</p>
          <div className="relative w-48 h-48 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-[12px] border-slate-800"></div>
             <div className="text-center">
                <span className="text-6xl font-black text-white">{severity.toFixed(1)}</span>
                <p className="text-[10px] font-bold text-slate-500">OUT OF 10</p>
             </div>
          </div>
          <p className={`mt-8 text-2xl font-black uppercase tracking-widest ${severityInfo.color}`}>{severityInfo.text}</p>
          <div className="mt-4 flex gap-1 justify-center w-full max-w-[200px]">
             {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < severity ? (severity > 6 ? 'bg-red-500' : 'bg-orange-500') : 'bg-slate-800'}`}></div>
             ))}
          </div>
        </div>

        {/* SHAP Tornado Chart */}
        <div className="lg:col-span-8 bg-slate-800/40 p-10 rounded-[2.5rem] border border-slate-700/50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Info size={14} className="text-blue-500" />
              Local Impact Analysis (SHAP)
            </h3>
            <span className="text-[9px] font-bold text-slate-500 uppercase">Impact on Current Prediction</span>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={shapData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight="bold" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(30, 41, 59, 0.4)' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '12px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {shapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#ef4444' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Risk Drivers (V5.1 Addition) */}
        <div className="lg:col-span-12 bg-slate-800/40 p-10 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Top 5 Crisis Risk Drivers
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-700/50">
            <table className="w-full text-left border-collapse bg-slate-900/40">
              <thead className="bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Rank</th>
                  <th className="px-8 py-5">Risk Factor</th>
                  <th className="px-8 py-5 text-right">Impact Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {RISK_DRIVERS.map((driver, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5 text-sm font-black text-slate-500">#{driver.rank}</td>
                    <td className="px-8 py-5 text-sm font-black text-slate-200">{driver.factor}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                        driver.impact === 'High' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                        driver.impact === 'Med' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                        'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {driver.impact}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;
