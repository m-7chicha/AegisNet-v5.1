
export interface InstitutionMetrics {
  date: string;
  institution_id: string;
  total_assets: number;
  leverage_ratio: number;
  liquidity_ratio: number;
  roe: number;
  cds_spread: number;
}

export interface ExposureNetwork {
  date: string;
  creditor_id: string;
  debtor_id: string;
  exposure_amount: number;
  collateral_value: number;
}

export interface MarketData {
  date: string;
  vix_index: number;
  yield_curve_slope: number;
  gdp_growth: number;
}

export interface CrisisLabel {
  date: string;
  is_crisis: number;
  crisis_severity: number;
}

export interface CrisisPrediction {
  timestamp: string;
  probability: number;
  severity: number;
}

export interface Institution extends InstitutionMetrics {
  name: string;
  type: 'G-SIB' | 'D-SIB' | 'Regional' | 'Investment';
  sector: 'Banking' | 'Insurance' | 'Asset Management';
  riskScore: number; 
  pagerank?: number;
  centrality?: number;
}

export interface Exposure {
  source: string;
  target: string;
  amount: number;
  collateral?: number;
}

export type ViewType = 'DASHBOARD' | 'NETWORK' | 'CONTAGION' | 'PREDICTION' | 'INTERVENTION' | 'INGESTION' | 'INTERPRETABILITY';
