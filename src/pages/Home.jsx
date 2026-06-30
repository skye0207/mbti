import { useState } from 'react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import LLMConfigModal from '../components/LLMConfigModal.jsx';
import { getLLMConfig, isLLMAvailable } from '../utils/llmClient.js';

export default function Home({ profile, onChangePage }) {
  const [configOpen, setConfigOpen] = useState(false);
  const [cfgVersion, setCfgVersion] = useState(0);
  const cfg = getLLMConfig();
  const ready = isLLMAvailable();

  return (
    <div className="page home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="eyebrow">TypeMate · 人格沟通搭子</div>
          <h1>人格译站</h1>
          <p className="hero-slogan">一键中译中，把上头情绪翻成好好沟通</p>
          <p className="hero-desc">
            结合 MBTI 沟通风格，帮你把想说但不好说的话，翻译成对方更容易接住的表达。
          </p>
          <div className="hero-actions">
            <Button onClick={() => onChangePage('quiz')}>开始人格测试</Button>
            <Button variant="secondary" onClick={() => onChangePage('translator')}>去翻译</Button>
          </div>
        </div>

        <div className="phone-preview" aria-label="应用预览">
          <div className="phone-status">
            <span>9:41</span><span>人格天气 🌤️</span>
          </div>
          <div className="weather-card-mini">
            <span className="mbti-pill">{profile.mbti}</span>
            <h3>别让嘴比心快</h3>
            <p>情绪温度：微微上头</p>
            <p>沟通建议：先说感受，再说需求</p>
          </div>
          <div className="chat-bubble left">你怎么又不回我消息？</div>
          <div className="chat-bubble right">我有点在意，但不是想催你。</div>
        </div>
      </section>

      <section className="top-gap">
        <Card className="llm-config-card" badge="AI 模型配置">
          <h2 style={{ margin: '0 0 6px' }}>AI 引擎</h2>
          <p style={{ opacity: 0.7, fontSize: 13, margin: '0 0 12px' }}>
            人格测试与翻译器的 AI 能力需要先配置 LLM。
          </p>

          <div style={{ fontSize: 13, lineHeight: 1.9 }} key={cfgVersion}>
            <p style={{ margin: 0 }}>
              <strong>状态：</strong>
              {ready
                ? <span style={{ color: '#3aa86b' }}>● 已就绪</span>
                : <span style={{ color: '#c47a00' }}>● 未配置</span>}
            </p>
            <p style={{ margin: 0, wordBreak: 'break-all' }}>
              <strong>Base URL：</strong>{cfg.baseUrl || <em style={{ opacity: 0.5 }}>未填写</em>}
            </p>
            <p style={{ margin: 0 }}>
              <strong>API Key：</strong>{cfg.apiKey ? '••••••••（已保存）' : <em style={{ opacity: 0.5 }}>未填写</em>}
            </p>
            <p style={{ margin: 0 }}>
              <strong>模型：</strong>{cfg.model || <em style={{ opacity: 0.5 }}>未选择</em>}
            </p>
          </div>

          <div className="button-row" style={{ marginTop: 14 }}>
            <Button variant={ready ? 'secondary' : 'primary'} onClick={() => setConfigOpen(true)}>
              {ready ? '修改配置' : '立即配置'}
            </Button>
          </div>
        </Card>
      </section>

      <LLMConfigModal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        onSaved={() => { setConfigOpen(false); setCfgVersion((v) => v + 1); }}
      />
    </div>
  );
}
