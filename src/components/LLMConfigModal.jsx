import { useEffect, useState } from 'react';
import Button from './Button.jsx';
import { getLLMConfig, setLLMConfig, fetchModels } from '../utils/llmClient.js';

/**
 * LLM 配置弹窗。
 * - baseUrl：可见，文本输入
 * - apiKey：隐藏（type=password），存储后只显示掩码
 * - model：通过 fetchModels 拉取下拉列表
 *
 * Props:
 *   open: boolean
 *   onClose: () => void
 *   onSaved?: (config) => void
 *   forceSetup?: boolean  // true 时不允许关闭（其他模块需要 LLM 时弹出）
 */
export default function LLMConfigModal({ open, onClose, onSaved, forceSetup = false }) {
  const initial = getLLMConfig();
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [apiKey, setApiKey] = useState(''); // 出于安全，不回填，只显示是否已存在
  const [model, setModel] = useState(initial.model);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasStoredKey] = useState(Boolean(initial.apiKey));

  // 打开弹窗时如果已配置，自动尝试拉一次模型列表
  useEffect(() => {
    if (!open) return;
    if (initial.baseUrl && initial.apiKey) {
      handleFetchModels(initial.baseUrl, initial.apiKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleFetchModels(b, k) {
    const useBase = b ?? baseUrl;
    const useKey = k ?? apiKey ?? initial.apiKey;
    if (!useBase || !useKey) {
      setError('请先填写 Base URL 和 API Key');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const list = await fetchModels({ baseUrl: useBase, apiKey: useKey });
      setModels(list);
      if (list.length && !list.find((m) => m.id === model)) {
        setModel(list[0].id);
      }
    } catch (e) {
      setError('拉取模型失败：' + (e.message || e));
      setModels([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!baseUrl) {
      setError('请填写 Base URL');
      return;
    }
    if (!apiKey && !hasStoredKey) {
      setError('请填写 API Key');
      return;
    }
    if (!model) {
      setError('请选择模型');
      return;
    }
    const next = {
      baseUrl,
      model,
      // apiKey 留空表示沿用已存储的
      ...(apiKey ? { apiKey } : {})
    };
    const saved = setLLMConfig(next);
    onSaved && onSaved(saved);
    onClose && onClose();
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(20,10,40,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16
      }}
      onClick={() => !forceSetup && onClose && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: 24,
          width: '100%', maxWidth: 480,
          boxShadow: '0 24px 60px rgba(80,40,160,0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>模型配置</h2>
          {!forceSetup && (
            <button
              onClick={onClose}
              style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: '#888' }}
              aria-label="关闭"
            >×</button>
          )}
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 13, opacity: 0.7 }}>
          {forceSetup
            ? '此功能需要配置 LLM 才能使用。'
            : '配置后，人格测试和翻译器将启用 AI 分析能力。'}
        </p>

        <Field label="Base URL（兼容 OpenAI 协议）" hint="例如 https://api.deepseek.com/v1">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.deepseek.com/v1"
            style={inputStyle}
          />
        </Field>

        <Field label="API Key" hint={hasStoredKey ? '已保存，留空表示沿用' : '存储在浏览器本地'}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasStoredKey ? '••••••••（已保存）' : 'sk-...'}
            autoComplete="new-password"
            style={inputStyle}
          />
        </Field>

        <Field label="模型">
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            >
              {models.length === 0 && model && <option value={model}>{model}</option>}
              {models.length === 0 && !model && <option value="">（请先拉取模型列表）</option>}
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.id}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() => handleFetchModels()}
              loading={loading}
              type="button"
            >
              拉取模型
            </Button>
          </div>
        </Field>

        {error && (
          <div style={{
            color: '#c44', fontSize: 13, marginTop: 6,
            background: 'rgba(196,68,68,0.06)', padding: '8px 10px', borderRadius: 8
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          {!forceSetup && <Button variant="ghost" onClick={onClose} type="button">取消</Button>}
          <Button onClick={handleSave} type="button">保存</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
        {label}
        {hint && <span style={{ marginLeft: 8, fontWeight: 400, opacity: 0.55, fontSize: 12 }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: '100%', padding: '8px 12px',
  border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8,
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
  background: '#fafafa'
};
