export default function StatusBadge({ status }) {
  const normalizedStatus = status.toLowerCase();
  const key = {
    valid: "compliant",
    "expiring soon": "expiring-soon",
    expired: "expired",
    missing: "missing",
    compliant: "compliant",
    sent: "compliant",
    scheduled: "expiring-soon",
  }[normalizedStatus] || normalizedStatus.replaceAll(" ", "-");
  return <span className={`status-badge status-${key}`}>{status}</span>;
}
