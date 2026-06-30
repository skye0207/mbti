// Agent 基类：定义"角色 + 一次推理"的统一形态。
// 每个 Agent = 一个 system prompt + 一个把输入打包成 user prompt 的函数 + 输出解析。
//
// 设计原则：
// - Agent 是无状态的（状态通过 context 显式传入），便于编排
// - 全部强制 JSON 输出，编排层好拼装
// - LLM 不可用时由 generator.js 的规则版兜底

import { callLLM } from '../utils/llmClient.js';

export class Agent {
  constructor({ name, role, systemPrompt, buildUserPrompt, schemaHint }) {
    this.name = name;
    this.role = role;
    this.systemPrompt = systemPrompt;
    this.buildUserPrompt = buildUserPrompt;
    this.schemaHint = schemaHint;
  }

  async run(context, { signal, temperature } = {}) {
    const user = this.buildUserPrompt(context);
    const system = this.schemaHint
      ? `${this.systemPrompt}\n\n你必须严格输出 JSON 对象，结构如下：\n${this.schemaHint}\n不要输出任何解释、Markdown 包裹或多余文字。`
      : this.systemPrompt;

    return callLLM({
      system,
      user,
      json: Boolean(this.schemaHint),
      temperature,
      signal
    });
  }
}
