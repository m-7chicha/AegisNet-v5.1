
import pandas as pd
import networkx as nx
import numpy as np

class SystemicSimulator:
    def __init__(self, metrics_df, network_df):
        self.metrics = metrics_df
        self.network = network_df
        
    def run_cascade(self, patient_zero_id, lgd=1.0):
        """
        Furfine Algorithm: Iterative Contagion Simulation
        """
        # Snapshot of latest data
        latest_date = self.metrics['date'].max()
        metrics = self.metrics[self.metrics['date'] == latest_date].copy()
        network = self.network[self.network['date'] == latest_date].copy()
        
        # Calculate Starting Equity: Assets / Leverage
        metrics['equity'] = metrics['total_assets'] / metrics['leverage_ratio']
        
        failed_nodes = {patient_zero_id}
        failure_rounds = []
        current_failed = [patient_zero_id]
        
        depth = 0
        while current_failed and depth < 20:
            round_failures = []
            # Find all creditors of the banks that just failed
            for failed_id in current_failed:
                exposures = network[network['debtor_id'] == failed_id]
                
                for _, row in exposures.iterrows():
                    creditor_id = row['creditor_id']
                    if creditor_id in failed_nodes:
                        continue
                        
                    # Calculate Loss
                    loss = row['exposure_amount'] * lgd
                    
                    # Deduct from Equity
                    creditor_idx = metrics[metrics['institution_id'] == creditor_id].index
                    if not creditor_idx.empty:
                        metrics.loc[creditor_idx, 'equity'] -= loss
                        
                        # Failure Condition: Insolvent
                        if metrics.loc[creditor_idx, 'equity'].values[0] <= 0:
                            round_failures.append(creditor_id)
                            failed_nodes.add(creditor_id)
            
            if not round_failures:
                break
                
            failure_rounds.append(round_failures)
            current_failed = round_failures
            depth += 1
            
        # Calculate Metrics
        failed_asset_sum = metrics[metrics['institution_id'].isin(failed_nodes)]['total_assets'].sum()
        total_market_assets = metrics['total_assets'].sum()
        
        return {
            "patient_zero": patient_zero_id,
            "failed_count": len(failed_nodes),
            "failed_nodes": list(failed_nodes),
            "failure_rounds": failure_rounds,
            "systemic_loss_bn": round(failed_asset_sum, 2),
            "percent_wiped": round((failed_asset_sum / total_market_assets) * 100, 2),
            "cascade_depth": depth
        }

    def get_systemic_rankings(self):
        """
        Simulate collapse for top 50 banks to find systemic importance
        """
        latest_date = self.metrics['date'].max()
        top_50 = self.metrics[self.metrics['date'] == latest_date].sort_values('total_assets', ascending=False).head(50)
        
        rankings = []
        for _, bank in top_50.iterrows():
            result = self.run_cascade(bank['institution_id'])
            rankings.append({
                "institution_id": bank['institution_id'],
                "name": bank.get('name', f"Bank {bank['institution_id']}"),
                "potential_loss": result['systemic_loss_bn'],
                "cascade_size": result['failed_count']
            })
            
        return sorted(rankings, key=lambda x: x['potential_loss'], reverse=True)
