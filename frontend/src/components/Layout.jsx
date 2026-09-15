import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './ui/Sidebar';
import Avatar from './ui/Avatar';
import { Bell, Menu, Search, Check, ArrowUpRight } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Workspace ready', detail: 'Your club dashboard is online.', href: '/' },
    { id: 2, title: 'Library added', detail: 'Browse shared club references.', href: '/library' },
  ]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center text-text-secondary font-mono text-sm">
        Authenticating...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const markNotificationRead = (id) => setNotifications((items) => items.filter((item) => item.id !== id));

  return (
    <div className="min-h-screen bg-base flex flex-col md:flex-row text-text-primary">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main canvas area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <header className="app-topbar flex items-center justify-between px-4 sm:px-6 h-16 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-text-secondary hover:text-cyan-300 cursor-pointer text-xl md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-text-muted"><span className="text-cyan-300">AH</span> Workspace <span className="text-white/20">/</span> Overview</div>
          <div className="flex flex-1 justify-end items-center gap-3 sm:gap-5"><label className="topbar-search hidden sm:flex items-center gap-2"><Search size={14} className="text-text-muted" /><input aria-label="Search workspace" placeholder="Search workspace" /><kbd>⌘ K</kbd></label><div className="notification-wrap"><button aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className={`notification-button ${notificationsOpen ? 'is-open' : ''}`}><Bell size={18} strokeWidth={1.9} />{notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}</button>{notificationsOpen && <div className="notification-tray"><div className="notification-tray-header"><div><strong>Notifications</strong><small>{notifications.length ? `${notifications.length} unread` : 'All caught up'}</small></div><Check size={16} className="text-cyan-300" /></div>{notifications.length ? notifications.map((item) => <Link key={item.id} to={item.href} className="notification-item" onClick={() => markNotificationRead(item.id)}><span className="notification-dot" /><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowUpRight size={14} /></Link>) : <div className="notification-empty">No new signals.</div>}</div>}</div><Link to="/profile" className="flex items-center gap-2"><Avatar name={user?.name || 'User'} size="sm" /><span className="hidden lg:block text-xs font-medium text-text-secondary">{user?.name}</span></Link></div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
