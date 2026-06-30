import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';

const featureCards = [
  { page: 'translator', icon: '💬', title: '消息翻译器', desc: '把想说的话翻成更好被理解的表达。' },
  { page: 'guide', icon: '🧭', title: 'MBTI 相处指南', desc: '看看不同人格之间如何舒服相处。' },
  { page: 'review', icon: '🧩', title: '冲突复盘', desc: '拆解误会，生成补救话术。' },
  { page: 'profile', icon: '🪪', title: '我的沟通档案', desc: '保存你的 MBTI 和表达偏好。' }
];

export default function Home({ profile, onChangePage }) {
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
            <Button onClick={() => onChangePage('translator')}>开始翻译</Button>
            <Button variant="secondary" onClick={() => onChangePage('guide')}>查看相处指南</Button>
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

      <section className="grid two-col top-gap">
        <Card className="weather-card" badge="今日人格天气">
          <div className="weather-title">
            <span>🌤️</span>
            <div>
              <h2>{profile.nickname || '小译友'}，今天适合温柔表达</h2>
              <p>你的 MBTI：<strong>{profile.mbti}</strong></p>
            </div>
          </div>
          <div className="weather-list">
            <p><strong>今日关键词：</strong>别让嘴比心快</p>
            <p><strong>情绪温度：</strong>微微上头</p>
            <p><strong>沟通建议：</strong>先说感受，再说需求</p>
            <p><strong>今日避雷：</strong>不要用“你每次都……”开头</p>
            <p><strong>幸运表达：</strong>我想认真说一下我的感受</p>
          </div>
        </Card>

        <Card className="tips-card" badge="今日口头禅替换">
          <h2>把“你怎么这样”换成：</h2>
          <blockquote>“这件事让我有点不舒服，我想和你说清楚。”</blockquote>
          <p>少一点审判，多一点描述；少一点翻车，多一点会意。</p>
          <Button variant="ghost" onClick={() => onChangePage('translator')}>去翻译一句</Button>
        </Card>
      </section>

      <section className="feature-grid top-gap">
        {featureCards.map((item) => (
          <button key={item.page} className="feature-card" onClick={() => onChangePage(item.page)}>
            <span>{item.icon}</span>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </button>
        ))}
      </section>
    </div>
  );
}
