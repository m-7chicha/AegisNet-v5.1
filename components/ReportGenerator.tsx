
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Institution } from '../types';

interface ReportGeneratorProps {
  institutions: Institution[];
  failedNodes: Set<string>;
  aiNarrative: string;
  systemicRiskProb: number;
  simulationResults?: {
    loss: number;
    failures: number;
    active: boolean;
  };
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ 
  institutions, 
  failedNodes, 
  aiNarrative,
  systemicRiskProb,
  simulationResults
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const generatePDF = async () => {
    setIsExporting(true);
    const doc = new jsPDF();
    const simTime = "February 14, 2026 09:00:00 EST";
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text('AegisNet Systemic Risk Brief', 20, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Simulation Cycle: ${simTime}`, 20, 38);
    doc.text(`Systemic Crisis Probability (T+3): ${(systemicRiskProb * 100).toFixed(1)}%`, 20, 44);
    
    // Section 1: Top High-Risk Nodes
    doc.setFontSize(14);
    doc.setTextColor(239, 68, 68); // Red 500
    doc.text('SECTION 1: TOP HIGH-RISK INSTITUTIONS', 20, 60);
    
    doc.setFontSize(10);
    doc.setTextColor(50);
    const topRisky = [...institutions].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
    let yPos = 70;
    topRisky.forEach((inst, i) => {
      const riskStr = typeof inst.riskScore === 'number' ? inst.riskScore.toFixed(1) : '0.0';
      const assetsStr = typeof inst.total_assets === 'number' ? inst.total_assets.toFixed(0) : '0';
      doc.text(`${i+1}. ${inst.name} (${inst.institution_id}) - Risk: ${riskStr}%, Assets: $${assetsStr}B`, 25, yPos);
      yPos += 8;
    });

    // Section 2: Contagion Snapshot
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246); // Blue 500
    doc.text('SECTION 2: CONTAGION SIMULATION OUTCOME', 20, yPos + 10);
    
    doc.setFontSize(10);
    doc.setTextColor(50);
    
    if (simulationResults && simulationResults.active) {
      doc.text(`Active Cascade Failures: ${simulationResults.failures}`, 25, yPos + 20);
      doc.text(`Projected Asset Loss: $${simulationResults.loss.toFixed(1)}B`, 25, yPos + 28);
    } else {
      doc.text(`Active Cascade Failures: N/A`, 25, yPos + 20);
      doc.text(`Projected Asset Loss: N/A (No Simulation Run)`, 25, yPos + 28);
    }

    // Section 3: AI Narrative Summary
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text('SECTION 3: AI REGULATORY RECOMMENDATIONS', 20, yPos + 45);
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    // Split text into lines to fit page
    const splitText = doc.splitTextToSize(aiNarrative || "No narrative available for this session.", 170);
    doc.text(splitText, 20, yPos + 55);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('CONFIDENTIAL - AEGISNET REGULATORY TERMINAL', 105, 285, { align: 'center' });

    doc.save(`AegisNet_RiskBrief_2026-02-14.pdf`);
    setIsExporting(false);
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isExporting || institutions.length === 0}
      className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white px-5 py-2.5 rounded-xl border border-slate-700 transition-all text-xs font-black uppercase tracking-widest shadow-lg"
    >
      {isExporting ? (
        <>
          <i className="fas fa-circle-notch animate-spin"></i>
          <span>Generating...</span>
        </>
      ) : (
        <>
          <i className="fas fa-file-export text-blue-500"></i>
          <span>Export Brief</span>
        </>
      )}
    </button>
  );
};

export default ReportGenerator;
