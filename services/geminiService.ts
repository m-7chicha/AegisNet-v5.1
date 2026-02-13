
import { GoogleGenAI } from "@google/genai";
import { Institution } from "../types";

export const generatePolicyMemo = async (
  topRiskyInstitutions: Institution[],
  systemicRiskProb: number
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Defensive check: ensure all numeric values have defaults before calling toFixed
  const safeRiskyNodes = topRiskyInstitutions.map(i => {
    const risk = typeof i.riskScore === 'number' ? i.riskScore.toFixed(1) : "0.0";
    const cds = typeof i.cds_spread === 'number' ? i.cds_spread.toFixed(0) : "N/A";
    const leverage = typeof i.leverage_ratio === 'number' ? i.leverage_ratio.toFixed(1) : "N/A";
    return `- ${i.name || 'Unknown'} (ID: ${i.institution_id}): Risk ${risk}%, CDS ${cds}bps, Lev ${leverage}x`;
  }).join('\n');

  const prompt = `
    You are a Lead Financial Analyst at a Central Bank. 
    CURRENT SIMULATION DATE: February 14, 2026.
    SYSTEMIC FORECAST WINDOW: February 2026 - August 2026.
    
    Current Systemic Crisis Probability (T+3 window): ${(systemicRiskProb * 100).toFixed(1)}%.
    Top Risky Institutions based on February 2026 network data:
    ${safeRiskyNodes}
    
    Task: Write a concise, professional policy memo (3 paragraphs) summarizing the current systemic risk landscape. 
    IMPORTANT: You are currently in February 2026. Do not reference dates prior to 2025 as "current". 
    Address why these specific institutions pose a threat given the high leverage and widening market spreads seen in early 2026. 
    Provide 2 specific regulatory recommendations.
    Format in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate narrative.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The system is currently unable to generate AI insights. Please verify data integrity or API configuration.";
  }
};
