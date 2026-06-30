const navItems = [
  { key: 'home', label: '首页', icon: '🌤️' },
  { key: 'quiz', label: '人格测试', icon: '🪞' },
  { key: 'translator', label: '消息翻译', icon: '💬' },
  { key: 'guide', label: '相处指南', icon: '🧭' }
];

export default function Header({ currentPage, onChangePage }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => onChangePage('home')} aria-label="返回首页">
        <span className="brand-mark">译</span>
        <span>
          <strong>人格译站</strong>
          <small>MBTI 沟通中译中</small>
        </span>
      </button>

      <nav className="nav-tabs" aria-label="主导航">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={currentPage === item.key ? 'nav-tab active' : 'nav-tab'}
            onClick={() => onChangePage(item.key)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
