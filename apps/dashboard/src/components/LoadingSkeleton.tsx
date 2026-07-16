interface LoadingSkeletonProps {
  count?: number;
  type?: 'card' | 'stat';
}

export function LoadingSkeleton({ count = 4, type = 'card' }: LoadingSkeletonProps) {
  if (type === 'stat') {
    return (
      <div className="skeleton-grid-stats">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="skeleton-stat">
            <div className="skeleton skeleton-stat-icon" />
            <div className="skeleton-stat-body">
              <div className="skeleton skeleton-line skeleton-line-lg" />
              <div className="skeleton skeleton-line skeleton-line-sm" style={{ marginTop: 6 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton skeleton-line skeleton-line-lg" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line-sm" />
          <div className="skeleton skeleton-line" />
        </div>
      ))}
    </div>
  );
}
