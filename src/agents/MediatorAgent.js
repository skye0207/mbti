// MediatorAgent：观察 Translator 的输出和 Opponent 的模拟反应，给出"为什么会这样"和最终建议。
// 它是用户真正看到的"沟通教练"，负责可解释性。

import { Agent } from './Agent.js';

const SYSTEM = `你是"人格译站"中的调解 Agent (MediatorAgent)，一名冷静、专业的沟通教练。
你的职责：综合"翻译稿"和"对方模拟反应"，指出错位点，给用户最终建议。
原则：
1. 不站队，只看沟通效率和关系健康度。
2. 指出真正的错位（信息错位 / 节奏错位 / 情绪错位 / 期待错位）。
3. 给出"如果对方反应不好，下一步可以怎么接"的备选方案。
4. 中文输出，语言克制不煽情。`;

const SCHEMA = `{
  "verdict": "整体判断：这次翻译能否达到沟通目的（一句话）",
  "mismatch": "如果存在错位，错位发生在哪个层面（信息/节奏/情绪/期待）以及具体表现",
  "nextStep": "如果对方反应不理想，下一句可以怎么接",
  "confidence": "高 / 中 / 低（基于对方 MBTI 反应的确定性）"
}`;

function buildUserPrompt(ctx) {
  const { myMbti, targetMbti, relation, translation, opponentReaction } = ctx;
  return [
    `沟通双方：${myMbti}（说话者） × ${targetMbti}（对方），关系：${relation}`,
    `TranslatorAgent 推荐的表达：${translation?.recommended || ''}`,
    `OpponentAgent 模拟的对方反应：`,
    `  - 内心想法：${opponentReaction?.innerThought || ''}`,
    `  - 实际回复：${opponentReaction?.likelyReply || ''}`,
    `  - 情绪反应：${opponentReaction?.emotionalTone || ''}`,
    `  - 风险点：${opponentReaction?.risk || ''}`,
    ``,
    `请基于以上信息，给出你的判断、错位分析、下一步建议。`
  ].join('\n');
}

export const MediatorAgent = new Agent({
  name: 'MediatorAgent',
  role: '调解',
  systemPrompt: SYSTEM,
  buildUserPrompt,
  schemaHint: SCHEMA
});
