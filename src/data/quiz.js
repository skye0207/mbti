// 人格测试模块 —— Agent 驱动版。
// 设计：
// - 总共 60 题，每 10 题为一轮，共 6 轮
// - 第 1 轮使用预定义"种子题"（覆盖四个维度，让 AI 有初步信号）
// - 第 2-6 轮由 QuizAgent 基于"已有答案 + 当前倾向"动态生成 10 题
// - 每轮结束后 QuizAgent 输出阶段性人格倾向分析（展示给用户）
// - 最终用全部答案计算 MBTI

export const QUESTIONS_PER_ROUND = 10;
export const TOTAL_ROUNDS = 6;
export const TOTAL_QUESTIONS = QUESTIONS_PER_ROUND * TOTAL_ROUNDS; // 60

// 种子题（第 1 轮，10 题）—— 四维度均衡 + 正反向平衡
// dim: 'EI' | 'SN' | 'TF' | 'JP'
// direction: 'A' → 答"符合"加分指向 E/S/T/J；'B' → 加分指向 I/N/F/P
export const SEED_QUESTIONS = [
  { id: 'seed-1', dim: 'EI', direction: 'A', text: '聚会结束后，我通常感到精力充沛而不是疲惫。' },
  { id: 'seed-2', dim: 'EI', direction: 'B', text: '我倾向先在脑子里想清楚，再开口表达。' },
  { id: 'seed-3', dim: 'SN', direction: 'A', text: '我更相信亲眼看到、亲手验证过的事实。' },
  { id: 'seed-4', dim: 'SN', direction: 'B', text: '我对趋势、可能性和"言外之意"更敏感。' },
  { id: 'seed-5', dim: 'TF', direction: 'A', text: '做决定时，我会先看逻辑和事实是否站得住。' },
  { id: 'seed-6', dim: 'TF', direction: 'B', text: '别人哭的时候，我更想先安抚情绪而不是分析问题。' },
  { id: 'seed-7', dim: 'JP', direction: 'A', text: '我喜欢提前规划好行程，不喜欢临时变动。' },
  { id: 'seed-8', dim: 'JP', direction: 'B', text: '我享受随兴而至、临时改主意的感觉。' },
  { id: 'seed-9', dim: 'EI', direction: 'A', text: '我容易主动开启话题、推进对话。' },
  { id: 'seed-10', dim: 'TF', direction: 'A', text: '批评一份方案时，我会直接指出弱点。' }
];

// 7 点李克特量表
export const SCALE_OPTIONS = [
  { value: 3, label: '非常符合' },
  { value: 2, label: '比较符合' },
  { value: 1, label: '有一点符合' },
  { value: 0, label: '说不准' },
  { value: -1, label: '有一点不符合' },
  { value: -2, label: '比较不符合' },
  { value: -3, label: '非常不符合' }
];

/**
 * 根据答案 + 题目列表计算 MBTI。
 * @param {Array<{id:string,dim:string,direction:string}>} questions
 * @param {Record<string, number>} answers
 */
export function calculateMBTI(questions, answers) {
  const scores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const counts = { EI: 0, SN: 0, TF: 0, JP: 0 };

  for (const q of questions) {
    const v = answers[q.id];
    if (typeof v !== 'number') continue;
    const signed = q.direction === 'A' ? v : -v;
    scores[q.dim] += signed;
    counts[q.dim] += 1;
  }

  const pct = (raw, count) => {
    if (count === 0) return 50;
    const max = count * 3;
    return Math.round(((raw + max) / (2 * max)) * 100);
  };

  const eP = pct(scores.EI, counts.EI);
  const sP = pct(scores.SN, counts.SN);
  const tP = pct(scores.TF, counts.TF);
  const jP = pct(scores.JP, counts.JP);

  const mbti = [
    scores.EI >= 0 ? 'E' : 'I',
    scores.SN >= 0 ? 'S' : 'N',
    scores.TF >= 0 ? 'T' : 'F',
    scores.JP >= 0 ? 'J' : 'P'
  ].join('');

  return {
    mbti,
    scores,
    counts,
    percents: {
      E: eP, I: 100 - eP,
      S: sP, N: 100 - sP,
      T: tP, F: 100 - tP,
      J: jP, P: 100 - jP
    }
  };
}

export const MBTI_DESCRIPTIONS = {
  INTJ: { nickname: '建筑师', summary: '冷静的策略家，沟通偏直接、重逻辑、不爱寒暄。', advice: '可以多在表达前加一句关系铺垫，避免被误读为冷漠。' },
  INTP: { nickname: '逻辑学家', summary: '喜欢分析和质疑，表达克制但思路开放。', advice: '记得把结论说出来，别让对方在你的思路里迷路。' },
  ENTJ: { nickname: '指挥官', summary: '果断推进、目标导向，沟通节奏快。', advice: '注意给对方表达节奏，避免被感知成压迫感。' },
  ENTP: { nickname: '辩论家', summary: '思维跳跃，喜欢挑战观点，表达犀利。', advice: '辩论之外，留出"我懂你"的时刻给关系充电。' },
  INFJ: { nickname: '提倡者', summary: '深思熟虑，重视意义和深度连接。', advice: '别什么都自己消化，被理解需要先被听到。' },
  INFP: { nickname: '调停者', summary: '柔软而理想化，重视真诚和价值观。', advice: '真实表达需求并不等于不温柔，可以两者都要。' },
  ENFJ: { nickname: '主人公', summary: '善于照顾他人感受，重视和谐与影响力。', advice: '记得照顾自己的需求，不是所有冲突都要由你修复。' },
  ENFP: { nickname: '竞选者', summary: '热情、跳跃、善于点燃他人，沟通有温度。', advice: '情绪先落地再表达，避免说出去之后又后悔。' },
  ISTJ: { nickname: '物流师', summary: '稳重可靠，重视事实、规则、流程。', advice: '感受不是噪音，偶尔说一句"我也在意你"会很加分。' },
  ISFJ: { nickname: '守护者', summary: '体贴细致，习惯把别人放在前面。', advice: '把"我不介意"换成"我希望……"，让需求被看见。' },
  ESTJ: { nickname: '总经理', summary: '高效果断，沟通偏命令式、重结果。', advice: '在推进事情前，先确认对方情绪，效率反而更高。' },
  ESFJ: { nickname: '执政官', summary: '温暖周到，重视氛围与他人感受。', advice: '允许自己有边界，照顾别人不等于无限给予。' },
  ISTP: { nickname: '鉴赏家', summary: '冷静克制，话不多但准。', advice: '在重要关系里多给一点"语言层面的回应"，沉默容易被误读。' },
  ISFP: { nickname: '探险家', summary: '温柔安静，重视真实感受和当下体验。', advice: '不开心可以更早说出口，憋着会让关系慢慢错位。' },
  ESTP: { nickname: '企业家', summary: '反应快、行动派，沟通直接利落。', advice: '在亲密关系里慢一点，对方需要的不是结论而是过程。' },
  ESFP: { nickname: '表演者', summary: '热情外放、自带氛围，重视当下情绪。', advice: '冲突时别急着用幽默化解，有些感受需要被认真接住。' }
};
