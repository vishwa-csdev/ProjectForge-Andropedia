import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './ui/Sidebar';
import Avatar from './ui/Avatar';
import { api } from '../api';
import { Bell, Menu, Search, Check, ArrowUpRight } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('andropedia-read-notifications') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return undefined;

    let active = true;
    const loadNotifications = async () => {
      try {
        const items = await api.get('/dashboard/notifications');
        if (active) setNotifications(items || []);
      } catch (error) {
        console.error('Unable to load notifications', error);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user]);

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

  const unreadNotifications = notifications.filter((item) => !readNotificationIds.includes(item.id));
  const markNotificationRead = (id) => {
    const next = [...new Set([...readNotificationIds, id])];
    setReadNotificationIds(next);
    localStorage.setItem('andropedia-read-notifications', JSON.stringify(next.slice(-100)));
  };
  const markAllNotificationsRead = () => {
    const next = [...new Set([...readNotificationIds, ...notifications.map((item) => item.id)])];
    setReadNotificationIds(next);
    localStorage.setItem('andropedia-read-notifications', JSON.stringify(next.slice(-100)));
  };

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
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-text-muted"><img src="/andropedia-logo.jpg" alt="Andropedia" className="w-6 h-6 rounded-md object-cover object-top" /> Workspace <span className="text-white/20">/</span> Overview</div>
          <div className="flex flex-1 justify-end items-center gap-3 sm:gap-5"><label className="topbar-search hidden sm:flex items-center gap-2"><Search size={14} className="text-text-muted" /><input aria-label="Search workspace" placeholder="Search workspace" /><kbd>⌘ K</kbd></label><div className="notification-wrap"><button aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className={`notification-button ${notificationsOpen ? 'is-open' : ''}`}><Bell size={18} strokeWidth={1.9} />{unreadNotifications.length > 0 && <span className="notification-count">{unreadNotifications.length}</span>}</button>{notificationsOpen && <div className="notification-tray"><div className="notification-tray-header"><div><strong>Notifications</strong><small>{unreadNotifications.length ? `${unreadNotifications.length} unread` : 'All caught up'}</small></div>{unreadNotifications.length > 0 ? <button aria-label="Mark all notifications read" onClick={markAllNotificationsRead} className="text-cyan-300 hover:text-white"><Check size={16} /></button> : <Check size={16} className="text-cyan-300" />}</div>{notifications.length ? notifications.map((item) => <Link key={item.id} to={item.href} className={`notification-item ${readNotificationIds.includes(item.id) ? 'is-read' : ''}`} onClick={() => markNotificationRead(item.id)}><span className="notification-dot" /><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowUpRight size={14} /></Link>) : <div className="notification-empty">No new notifications.</div>}</div>}</div><Link to="/profile" className="flex items-center gap-2"><Avatar name={user?.name || 'User'} size="sm" /><span className="hidden lg:block text-xs font-medium text-text-secondary">{user?.name}</span></Link></div>
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
