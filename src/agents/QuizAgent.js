// QuizAgent：基于"已答题 + 当前 MBTI 倾向"，
// 1) 生成阶段性人格分析（用户可见）
// 2) 动态出下一轮 10 道题（针对最不确定的维度补强）

import { Agent } from './Agent.js';

const SYSTEM = `你是"人格译站"中的人格测试 Agent (QuizAgent)，专注于 MBTI 风格的轻量人格倾向评估。
你的职责有两个：
1. 基于已经收集到的答题结果，给出"当前阶段人格倾向"的简短分析（用户可见，鼓励性、客观、不下定论）。
2. 生成下一轮 10 道题，重点考察当前最不确定/最有分歧的维度。

出题原则：
- 每道题必须能明确归属 MBTI 四个维度之一：'EI' / 'SN' / 'TF' / 'JP'
- direction 字段：'A' 表示"非常符合"指向维度首字母（E/S/T/J），'B' 表示反向（I/N/F/P）
- 题目用中文陈述句，第一人称，避免引导性词汇（"应该""必须"）
- 必须正反向题平衡（每个维度的 'A' 和 'B' 数量接近）
- 不要重复之前出过的题目（语义和表达都要新）
- 题目要具体可判断，避免太抽象（不好："我有时会想很多" 好："做决定前我倾向先列利弊清单"）
- 优先给"不确定维度"（百分比接近 50% 的）出题，确定维度可少出
- 总共输出 10 题`;

const SCHEMA = `{
  "analysis": "对当前阶段人格倾向的客观分析，2-3 句话，可包含已经明确的维度和还在观察的维度",
  "questions": [
    {
      "id": "r2-1",
      "dim": "EI" | "SN" | "TF" | "JP",
      "direction": "A" | "B",
      "text": "题目陈述（中文，第一人称）"
    }
    // ... 共 10 题
  ]
}`;

function buildUserPrompt(ctx) {
  const { roundIndex, totalRounds, previousQAs, currentMBTI, percents, counts } = ctx;

  const qaLines = previousQAs.map((qa, i) =>
    `${i + 1}. [${qa.dim}|${qa.direction}] ${qa.text} → 答："${qa.scaleLabel}"（得分 ${qa.signedScore}）`
  ).join('\n');

  const dimSummary = ['EI', 'SN', 'TF', 'JP'].map((d) => {
    const left = d[0], right = d[1];
    const leftP = d === 'EI' ? percents.E : d === 'SN' ? percents.S : d === 'TF' ? percents.T : percents.J;
    return `  ${left}/${right}：${leftP}% 偏 ${left}（已收集 ${counts[d]} 题）`;
  }).join('\n');

  return [
    `当前进度：第 ${roundIndex + 1} / ${totalRounds} 轮，准备生成第 ${roundIndex + 1} 轮的 10 道题。`,
    ``,
    `已收集的答题情况（共 ${previousQAs.length} 题）：`,
    qaLines,
    ``,
    `当前 MBTI 推断：${currentMBTI}`,
    `各维度倾向：`,
    dimSummary,
    ``,
    `请按要求输出 analysis（用户可见的阶段性分析）和 questions（下一轮 10 题）。题目 id 用 "r${roundIndex + 1}-1" 到 "r${roundIndex + 1}-10"。`
  ].join('\n');
}

export const QuizAgent = new Agent({
  name: 'QuizAgent',
  role: '人格测试',
  systemPrompt: SYSTEM,
  buildUserPrompt,
  schemaHint: SCHEMA
});
