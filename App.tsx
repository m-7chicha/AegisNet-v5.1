
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Label
} from 'recharts';
import Papa from 'papaparse';
import { 
  Institution, Exposure, CrisisLabel, ViewType, MarketData, ExposureNetwork, InstitutionMetrics, CrisisPrediction 
} from './types';
import { 
  COLORS 
} from './constants';
import SmartGraph from './components/SmartGraph';
import SystemicSimulator from './components/SystemicSimulator';
import RiskMonitor from './components/RiskMonitor';
import PredictionPage from './components/PredictionPage';
import InterventionSandbox from './components/InterventionSandbox';
import InterpretabilityPage from './components/InterpretabilityPage';
import ReportGenerator from './components/ReportGenerator';
import { processCsvData } from './utils/dataProcessor';
import { generatePolicyMemo } from './services/geminiService';
import { 
  LayoutDashboard, 
  Database, 
  Network, 
  Zap, 
  BarChart3, 
  ShieldCheck, 
  Cog,
  FileText
} from 'lucide-react';

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-4 w-full p-5 transition-all relative ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 rounded-2xl' 
        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-2xl'
    }`}
  >
    <div className={`${active ? 'text-white' : 'text-slate-500'}`}>{icon}</div>
    <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
    {active && <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full"></div>}
  </button>
);

interface UploadedFiles {
  metrics: InstitutionMetrics[] | null;
  network: ExposureNetwork[] | null;
  market: MarketData[] | null;
  labels: CrisisLabel[] | null;
  transactions: any[] | null;
}

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('INGESTION');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [exposures, setExposures] = useState<Exposure[]>([]);
  const [predictions, setPredictions] = useState<CrisisPrediction[]>([]);
  const [failedNodes, setFailedNodes] = useState<Set<string>>(new Set());
  const [aiMemo, setAiMemo] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [reportData, setReportData] = useState({ 
    loss: 0, 
    failures: 0, 
    active: false 
  });

  const [uploadedData, setUploadedData] = useState<UploadedFiles>({
    metrics: null,
    network: null,
    market: null,
    labels: null,
    transactions: null
  });

  const metricsRef = useRef<HTMLInputElement>(null);
  const networkRef = useRef<HTMLInputElement>(null);
  const marketRef = useRef<HTMLInputElement>(null);
  const labelsRef = useRef<HTMLInputElement>(null);
  const transactionsRef = useRef<HTMLInputElement>(null);

  const fileRefsMap: Record<string, React.RefObject<HTMLInputElement>> = {
    metrics: metricsRef,
    network: networkRef,
    market: marketRef,
    labels: labelsRef,
    transactions: transactionsRef
  };

  const handleFileChange = (key: keyof UploadedFiles, file: File | undefined) => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        setUploadedData(prev => ({ ...prev, [key]: results.data as any[] }));
      },
      error: () => alert(`Failed to parse ${key}.`)
    });
  };

  const runAnalysisEngine = () => {
    if (!uploadedData.metrics || !uploadedData.network || !uploadedData.market || !uploadedData.labels) {
      alert("Missing mandatory datasets.");
      return;
    }
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const { nodes, links, predictions } = processCsvData(
        uploadedData.metrics!,
        uploadedData.network!,
        uploadedData.market!,
        uploadedData.labels!
      );

      const adjustedPredictions = predictions.slice(0, 10).map((p, i) => {
        const d = new Date('2026-02-14');
        d.setMonth(d.getMonth() + i);
        return { ...p, timestamp: d.toISOString().split('T')[0] };
      });

      setInstitutions(nodes);
      setExposures(links);
      setPredictions(adjustedPredictions);
      setIsAnalyzing(false);
      setView('DASHBOARD');
      handleGenerateAiInsight(nodes.slice(0, 5), adjustedPredictions[adjustedPredictions.length - 1]?.probability || 0);
    }, 1200);
  };

  const handleGenerateAiInsight = async (risky: Institution[], prob: number) => {
    if (risky.length === 0) return;
    setLoadingAi(true);
    const memo = await generatePolicyMemo(risky, prob);
    setAiMemo(memo);
    setLoadingAi(false);
  };

  const isMandatoryLoaded = uploadedData.metrics && uploadedData.network && uploadedData.market && uploadedData.labels;

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200">
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-50 p-6">
        <div className="mb-10 p-2">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-[1.25rem] shadow-xl shadow-blue-900/40">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
               <span className="text-xl font-black tracking-tighter leading-none">AEGIS<span className="text-blue-500">NET</span></span>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Systemic V5.1</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<Database size={18} />} label="Data Pipeline" active={view === 'INGESTION'} onClick={() => setView('INGESTION')} />
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Risk Monitor" active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
          <SidebarItem icon={<BarChart3 size={18} />} label="Prediction" active={view === 'PREDICTION'} onClick={() => setView('PREDICTION')} />
          <SidebarItem icon={<FileText size={18} />} label="Interpretability" active={view === 'INTERPRETABILITY'} onClick={() => setView('INTERPRETABILITY')} />
          <SidebarItem icon={<ShieldCheck size={18} />} label="Intervention" active={view === 'INTERVENTION'} onClick={() => setView('INTERVENTION')} />
          <SidebarItem icon={<Network size={18} />} label="Graph Explorer" active={view === 'NETWORK'} onClick={() => setView('NETWORK')} />
          <SidebarItem icon={<Zap size={18} />} label="Contagion Sandbox" active={view === 'CONTAGION'} onClick={() => setView('CONTAGION')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
           <div className="bg-slate-800/50 p-4 rounded-3xl flex items-center space-x-3 border border-slate-700/50">
              <div className={`w-2.5 h-2.5 rounded-full ${institutions.length > 0 ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-slate-400">Simulation Time</span>
                <span className="text-xs font-black text-white">{institutions.length > 0 ? 'Feb 14, 2026' : 'Awaiting Data'}</span>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#0f172a] p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">
              {view === 'INGESTION' ? 'Data Pipeline' : 
               view === 'DASHBOARD' ? 'Risk Dashboard' : 
               view === 'PREDICTION' ? 'Crisis Prediction' :
               view === 'INTERPRETABILITY' ? 'Global Explanation' :
               view === 'INTERVENTION' ? 'Policy Sandbox' :
               view === 'NETWORK' ? 'Network Exposure' : 'Contagion Sandbox'}
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Strategic Intelligence Hub • AegisNet v5.1
            </p>
          </div>
          <div className="flex items-center space-x-4">
             {institutions.length > 0 && (
               <ReportGenerator 
                 institutions={institutions} 
                 failedNodes={failedNodes} 
                 aiNarrative={aiMemo} 
                 systemicRiskProb={predictions[predictions.length - 1]?.probability || 0}
                 simulationResults={reportData}
               />
             )}
             <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl text-slate-400 hover:text-white transition-all cursor-pointer shadow-lg hover:shadow-slate-900/40">
                <Cog size={20} />
             </div>
          </div>
        </header>

        {view === 'INGESTION' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-800/40 p-10 rounded-[3rem] border border-slate-700/50 shadow-2xl">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Dataset Ingestion Pipeline</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {['metrics', 'network', 'market', 'labels', 'transactions'].map(id => {
                  const labels: Record<string, string> = { metrics: 'institution_metrics.csv', network: 'exposures_network.csv', market: 'market_data.csv', labels: 'crisis_labels.csv', transactions: 'transactions.csv' };
                  const ref = fileRefsMap[id];
                  return (
                    <div 
                      key={id} 
                      onClick={() => ref?.current?.click()}
                      className={`p-10 bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center space-y-6 ${uploadedData[id as keyof UploadedFiles] ? 'border-emerald-500 bg-emerald-500/5 shadow-inner' : 'border-slate-700 hover:border-blue-500 hover:bg-slate-800/50'}`}
                    >
                      <input 
                        type="file" 
                        ref={ref} 
                        className="hidden" 
                        accept=".csv" 
                        onChange={(e) => handleFileChange(id as keyof UploadedFiles, e.target.files?.[0])} 
                      />
                      <div className={`p-6 rounded-[2rem] transition-all ${uploadedData[id as keyof UploadedFiles] ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-700 group-hover:text-blue-500'}`}>
                        {id === 'metrics' && <Zap size={40} />}
                        {id === 'network' && <Network size={40} />}
                        {id === 'market' && <BarChart3 size={40} />}
                        {id === 'labels' && <ShieldCheck size={40} />}
                        {id === 'transactions' && <Database size={40} />}
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-black uppercase tracking-widest ${uploadedData[id as keyof UploadedFiles] ? 'text-emerald-400' : 'text-slate-500'}`}>{uploadedData[id as keyof UploadedFiles] ? 'Sync Completed' : labels[id]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-12 flex justify-end">
                <button 
                  disabled={!isMandatoryLoaded || isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:opacity-50 text-white font-black py-5 px-16 rounded-2xl shadow-xl shadow-blue-900/40 transition-all uppercase tracking-[0.2em]"
                  onClick={runAnalysisEngine}
                >
                  {isAnalyzing ? "Computing Digital Twin..." : "Execute Model Sync"}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'DASHBOARD' && institutions.length > 0 && (
          <RiskMonitor institutions={institutions} predictions={predictions} />
        )}

        {view === 'PREDICTION' && institutions.length > 0 && (
          <PredictionPage />
        )}

        {view === 'INTERPRETABILITY' && institutions.length > 0 && (
          <InterpretabilityPage />
        )}

        {view === 'INTERVENTION' && institutions.length > 0 && (
          <InterventionSandbox />
        )}

        {view === 'NETWORK' && institutions.length > 0 && (
          <div className="h-[75vh] animate-fadeIn bg-slate-900 rounded-[3rem] border border-slate-700/50 overflow-hidden shadow-2xl">
            <SmartGraph nodes={institutions} links={exposures} failedNodes={failedNodes} />
          </div>
        )}

        {view === 'CONTAGION' && institutions.length > 0 && (
          <div className="h-[75vh] animate-fadeIn">
            <SystemicSimulator 
              institutions={institutions} 
              exposures={exposures} 
              onSimulationComplete={(data) => setReportData(data)}
            />
          </div>
        )}

        {institutions.length === 0 && view !== 'INGESTION' && (
          <div className="h-[60vh] flex flex-col items-center justify-center animate-fadeIn">
             <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mb-8 border border-slate-700 shadow-xl">
                <Database size={48} className="text-slate-600 opacity-50" />
             </div>
            <p className="text-slate-500 mb-10 text-center font-black uppercase tracking-widest max-w-sm leading-relaxed">System offline. Data pipelines must be connected to activate predictive engine.</p>
            <button 
              onClick={() => setView('INGESTION')} 
              className="bg-blue-600 hover:bg-blue-500 px-16 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/40 transition-all"
            >
              Initialize Sync
            </button>
          </div>
        )}
      </main>
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 12px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default App;
