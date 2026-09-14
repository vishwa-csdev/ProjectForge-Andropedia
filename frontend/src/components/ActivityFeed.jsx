import React from 'react';
import Avatar from './ui/Avatar';

const ActivityFeed = ({ items = [] }) => {
  if (!items || items.length === 0) {
    return <div className="text-sm text-text-secondary py-4 text-center">No recent activity.</div>;
  }

  return (
    <div className="relative border-l border-white/10 ml-4 pl-6 space-y-6 py-2">
      {items.map((item, idx) => {
        const userName = item.user?.name || item.user_name || 'Operative';
        const actionText = item.action || item.description || '';
        const projectName = item.project_name ? `on ${item.project_name}` : '';
        const timeVal = item.timestamp || item.logged_at;
        const timeStr = timeVal ? new Date(timeVal).toLocaleString() : '—';

        return (
          <div key={item.id || idx} className="relative group">
            <div className="absolute -left-[15px] top-0 bg-base p-0.5 rounded-full border border-white/10 shadow-[0_0_8px_rgba(0,240,255,0.15)] group-hover:border-cyan-400/50 transition-colors">
              <Avatar name={userName} size="sm" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-text-primary">{userName}</span>{' '}
              <span className="text-text-secondary">{actionText}</span>{' '}
              {projectName && <span className="text-cyan-400 font-mono text-xs">{projectName}</span>}
            </div>
            <div className="text-xs font-mono text-text-muted mt-1">
              {timeStr}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
