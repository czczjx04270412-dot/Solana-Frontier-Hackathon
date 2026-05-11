# Solana DeFi 受控信用金库

> 基于 Solana 的受控链上借贷协议 —— AI 风险评分 + ZK 隐私证明 + PDA 受控资金库，借方策略完全可审计，贷方本金始终受到保护。

---

## 项目简介

**Solana DeFi Credit Vault** 是一个去中心化借贷协议。贷方资金永远不会进入借方的个人钱包，所有资本都锁定在一个**程序派生地址（PDA）资金库**中。借方只能通过受控交易界面使用白名单资产进行策略操作。收益按照固定规则自动分配——每个周期的 5% 锁定给贷方利润池，95% 留在策略复投池继续交易——亏损时先扣复投池，再扣借方抵押，贷方本金始终处于最后保护线。

---

## 核心功能

| 功能 | 说明 |
|---|---|
| **PDA 受控资金库** | 资金托管于 PDA 代币账户，借方与贷方均无法单方面提取 |
| **AI 风险引擎** | 使用 DeepSeek LLM 评估抵押率、策略风险、收益能力和市场敞口 |
| **ZK 隐私证明** | 基于 snarkjs 的链下 ZK 证明，在不暴露原始数据的情况下验证隐私风险因子 |
| **5% / 95% 收益分成** | 每次盈利：5% 锁入贷方利润池，95% 留在策略复投池继续滚动 |
| **亏损瀑布机制** | 亏损依次扣除：策略复投池 → 借方抵押 → 贷方本金（最后兜底） |
| **二级后台审核** | 借款准入审核 + 贷方放款审核，双重确认后资金才能进入 Vault |
| **实时净值与清算线** | 持续监控；当净值 < 贷款金额的 120% 时触发自动清算 |
| **链上结算** | 7 条 Anchor 指令覆盖完整生命周期：初始化 → 放款 → 收益 → 清算 → 出金 |

---

## 系统架构

```
┌──────────────────────────────────────────────────────────┐
│                        前端界面                           │
│  Next.js 15 + TypeScript + TailwindCSS + Recharts        │
│  钱包连接：Phantom（@solana/wallet-adapter）              │
└────────────────────┬─────────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │       API 层          │
         │  /api/risk-score      │  ← DeepSeek AI 风险评分
         │  /api/vault-state     │  ← 链上状态读取
         │  /api/zk-verify       │  ← snarkjs ZK 验证
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │    Solana Devnet       │
         │   Anchor 合约程序      │
         │   credit_vault         │
         │   （7 条指令）          │
         └───────────────────────┘
```

### 链上合约结构（`programs/credit_vault`）

| 文件 | 作用 |
|---|---|
| `lib.rs` | 7 条指令，覆盖完整借贷生命周期 |
| `state.rs` | `CreditVault` + `ProtocolConfig` 账户结构体 |
| `errors.rs` | 自定义 Anchor 错误代码 |

### 合约指令说明

| 指令 | 调用方 | 说明 |
|---|---|---|
| `initialize_protocol` | 管理员 | 一次性初始化：利润分配 BPS、最低抵押率、清算阈值、最低信用分 |
| `initialize_vault` | 借方 | 创建 Vault PDA，存入抵押，记录 AI 评分和 ZK 证明哈希 |
| `fund_vault` | 贷方 | 将贷款本金存入 Vault |
| `simulate_yield` | Keeper/预言机 | 执行每日盈亏：收益分成或亏损瀑布 |
| `liquidate` | 任何人 | 当 vault_nav < 清算阈值时触发 |
| `withdraw` | 借方 | 结算后提取剩余资金 |
| `close_vault` | 借方 | 协议结束后回收租金 |

---

## 技术栈

| 层级 | 技术 |
|---|---|
| **区块链** | Solana Devnet |
| **智能合约** | Anchor 0.32、Rust |
| **前端框架** | Next.js 15、React 19、TypeScript |
| **样式** | TailwindCSS 3 |
| **图表** | Recharts |
| **钱包** | @solana/wallet-adapter（Phantom） |
| **AI 风险引擎** | DeepSeek Chat API（`deepseek-chat`） |
| **ZK 证明** | snarkjs（Groth16） |
| **RPC 客户端** | @coral-xyz/anchor 0.32、@solana/web3.js |
| **代币程序** | @solana/spl-token |

