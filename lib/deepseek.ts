import type { RiskResult } from "./types";
import { calculateRisk as localCalculateRisk } from "./mock";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `你是一个 DeFi 借贷协议的 AI 风控引擎。你需要根据借款人的借款金额和抵押金额，输出结构化的风控评分结果。

评分规则：
1. 抵押率 = 抵押金额 / 借款金额 * 100%
2. 四个风控因子（每个 0-100 分）：
   - 抵押率因子（权重 40%）：≥180% 得 90-95 分，150-180% 得 70-80 分，130-150% 得 45-55 分，120-130% 得 30-40 分，<120% 得 10-20 分
   - 收益能力因子（权重 30%）：基于抵押率和借款金额评估。抵押率越高、金额越小，分数越高
   - 策略风险因子（权重 20%）：抵押率越高策略越安全，分数越高
   - 市场波动因子（权重 10%）：评估市场条件对抵押物的影响
3. 信用总分 = 各因子加权求和
4. 审批条件：抵押率 ≥ 120% 且 信用总分 ≥ 40
5. 风险等级：very-low（≥180%）, low, medium（150-180%）, elevated, high（120-150%）, liquidation（<120%）

你必须严格按照以下 JSON 格式返回，不要返回任何其他内容：
{
  "creditScore": number,
  "collateralRatio": number,
  "riskLevel": "very-low" | "low" | "medium" | "elevated" | "high" | "liquidation",
  "riskLabel": "低风险" | "中风险" | "高风险" | "清算区",
  "riskExplanation": "string",
  "defaultProbability": "string like 3% or 12%",
  "approved": boolean,
  "factors": {
    "collateralRatio": { "label": "抵押率", "score": number, "weight": 40, "explanation": "string", "private": false },
    "yieldAbility": { "label": "收益能力", "score": number, "weight": 30, "explanation": "string", "private": true },
    "strategyRisk": { "label": "策略风险", "score": number, "weight": 20, "explanation": "string", "private": true },
    "marketVolatility": { "label": "市场波动", "score": number, "weight": 10, "explanation": "string", "private": true }
  },
  "aiReason": "完整的AI风控评估说明，包含所有因子数据",
  "lenderVisibleReason": "对贷方展示的说明，隐私因子只显示验证结果不显示具体分数"
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

  const userPrompt = `请对以下借款申请进行风控评分：
- 借款金额：${amount} USDC
- 抵押金额：${collateral} USDC
- 抵押率：${Math.round((collateral / Math.max(amount, 1)) * 100)}%

请严格按照要求的 JSON 格式返回评分结果。`;

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
