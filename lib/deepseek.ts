import type { RiskResult } from "./types";
import { calculateRisk as localCalculateRisk } from "./mock";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are an AI risk assessment engine for a DeFi lending protocol. You need to evaluate the borrower's loan amount and collateral amount, and output a structured risk scoring result.

Scoring Rules:
1. Collateral Ratio = Collateral Amount / Loan Amount * 100%
2. Four risk factors (each scored 0-100):
   - Collateral Ratio Factor (weight 40%): >=180% scores 90-95, 150-180% scores 70-80, 130-150% scores 45-55, 120-130% scores 30-40, <120% scores 10-20
   - Yield Ability Factor (weight 30%): Based on collateral ratio and loan amount. Higher ratio and smaller amount scores higher
   - Strategy Risk Factor (weight 20%): Higher collateral ratio means safer strategy, higher score
   - Market Volatility Factor (weight 10%): Assess market conditions impact on collateral
3. Credit Score = Weighted sum of all factors
4. Approval Condition: Collateral Ratio >= 120% AND Credit Score >= 40
5. Risk Level: very-low (>=180%), low, medium (150-180%), elevated, high (120-150%), liquidation (<120%)

You MUST return ONLY the following JSON format, no other content:
{
  "creditScore": number,
  "collateralRatio": number,
  "riskLevel": "very-low" | "low" | "medium" | "elevated" | "high" | "liquidation",
  "riskLabel": "Low Risk" | "Medium Risk" | "High Risk" | "Liquidation Zone",
  "riskExplanation": "string",
  "defaultProbability": "string like 3% or 12%",
  "approved": boolean,
  "factors": {
    "collateralRatio": { "label": "Collateral Ratio", "score": number, "weight": 40, "explanation": "string", "private": false },
    "yieldAbility": { "label": "Yield Ability", "score": number, "weight": 30, "explanation": "string", "private": true },
    "strategyRisk": { "label": "Strategy Risk", "score": number, "weight": 20, "explanation": "string", "private": true },
    "marketVolatility": { "label": "Market Volatility", "score": number, "weight": 10, "explanation": "string", "private": true }
  },
  "aiReason": "Complete AI risk assessment explanation with all factor data",
  "lenderVisibleReason": "Lender-visible explanation, private factors show verification result only without specific scores"
}`;

export async function aiCalculateRisk(
  amount: number,
  collateral: number
): Promise<RiskResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("[AI Risk] No DEEPSEEK_API_KEY, falling back to local calculation");
    return localCalculateRisk(amount, collateral);
  }

  const userPrompt = `Please evaluate the following loan application:
- Loan Amount: ${amount} USDC
- Collateral Amount: ${collateral} USDC
- Collateral Ratio: ${Math.round((collateral / Math.max(amount, 1)) * 100)}%

Please return the scoring result strictly in the required JSON format.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AI Risk] DeepSeek API error:", response.status, errText);
      return localCalculateRisk(amount, collateral);
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI Risk] Failed to parse JSON from response:", content);
      return localCalculateRisk(amount, collateral);
    }

    const parsed = JSON.parse(jsonMatch[0]) as RiskResult;

    if (
      typeof parsed.creditScore !== "number" ||
      typeof parsed.approved !== "boolean" ||
      !parsed.factors?.collateralRatio
    ) {
      console.error("[AI Risk] Invalid structure:", parsed);
      return localCalculateRisk(amount, collateral);
    }

    return parsed;
  } catch (err) {
    console.error("[AI Risk] Exception:", err);
    return localCalculateRisk(amount, collateral);
  }
}
