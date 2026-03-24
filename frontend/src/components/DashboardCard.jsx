export default function DashboardCard({ eyebrow, value, label, accent = "green" }) {
  return (
    <article className={`dashboard-card dashboard-card--${accent}`}>
      <p className="section-label">{eyebrow}</p>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}
