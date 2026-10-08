export default function StatCard({ label, value, helper, status, icon: Icon, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className={`stat-label ${status || ""}`}>{label}</span>
        {Icon && <div className="stat-icon"><Icon size={18} /></div>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-helper">{helper}</div>
      {trend && <span className="stat-trend">{trend}</span>}
    </div>
  );
}
