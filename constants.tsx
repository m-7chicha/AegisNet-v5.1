
import { Institution, Exposure, CrisisPrediction } from './types';

export const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  primary: '#3b82f6',
  critical: '#ef4444',
  warning: '#f59e0b',
  safe: '#10b981',
  textMuted: '#94a3b8',
};

const BANK_NAMES = [
  "Aegis Trust", "Nova Capital", "Summit Global", "Horizon Banking", 
  "Pinnacle Financial", "Stellar Credit", "Ironclad Bancorp", 
  "Vista Invest", "Meridian Union", "Apex Group", "Zenith Asset",
  "Vanguard Holdings", "Centurion Bank", "Empire Trust", "Legacy Wealth"
];

// Fixed: Added missing 'sector' property to satisfy the Institution interface
export const generateMockInstitutions = (): Institution[] => {
  return BANK_NAMES.map((name, i) => ({
    institution_id: `INST-${String(i + 1).padStart(4, '0')}`,
    date: '2026-02-14',
    name,
    // Fix: Explicitly cast the 'type' to match the Institution interface's union type
    type: (i < 3 ? 'G-SIB' : i < 7 ? 'D-SIB' : 'Regional') as Institution['type'],
    // Added missing 'sector' property
    sector: (['Banking', 'Insurance', 'Asset Management'][i % 3]) as Institution['sector'],
    total_assets: Math.random() * 2000 + 100,
    leverage_ratio: Math.random() * 20 + 5,
    liquidity_ratio: Math.random() * 1.5 + 0.5,
    roe: Math.random() * 15,
    cds_spread: Math.random() * 400 + 50,
    riskScore: Math.random() * 100,
  })).sort((a, b) => b.riskScore - a.riskScore);
};

// Fixed: Used institution_id instead of id
export const generateMockExposures = (institutions: Institution[]): Exposure[] => {
  const exposures: Exposure[] = [];
  institutions.forEach(inst => {
    const numLinks = Math.floor(Math.random() * 3) + 1;
    for(let i = 0; i < numLinks; i++) {
      const target = institutions[Math.floor(Math.random() * institutions.length)];
      if (target.institution_id !== inst.institution_id) {
        exposures.push({
          source: inst.institution_id,
          target: target.institution_id,
          amount: Math.random() * 50 + 5
        });
      }
    }
  });
  return exposures;
};

export const generateMockPredictions = (): CrisisPrediction[] => {
  const predictions: CrisisPrediction[] = [];
  const start = new Date('2026-02-14');
  // Limit to 10 months to stay strictly within 2026 as per requirements
  for (let i = 0; i < 10; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    predictions.push({
      timestamp: d.toISOString().split('T')[0],
      probability: Math.random() * 0.4 + (i > 3 ? 0.3 : 0.1),
      severity: Math.random() * 10
    });
  }
  return predictions;
};
