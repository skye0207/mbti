import { useState } from 'react';

/**
 * 李克特 7 点拖拽滑块（强可见版）。
 * - 大号拖拽手柄，明显视觉提示
 * - 轨道渐变 + 刻度点 + 居中线
 * - 拖拽 / 点击刻度 / 键盘方向键均可操作
 */
export default function LikertSlider({ options, value, onChange }) {
  const sorted = [...options].sort((a, b) => a.value - b.value);
  const min = sorted[0].value;
  const max = sorted[sorted.length - 1].value;
  const range = max - min;

  const selected = typeof value === 'number';
  const sliderValue = selected ? value : 0;
  const currentLabel = selected
    ? sorted.find((o) => o.value === value)?.label
    : '';

  // 手柄位置百分比
  const handlePct = ((sliderValue - min) / range) * 100;
  // 已选中部分的填充百分比（从中点开始向选中方向延伸，视觉更直观）
  const midPct = ((0 - min) / range) * 100;
  const fillLeft = Math.min(midPct, handlePct);
  const fillWidth = Math.abs(handlePct - midPct);

  const [dragging, setDragging] = useState(false);

  return (
    <div style={{ padding: '8px 4px 4px' }}>
      {/* 当前选择标签（仅选中后显示） */}
      <div style={{
        textAlign: 'center',
        fontSize: 14,
        marginBottom: 14,
        color: '#7b4ad6',
        fontWeight: 600,
        minHeight: 20,
        transition: 'all .2s'
      }}>
        {selected && <span style={{
          padding: '4px 14px',
          background: 'linear-gradient(135deg,rgba(168,123,255,0.15),rgba(255,158,207,0.15))',
          borderRadius: 999,
          fontSize: 14
        }}>{currentLabel}</span>}
      </div>

      {/* 滑块主体 */}
      <div style={{ position: 'relative', height: 44, padding: '0 14px' }}>
        {/* 背景轨道 */}
        <div style={{
          position: 'absolute',
          left: 14, right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          height: 8,
          borderRadius: 4,
          background: 'rgba(0,0,0,0.07)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
        }} />

        {/* 中点标记 */}
        <div style={{
          position: 'absolute',
          left: `calc(14px + ${midPct}% - ${midPct * 28 / 100}px)`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 2,
          height: 16,
          background: 'rgba(0,0,0,0.15)',
          borderRadius: 1
        }} />

        {/* 已选填充段（从中点向选中方向） */}
        {selected && (
          <div style={{
            position: 'absolute',
            left: `calc(14px + ${fillLeft}% - ${fillLeft * 28 / 100}px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            height: 8,
            width: `calc(${fillWidth}% - ${fillWidth * 28 / 100}px)`,
            background: 'linear-gradient(90deg,#c8a8ff,#ff9ecf)',
            borderRadius: 4,
            transition: dragging ? 'none' : 'all .2s'
          }} />
        )}

        {/* 刻度点（可点击） */}
        <div style={{
          position: 'absolute',
          left: 14, right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          {sorted.map((opt) => {
            const isCurrent = selected && opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                aria-label={opt.label}
                title={opt.label}
                style={{
                  pointerEvents: 'auto',
                  width: 10, height: 10,
                  borderRadius: '50%',
                  border: '2px solid rgba(0,0,0,0.18)',
                  background: '#fff',
                  cursor: 'pointer',
                  padding: 0,
                  opacity: isCurrent ? 0 : 1, // 选中时被大手柄盖住
                  transition: 'opacity .15s'
                }}
              />
            );
          })}
        </div>

        {/* 大号手柄（视觉） */}
        <div style={{
          position: 'absolute',
          left: `calc(14px + ${handlePct}% - ${handlePct * 28 / 100}px)`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 28, height: 28,
          borderRadius: '50%',
          background: selected
            ? 'linear-gradient(135deg,#a87bff,#ff7ec1)'
            : 'linear-gradient(135deg,#d0d0d0,#bdbdbd)',
          border: '3px solid #fff',
          boxShadow: selected
            ? '0 4px 14px rgba(168,123,255,0.5), 0 0 0 1px rgba(168,123,255,0.3)'
            : '0 3px 10px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
          transition: dragging ? 'none' : 'left .2s, background .2s, box-shadow .2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* 手柄内部三道线，提示"可拖拽" */}
          <div style={{
            display: 'flex', gap: 2,
            opacity: 0.85
          }}>
            <span style={{ width: 2, height: 10, background: '#fff', borderRadius: 1 }} />
            <span style={{ width: 2, height: 10, background: '#fff', borderRadius: 1 }} />
            <span style={{ width: 2, height: 10, background: '#fff', borderRadius: 1 }} />
          </div>
        </div>

        {/* 真正的 range，透明覆盖在最上层处理拖拽 */}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={sliderValue}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          aria-valuetext={selected ? sorted.find((o) => o.value === value)?.label : '未选择'}
          style={{
            position: 'absolute',
            left: 0, right: 0,
            top: 0, bottom: 0,
            width: '100%', height: '100%',
            opacity: 0,
            cursor: dragging ? 'grabbing' : 'grab',
            zIndex: 3,
            margin: 0,
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
        />
      </div>

      {/* 两端文字提示（可点击） */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        marginTop: 8,
        padding: '0 4px'
      }}>
        <LabelButton active={selected && value === min} onClick={() => onChange(min)}>
          ← 非常不符合
        </LabelButton>
        <LabelButton active={selected && value === 0} onClick={() => onChange(0)}>
          说不准
        </LabelButton>
        <LabelButton active={selected && value === max} onClick={() => onChange(max)}>
          非常符合 →
        </LabelButton>
      </div>
    </div>
  );
}

function LabelButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? 'rgba(168,123,255,0.15)' : 'transparent',
        border: 'none',
        padding: '4px 10px',
        borderRadius: 999,
        cursor: 'pointer',
        fontSize: 12,
        color: active ? '#7b4ad6' : 'rgba(0,0,0,0.55)',
        fontWeight: active ? 600 : 400,
        transition: 'all .15s'
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}
