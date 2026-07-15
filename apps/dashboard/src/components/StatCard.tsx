interface StatCardProps {
  label: string;
  value: number | string;
  loading: boolean;
}

export function StatCard({ label, value, loading }: StatCardProps) {
  return (
    <div className="stat-card">
      {loading ? (
        <div className="skeleton stat-skeleton" />
      ) : (
        <div className="stat-value">{value}</div>
      )}
      <div className="stat-label">{label}</div>
    </div>
  );
}
