import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Avatar from './Avatar';
import Button from './Button';
import Badge from './Badge';
import { Activity, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, ShieldCheck, UserRound, X, FolderKanban } from 'lucide-react';

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Profile', path: '/profile', icon: UserRound },
    ...(user?.role === 'admin' ? [{ name: 'Admin Deck', path: '/admin', icon: ShieldCheck }] : []),
  ];

  const handleNav = (path) => {
    navigate(path);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`bg-surface/90 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0 w-64' : 'max-md:-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 h-16 bg-white/[0.02]">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-amber-400 flex items-center justify-center text-gray-950 font-bold font-mono text-sm shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                AH
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-sm tracking-wider text-text-primary uppercase">
                  Andropedia
                </span>
                <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase">
                  Command Hub
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-cyan-400 to-amber-400 flex items-center justify-center text-gray-950 font-bold font-mono text-sm shadow-[0_0_12px_rgba(0,240,255,0.4)]">
              AH
            </div>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-text-secondary hover:text-cyan-400 p-1.5 rounded-md hover:bg-white/5 cursor-pointer hidden md:block transition-colors"
            title={collapsed ? 'Expand deck' : 'Collapse deck'}
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
          
          {/* Mobile close toggle */}
          <button
            onClick={() => setMobileOpen(false)}
            className="text-text-secondary hover:text-text-primary p-1 cursor-pointer md:hidden text-2xl leading-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Telemetry Status Bar */}
        {(!collapsed || mobileOpen) && (
          <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-black/20">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Network</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981] animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider uppercase">Live Link</span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 py-4 flex flex-col gap-1.5 px-3">
          {navItems.map((item) => {
            const active =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer relative group ${
                  active
                    ? 'bg-elevated text-cyan-300 font-medium border border-cyan-400/30 shadow-[inset_0_0_15px_rgba(0,240,255,0.06)]'
                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary border border-transparent'
                }`}
                title={collapsed && !mobileOpen ? item.name : undefined}
              >
                <span className={`transition-transform duration-200 group-hover:scale-110 ${active ? 'text-cyan-400' : 'text-text-muted'}`}>
                  <item.icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                {(!collapsed || mobileOpen) && (
                  <span className="text-sm font-medium tracking-wide">{item.name}</span>
                )}
                {active && (!collapsed || mobileOpen) && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#00F0FF]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Identity & Logout Deck */}
        <div className="p-3.5 border-t border-white/10 flex flex-col gap-3 bg-white/[0.01]">
          <div
            onClick={() => handleNav('/profile')}
            className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-xl border border-transparent hover:border-white/10 transition-all"
          >
            <Avatar name={user?.name || 'User'} size="sm" />
            {(!collapsed || mobileOpen) && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary truncate">
                  {user?.name || 'User'}
                </div>
                <div className="text-[11px] font-mono text-cyan-400/70 truncate flex items-center gap-1">
                  <span className="uppercase">{user?.role || 'member'}</span>
                </div>
              </div>
            )}
          </div>
          {(!collapsed || mobileOpen) && (
            <Button variant="secondary" size="sm" onClick={logout} className="w-full text-xs font-mono">
              <LogOut size={14} /> Disconnect Session
            </Button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
