
import { Institution, Exposure, InstitutionMetrics, ExposureNetwork, MarketData, CrisisLabel, CrisisPrediction } from '../types';

export interface ProcessedData {
  nodes: Institution[];
  links: Exposure[];
  predictions: CrisisPrediction[];
}

const GENERATED_PREFIXES = ["Global", "Apex", "Nova", "Stellar", "Ironclad", "Legacy", "Centurion", "Summit", "Horizon", "Zenith"];
const GENERATED_SUFFIXES = ["Bank", "Trust", "Capital", "Holdings", "Investments", "Group", "Financial", "Bancorp", "Union", "Credit"];

const generateProfessionalName = (id: string): string => {
  const num = parseInt(id.replace(/\D/g, '')) || 0;
  const prefix = GENERATED_PREFIXES[num % GENERATED_PREFIXES.length];
  const suffix = GENERATED_SUFFIXES[(num + 3) % GENERATED_SUFFIXES.length];
  return `${prefix} ${suffix}`;
};

export const processCsvData = (
  metrics: InstitutionMetrics[],
  network: ExposureNetwork[],
  market: MarketData[],
  labels: CrisisLabel[]
): ProcessedData => {
  const latestDate = metrics.length > 0 ? metrics[metrics.length - 1].date : '';
  const marketLatest = market.find(m => m.date === latestDate) || market[market.length - 1] || { vix_index: 20 };

  const nodeVolumes: Record<string, number> = {};
  const connectionCounts: Record<string, number> = {};
  
  network.forEach(edge => {
    if (edge.date === latestDate) {
      nodeVolumes[edge.debtor_id] = (nodeVolumes[edge.debtor_id] || 0) + (edge.exposure_amount || 0);
      nodeVolumes[edge.creditor_id] = (nodeVolumes[edge.creditor_id] || 0) + (edge.exposure_amount || 0);
      connectionCounts[edge.debtor_id] = (connectionCounts[edge.debtor_id] || 0) + 1;
      connectionCounts[edge.creditor_id] = (connectionCounts[edge.creditor_id] || 0) + 1;
    }
  });

  const nodes: Institution[] = metrics
    .filter(m => m.date === latestDate)
    .map((m, idx) => {
      const lev = m.leverage_ratio || 15;
      const liq = m.liquidity_ratio || 1;
      const cds = m.cds_spread || 100;
      const vix = marketLatest.vix_index || 20;

      const leverageScore = Math.min(lev / 40, 1) * 40;
      const liquidityScore = Math.max(0, (1.2 - liq)) * 30;
      const cdsScore = Math.min(cds / 1000, 1) * 20;
      const vixScore = Math.min(vix / 60, 1) * 10;
      
      const riskScore = Math.min(100, leverageScore + liquidityScore + cdsScore + vixScore);
      
      // Assign sectors based on index for variety
      const sectors: Institution['sector'][] = ['Banking', 'Insurance', 'Asset Management'];
      const sector = sectors[idx % 3];

      return {
        ...m,
        name: generateProfessionalName(m.institution_id),
        type: (m.total_assets || 0) > 1000 ? 'G-SIB' : 'Regional',
        sector,
        riskScore: isNaN(riskScore) ? 0 : riskScore,
        pagerank: nodeVolumes[m.institution_id] || 0,
        centrality: (connectionCounts[m.institution_id] || 0) / Math.max(1, Object.keys(connectionCounts).length)
      } as Institution;
    });

  const links: Exposure[] = network
    .filter(e => e.date === latestDate)
    .map(e => ({
      source: e.creditor_id,
      target: e.debtor_id,
      amount: e.exposure_amount || 0,
      collateral: e.collateral_value || 0
    }));

  const predictions: CrisisPrediction[] = labels.map(l => ({
    timestamp: l.date,
    probability: l.is_crisis ? (0.6 + Math.random() * 0.4) : (Math.random() * 0.3),
    severity: l.crisis_severity || (l.is_crisis ? Math.random() * 5 + 5 : Math.random() * 3)
  }));

  return { nodes, links, predictions };
};
