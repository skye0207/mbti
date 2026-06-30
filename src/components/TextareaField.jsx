export default function TextareaField({ label, value, onChange, placeholder, rows = 6 }) {
  return (
    <label className="field field-wide">
      <span className="field-label">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );
}
