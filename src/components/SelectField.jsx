export default function SelectField({ label, value, onChange, options, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}
