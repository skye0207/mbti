export default function CheckboxGroup({ label, options, value, onChange }) {
  function toggle(option) {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else {
      onChange([...value, option]);
    }
  }

  return (
    <div className="field field-wide">
      <span className="field-label">{label}</span>
      <div className="chip-grid">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value.includes(option) ? 'chip active' : 'chip'}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
