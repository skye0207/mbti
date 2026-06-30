import { copyText } from '../utils/copy.js';

export default function ResultCard({ title, children, copyValue, tone = 'purple', showToast }) {
  async function handleCopy() {
    const success = await copyText(copyValue || children);
    showToast(success ? '已复制，可以去好好沟通啦' : '复制失败，请手动复制');
  }

  return (
    <article className={`result-card result-${tone}`}>
      <div className="result-head">
        <h3>{title}</h3>
        {copyValue || typeof children === 'string' ? (
          <button className="copy-btn" onClick={handleCopy}>复制</button>
        ) : null}
      </div>
      <div className="result-body">{children}</div>
    </article>
  );
}
