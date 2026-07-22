import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Link2,
  Settings,
  X,
  Shield,
  Users,
  Brain,
  Wallet,
  TrendingUp,
  Star,
  DollarSign,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tokens', label: 'Tokens', icon: Search },
  { id: 'b20', label: 'B20 Intelligence', icon: Shield },
  { id: 'intelligence', label: 'AI Intelligence', icon: Brain },
  { id: 'wallets', label: 'Wallet Intelligence', icon: Wallet },
  { id: 'deployers', label: 'Deployers', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'funding', label: 'Funding', icon: DollarSign },
  { id: 'smartmoney', label: 'Smart Money', icon: Star },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'chains', label: 'Chains', icon: Link2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeView, onNavigate, open, onClose }: SidebarProps) {
  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="nav-brand-icon">TI</div>
          <span className="nav-brand-text">TokenIntel</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth <= 1024) onClose();
                }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon className="nav-item-icon" />
                {item.label}
              </motion.button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <X className="nav-item-icon" />
            Close
          </button>
        </div>
      </aside>
    </>
  );
}
