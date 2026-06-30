export default function Card({ children, className = '', badge }) {
  return (
    <section className={`card ${className}`}>
      {badge ? <span className="card-badge">{badge}</span> : null}
      {children}
    </section>
  );
}
