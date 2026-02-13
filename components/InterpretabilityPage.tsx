
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { Info, BarChart3, PieChart as PieIcon, List } from 'lucide-react';

const FEATURE_IMPORTANCE = [
  { variable: 'Interbank Exposure (Centrality)', importance: 0.92 },
  { variable: 'Leverage Ratio (Agg)', importance: 0.88 },
  { variable: 'VIX Market Volatility', importance: 0.84 },
  { variable: 'Liquidity Coverage Ratio', importance: 0.76 },
  { variable: 'CDS Spreads (G-SIB)', importance: 0.72 },
  { variable: 'GDP Growth Rate', importance: 0.61 },
  { variable: 'Total Assets (Systemic Size)', importance: 0.55 },
];

const GLOBAL_SHAP_VALUES = [
  { name: 'Leverage', value: 0.45 },
  { name: 'Market Contagion', value: 0.38 },
  { name: 'Liquidity Stress', value: 0.31 },
  { name: 'CDS Volatility', value: 0.22 },
  { name: 'Economic Cycle', value: 0.15 },
];

const SECTOR_DATA = [
  { name: 'Banking', value: 65, color: '#3b82f6' },
  { name: 'Insurance', value: 20, color: '#6366f1' },
  { name: 'Asset Management', value: 15, color: '#8b5cf6' },
];

const InterpretabilityPage: React.FC = () => {
  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="bg-slate-800/40 p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Global Model Interpretability</h2>
        <p className="text-xs text-slate-500 font-bold max-w-2xl">
          Analyzing the underlying risk architecture. These metrics provide transparency into how the AegisNet engine identifies systemic vulnerabilities across the entire financial ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Section 1: Global Feature Importance Table */}
        <div className="lg:col-span-6 bg-slate-800/40 p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <List size={16} className="text-blue-500" />
            Global Feature Importance
          </h3>
          <div className="overflow-hidden rounded-2xl border border-slate-700/50">
            <table className="w-full text-left border-collapse bg-slate-900/40">
              <thead className="bg-slate-900/60 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Variable</th>
                  <th className="px-6 py-4">Importance Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {FEATURE_IMPORTANCE.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-200">{row.variable}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${row.importance * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-black text-blue-400">{row.importance.toFixed(2)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Global SHAP Analysis Chart */}
        <div className="lg:col-span-6 bg-slate-800/40 p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            <BarChart3 size={16} className="text-indigo-500" />
            Average Absolute SHAP Values
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={GLOBAL_SHAP_VALUES} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight="black" 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(30, 41, 59, 0.4)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 3: Sector Risk Distribution (Moved from Prediction) */}
        <div className="lg:col-span-12 bg-slate-800/40 p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
            <PieIcon size={16} className="text-purple-500" />
            Systemic Risk Concentration by Sector
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={SECTOR_DATA}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {SECTOR_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {SECTOR_DATA.map(s => (
                <div key={s.name} className="bg-slate-900/40 p-6 rounded-2xl border border-slate-700/50 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-white">{s.name}</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">Aggregated Systemic Exposure</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black" style={{ color: s.color }}>{s.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterpretabilityPage;
