import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './ui/Sidebar';
import Avatar from './ui/Avatar';
import { Bell, Menu, Search } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="flex flex-1 justify-end items-center gap-3 sm:gap-5"><label className="topbar-search hidden sm:flex items-center gap-2"><Search size={14} className="text-text-muted" /><input aria-label="Search workspace" placeholder="Search workspace" /><kbd>⌘ K</kbd></label><button aria-label="Notifications" className="notification-button"><Bell size={17} /><span /></button><Link to="/profile" className="flex items-center gap-2"><Avatar name={user?.name || 'User'} size="sm" /><span className="hidden lg:block text-xs font-medium text-text-secondary">{user?.name}</span></Link></div>
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
