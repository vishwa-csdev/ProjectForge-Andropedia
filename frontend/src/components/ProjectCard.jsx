import React from 'react';
import { Link } from 'react-router-dom';
import Card from './ui/Card';
import ProgressDial from './ProgressDial';
import DeadlineBadge from './DeadlineBadge';

const ProjectCard = ({ project }) => {
  const { id, name, description, status, progress, member_count, task_count, deadline } = project;

  let statusColor = 'archived';
  if (status === 'active') statusColor = 'cyan';
  else if (status === 'completed') statusColor = 'success';

  return (
    <Link to={`/projects/${id}`} className="block group">
      <Card statusColor={statusColor} elevated className="h-full flex flex-col surface-hover">
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold text-text-primary truncate group-hover:text-cyan-300 transition-colors">
              {name}
            </h3>
            <p className="text-text-secondary text-sm line-clamp-2 mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>
          <div className="shrink-0">
            <ProgressDial size={48} percentage={progress || 0} />
          </div>
        </div>
        
        <div className="mt-auto pt-3.5 flex items-center justify-between border-t border-white/5">
          <div className="flex gap-4 text-xs font-mono text-text-muted">
            <span className="flex items-center gap-1">
              <span className="text-cyan-400">◈</span> {member_count || 0} crew
            </span>
            <span className="flex items-center gap-1">
              <span className="text-amber-400">⬢</span> {task_count || 0} milestones
            </span>
          </div>
          {deadline && <DeadlineBadge dateString={deadline} />}
        </div>
      </Card>
    </Link>
  );
};

export default ProjectCard;
