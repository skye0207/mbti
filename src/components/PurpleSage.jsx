/**
 * 小紫 —— 紫色长袍小老头/小画家漫画形象。
 * Props:
 *   mood: 'thinking' | 'happy' | 'wave'  控制表情和小动作
 *   size: 数字，组件渲染宽度（px）
 */
export default function PurpleSage({ mood = 'thinking', size = 160 }) {
  const isHappy = mood === 'happy';
  const isWave = mood === 'wave';

  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * 240 / 200}
      style={{ display: 'block', filter: 'drop-shadow(0 6px 16px rgba(123,74,214,0.25))' }}
      aria-label="小紫"
    >
      <defs>
        <linearGradient id="robe" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#a87bff" />
          <stop offset="100%" stopColor="#7b4ad6" />
        </linearGradient>
        <linearGradient id="hat" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#c8a8ff" />
          <stop offset="100%" stopColor="#8a5cd6" />
        </linearGradient>
        <radialGradient id="cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#ffb1e0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#ffb1e0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 长袍 */}
      <path
        d="M50 230 L60 140 Q60 110 100 110 Q140 110 140 140 L150 230 Z"
        fill="url(#robe)"
      />
      {/* 长袍下摆装饰 */}
      <path d="M50 230 L60 220 L70 230 L80 220 L90 230 L100 220 L110 230 L120 220 L130 230 L140 220 L150 230 Z"
        fill="#5e3aa8" opacity="0.4" />

      {/* 袖子 + 小手（拿笔） */}
      <ellipse cx="63" cy="160" rx="14" ry="20" fill="url(#robe)" />
      <ellipse cx="137" cy="160" rx="14" ry="20" fill="url(#robe)" />
      <circle cx="60" cy="180" r="9" fill="#f3d9c2" />
      <circle cx="140" cy="180" r="9" fill="#f3d9c2" />
      {/* 笔（右手） */}
      <rect x="145" y="155" width="3" height="28" rx="1.5" fill="#3a2a5e" transform="rotate(20 146 169)" />
      <polygon points="155,150 158,154 153,156" fill="#ffd166" transform="rotate(20 155 153)" />

      {/* 脸 */}
      <ellipse cx="100" cy="90" rx="38" ry="40" fill="#f7e0c9" />
      {/* 腮红 */}
      <ellipse cx="78" cy="100" rx="9" ry="6" fill="url(#cheek)" />
      <ellipse cx="122" cy="100" rx="9" ry="6" fill="url(#cheek)" />

      {/* 眉毛（白色长眉，小老头标志） */}
      <path d="M70 78 Q80 70 92 78" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M108 78 Q120 70 130 78" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* 眼睛 */}
      {isHappy ? (
        <>
          <path d="M75 92 Q83 86 90 92" stroke="#3a2a5e" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M110 92 Q118 86 125 92" stroke="#3a2a5e" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="83" cy="92" r="3.5" fill="#3a2a5e" />
          <circle cx="117" cy="92" r="3.5" fill="#3a2a5e" />
          <circle cx="84" cy="91" r="1" fill="#fff" />
          <circle cx="118" cy="91" r="1" fill="#fff" />
        </>
      )}

      {/* 嘴 */}
      {isHappy
        ? <path d="M88 112 Q100 122 112 112" stroke="#3a2a5e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        : <path d="M92 112 Q100 116 108 112" stroke="#3a2a5e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      }

      {/* 胡子 */}
      <path d="M85 118 Q100 140 115 118 Q110 135 100 138 Q90 135 85 118 Z" fill="#fff" />

      {/* 帽子（小尖帽 + 星星） */}
      <path d="M62 65 Q100 -5 138 65 Q100 55 62 65 Z" fill="url(#hat)" />
      <circle cx="100" cy="20" r="5" fill="#ffd166" />
      <polygon points="100,12 102,18 108,18 103,22 105,28 100,24 95,28 97,22 92,18 98,18"
        fill="#fff" opacity="0.9" transform="scale(0.5) translate(100,12)" />
      {/* 帽檐 */}
      <ellipse cx="100" cy="65" rx="42" ry="6" fill="#5e3aa8" />

      {/* 招手（可选小动作） */}
      {isWave && (
        <g>
          <line x1="155" y1="155" x2="170" y2="135" stroke="#3a2a5e" strokeWidth="2" strokeLinecap="round" />
          <line x1="160" y1="160" x2="178" y2="145" stroke="#3a2a5e" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