---

## 运行流程

### 完整生命周期

```
1. 借方提交借款申请
        ↓
2. AI 风险引擎评分（DeepSeek）
        ↓
3. 生成隐私因子的 ZK 证明
        ↓
4. 后台第一步：借款准入审核
        ↓
5. 贷方发起放款
        ↓
6. 后台第二步：确认资金进入 Vault
        ↓
7. 借方通过受控面板执行白名单策略（SOL、mSOL、JitoSOL、USDC）
        ↓
8. 每个周期：盈利 → 5% 锁给贷方 + 95% 留在复投池
             亏损 → 先扣复投池 → 再扣抵押 → 触发清算
        ↓
9. 退出条件：贷方利润锁定池 ≥ 目标利润 且 Vault 净值 ≥ 本金 + 锁定利润
        ↓
10. 贷方提取本金 + 锁定利润
    借方取走剩余抵押 + 复投池
```

### 盈亏机制

```
盈利日：
  Vault 净值增量 × 5%  → 贷方利润锁定池（不可再用于交易）
  Vault 净值增量 × 95% → 策略复投池（借方继续交易）

亏损日：
  亏损依次扣除：策略复投池 → 借方抵押 → [触发清算]
  贷方利润锁定池：永远不被扣除
  贷方本金保护线：直到清算前永远不被扣除
```

---

## 快速开始

### 环境要求

- Node.js 18+
- Rust + Solana CLI + Anchor CLI（链上部署需要）
- Phantom 钱包浏览器插件

### 安装与运行（前端 Demo）

```bash
git clone https://github.com/czczjx04270412-dot/Solana-Frontier-Hackathon
cd Solana-Frontier-Hackathon

npm install
cp .env.local.example .env.local
# 在 .env.local 中填入你的 DEEPSEEK_API_KEY

npm run dev
# 访问 http://localhost:3000
```

### 环境变量

```env
DEEPSEEK_API_KEY=你的_deepseek_api_key
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

### 部署智能合约

详见 [README-contract.md](./README-contract.md) 中的完整 Anchor 部署说明。

```bash
anchor build
anchor deploy --provider.cluster devnet
```

---

## 页面说明

| 路由 | 说明 |
|---|---|
| `/` | 协议总览 —— 整体指标、演示控制台 |
| `/borrow` | 借方视角 —— 申请借款、成本分析、还款进度 |
| `/lend` | 贷方视角 —— 浏览借款申请、风险卡片 |
| `/vault` | Vault 实时运行 —— 受控交易、净值、收益图表 |
| `/repay` | 结算页面 —— 利润台账、退出条件、重置 |
| `/risk-admin` | 后台管理 —— 二步审核工作流 |
| `/figma-flow` | 协议流程图（演示用） |

---

## ZK 证明系统

收益历史、策略敞口、违约记录、资产来源、市场模型等隐私风险因子通过 **snarkjs Groth16** 在链下进行零知识证明验证。链上只存储证明哈希和验证结果，敏感的借方数据永远不会公开上链。

```
链下：隐私输入 → snarkjs 电路 → 证明 + 公开信号
链上：proof_hash（bytes32）存储于 CreditVault 账户
前端：ZKProofCard 展示每个隐私项的验证状态
```

---

## AI 风险引擎

DeepSeek API 生成结构化 JSON 风险评估报告，包含：
- **风险等级**：低 / 中 / 高
- **信用分**：0–100
- **抵押率**：根据输入计算
- **目标收益率区间**：推荐的年化收益率范围
- **AI 解释**：用通俗语言说明风险判断依据

在 API Key 不可用时自动回退到本地规则引擎进行评分。

---

## 开源协议

MIT — 为 Solana Frontier Hackathon 参赛作品。
