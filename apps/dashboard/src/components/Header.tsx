interface HeaderProps {
  connected: boolean;
}

export function Header({ connected }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Token Intelligence AI</h1>
        <span className="header-subtitle">Real-time token discovery platform</span>
      </div>
      <div className="header-right">
        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
        <span className="status-text">{connected ? 'Connected' : 'Reconnecting...'}</span>
      </div>
    </header>
  );
}
