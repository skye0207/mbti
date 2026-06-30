export default function Button({ children, variant = 'primary', loading = false, disabled = false, className = '', ...props }) {
  return (
    <button className={`btn btn-${variant} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? '正在中译中...' : children}
    </button>
  );
}
