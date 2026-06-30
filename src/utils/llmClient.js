// 统一的 LLM 客户端。兼容 OpenAI Chat Completions 协议
// （OpenAI / DeepSeek / 通义 / 智谱 / 百度千帆兼容模式 / 本地 Ollama 等都可用）。
//
// 配置方式（优先级从高到低）：
// 1. 运行时通过 setLLMConfig({ baseUrl, apiKey, model }) 注入（推荐：用户在"我的档案"里填）
// 2. Vite 环境变量 VITE_LLM_BASE_URL / VITE_LLM_API_KEY / VITE_LLM_MODEL
// 3. 都没有 → isLLMAvailable() 返回 false，上层走规则 fallback

const STORAGE_KEY = 'renge.llm.config';

function readStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readEnvConfig() {
  const env = import.meta.env || {};
  return {
    baseUrl: env.VITE_LLM_BASE_URL || '',
    apiKey: env.VITE_LLM_API_KEY || '',
    model: env.VITE_LLM_MODEL || ''
  };
}

export function getLLMConfig() {
  const stored = readStoredConfig() || {};
  const env = readEnvConfig();
  return {
    baseUrl: stored.baseUrl || env.baseUrl || '',
    apiKey: stored.apiKey || env.apiKey || '',
    model: stored.model || env.model || 'gpt-4o-mini'
  };
}

export function setLLMConfig(config) {
  const merged = { ...getLLMConfig(), ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

export function isLLMAvailable() {
  const { baseUrl, apiKey } = getLLMConfig();
  return Boolean(baseUrl && apiKey);
}

/**
 * 调用 LLM，OpenAI Chat Completions 兼容协议。
 * @param {Object} params
 * @param {string} params.system - 系统提示（Agent 人格）
 * @param {string} params.user   - 用户消息
 * @param {Object} [params.json] - 若传入，则要求模型输出可解析为该 schema 的 JSON
 * @param {number} [params.temperature]
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<string|object>} json 模式下返回对象，否则返回字符串
 */
export async function callLLM({ system, user, json, temperature = 0.7, signal }) {
  if (!isLLMAvailable()) {
    throw new Error('LLM_NOT_CONFIGURED');
  }
  const { baseUrl, apiKey, model } = getLLMConfig();

  const body = {
    model,
    temperature,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ]
  };
  if (json) {
    body.response_format = { type: 'json_object' };
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body),
    signal
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`LLM_HTTP_${resp.status}: ${text.slice(0, 200)}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? '';

  if (json) {
    try {
      return JSON.parse(content);
    } catch {
      // 容错：模型偶尔会把 JSON 包在 ```json ... ``` 里
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('LLM_JSON_PARSE_FAILED');
    }
  }
  return content;
}
