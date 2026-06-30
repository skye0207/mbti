import { useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import SelectField from '../components/SelectField.jsx';
import { MBTI_TYPES } from '../data/options.js';

export default function Guide({ profile }) {
  const [form, setForm] = useState({
    myMbti: profile.mbti || 'ENFP',
    targetMbti: 'INTJ'
  });
  const [loading, setLoading] = useState(false);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleGenerate() {
    setLoading(true);
    // 占位：后续接入 LLM 生成相处指南
    setTimeout(() => setLoading(false), 400);
  }

  return (
    <div className="page guide-page">
      <section className="page-heading">
        <span className="page-icon">🧭</span>
        <div>
          <h1>MBTI 相处指南</h1>
          <p>不是给关系下结论，而是帮你找到更舒服的相处方式。</p>
        </div>
      </section>

      <Card className="form-card" badge="关系设定">
        <div className="form-grid single">
          <SelectField label="我的 MBTI" value={form.myMbti} onChange={(v) => update('myMbti', v)} options={MBTI_TYPES} />
          <SelectField label="对方 MBTI" value={form.targetMbti} onChange={(v) => update('targetMbti', v)} options={MBTI_TYPES} />
        </div>
        <div style={{ marginTop: 20 }}>
          <Button loading={loading} onClick={handleGenerate}>生成相处指南</Button>
        </div>
      </Card>
    </div>
  );
}
