import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import SelectField from '../components/SelectField.jsx';
import CheckboxGroup from '../components/CheckboxGroup.jsx';
import { MBTI_TYPES, COMMUNICATION_ISSUES, PREFERRED_TONES } from '../data/options.js';

export default function Profile({ profile, onSaveProfile }) {
  const [form, setForm] = useState(profile);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSaveProfile(form);
  }

  return (
    <div className="page profile-page">
      <section className="page-heading">
        <span className="page-icon">🪪</span>
        <div>
          <h1>我的沟通档案</h1>
          <p>让人格译站记住你的 MBTI 和表达偏好，下次翻译更顺手。</p>
        </div>
      </section>

      <div className="workspace profile-layout">
        <Card className="form-card" badge="个人设定">
          <div className="form-grid single">
            <label className="field">
              <span className="field-label">我的昵称</span>
              <input
                value={form.nickname || ''}
                onChange={(event) => update('nickname', event.target.value)}
                placeholder="比如：小译友"
              />
            </label>
            <SelectField label="我的 MBTI" value={form.mbti || 'ENFP'} onChange={(v) => update('mbti', v)} options={MBTI_TYPES} />
            <CheckboxGroup
              label="我的常见沟通问题"
              options={COMMUNICATION_ISSUES}
              value={form.communicationIssues || []}
              onChange={(v) => update('communicationIssues', v)}
            />
            <CheckboxGroup
              label="我喜欢的表达风格"
              options={PREFERRED_TONES}
              value={form.preferredTone || []}
              onChange={(v) => update('preferredTone', v)}
            />
          </div>
          <Button onClick={handleSave}>保存档案</Button>
        </Card>

        <Card className="profile-preview" badge="档案预览">
          <div className="avatar-orb">{(form.nickname || '译').slice(0, 1)}</div>
          <h2>{form.nickname || '小译友'}</h2>
          <span className="mbti-pill large">{form.mbti || 'ENFP'}</span>
          <div className="profile-summary">
            <h3>常见小翻车</h3>
            <p>{(form.communicationIssues || []).join('、') || '还没有选择'}</p>
            <h3>喜欢的表达风格</h3>
            <p>{(form.preferredTone || []).join('、') || '还没有选择'}</p>
          </div>
          <blockquote>“我不是想把话说漂亮，只是想把真实想法说得更容易被接住。”</blockquote>
        </Card>
      </div>
    </div>
  );
}
