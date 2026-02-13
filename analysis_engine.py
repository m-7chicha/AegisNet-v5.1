
import pandas as pd
import numpy as np
import networkx as nx
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import json
import os

class AegisAnalysisEngine:
    def __init__(self, data_dir='./data/'):
        self.data_dir = data_dir
        self.metrics = None
        self.exposures = None
        self.market = None
        self.labels = None
        self.transactions = None
        self.master_df = None
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)

    def load_data(self):
        """Load and parse the 5 mandatory CSV files."""
        self.metrics = pd.read_csv(os.path.join(self.data_dir, 'institution_metrics.csv'), parse_dates=['date'])
        self.exposures = pd.read_csv(os.path.join(self.data_dir, 'exposures_network.csv'), parse_dates=['date'])
        self.market = pd.read_csv(os.path.join(self.data_dir, 'market_data.csv'), parse_dates=['date'])
        self.labels = pd.read_csv(os.path.join(self.data_dir, 'crisis_labels.csv'), parse_dates=['date'])
        self.transactions = pd.read_csv(os.path.join(self.data_dir, 'transactions.csv'), parse_dates=['datetime'])

    def run_network_analysis(self):
        """Calculate monthly graph metrics (Task 1)."""
        graph_features = []
        unique_dates = self.exposures['date'].unique()

        for d in unique_dates:
            df_month = self.exposures[self.exposures['date'] == d]
            G = nx.from_pandas_edgelist(
                df_month, 'creditor_id', 'debtor_id', 
                edge_attr='exposure_amount', create_using=nx.DiGraph()
            )
            
            # Centrality calculations
            pagerank = nx.pagerank(G, weight='exposure_amount')
            betweenness = nx.betweenness_centrality(G, weight='exposure_amount')
            
            for node in G.nodes():
                graph_features.append({
                    'date': d,
                    'institution_id': node,
                    'pagerank': pagerank.get(node, 0),
                    'betweenness': betweenness.get(node, 0),
                    'degree_centrality': G.degree(node)
                })

        return pd.DataFrame(graph_features)

    def prepare_and_train(self):
        """Merge data and train the predictive model (Task 2)."""
        # 1. Feature Engineering: Graph Metrics + Inst Metrics
        gf_df = self.run_network_analysis()
        self.master_df = self.metrics.merge(gf_df, on=['date', 'institution_id'], how='left')
        self.master_df = self.master_df.merge(self.market, on='date', how='left')
        
        # 2. Target Labeling (Shift 3 months for early warning)
        label_map = self.labels.set_index('date')['is_crisis']
        self.master_df['target_is_crisis'] = self.master_df['date'].apply(
            lambda x: label_map.get(x + pd.DateOffset(months=3), 0)
        )

        # 3. Model Training
        features = ['total_assets', 'leverage_ratio', 'liquidity_ratio', 'pagerank', 'vix_index']
        X = self.master_df[features].fillna(0)
        y = self.master_df['target_is_crisis']
        
        self.model.fit(X, y)
        
        # Save predictions for dashboard
        self.master_df['risk_probability'] = self.model.predict_proba(X)[:, 1]
        return self.master_df[['date', 'institution_id', 'risk_probability']].to_json(orient='records')

    def simulate_contagion(self, start_node_id, shock_size=1.0):
        """Furfine Algorithm Threshold-based cascade (Task 3)."""
        # Equity = Assets / Leverage
        latest_date = self.metrics['date'].max()
        current_metrics = self.metrics[self.metrics['date'] == latest_date].copy()
        current_metrics['equity'] = current_metrics['total_assets'] / current_metrics['leverage_ratio']
        
        failed_nodes = {start_node_id}
        queue = [start_node_id]
        
        # Current exposure snapshot
        current_exposures = self.exposures[self.exposures['date'] == latest_date]
        
        while queue:
            failed_id = queue.pop(0)
            # Find banks that lend to the failed bank
            creditors = current_exposures[current_exposures['debtor_id'] == failed_id]
            
            for idx, row in creditors.iterrows():
                creditor_id = row['creditor_id']
                if creditor_id in failed_nodes: continue
                
                loss = row['exposure_amount'] * shock_size
                
                # Update Equity
                creditor_idx = current_metrics[current_metrics['institution_id'] == creditor_id].index
                if not creditor_idx.empty:
                    current_metrics.loc[creditor_idx, 'equity'] -= loss
                    
                    # Check failure condition: Equity < 0
                    if current_metrics.loc[creditor_idx, 'equity'].values[0] <= 0:
                        failed_nodes.add(creditor_id)
                        queue.append(creditor_id)
        
        return list(failed_nodes)

if __name__ == "__main__":
    engine = AegisAnalysisEngine()
    # Mock behavior for logic validation
    print("Aegis Analysis Engine Initialized. Ready for CSV ingestion.")
