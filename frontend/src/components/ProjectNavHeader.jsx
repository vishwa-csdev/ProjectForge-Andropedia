import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Badge from './ui/Badge';
import DeadlineBadge from './DeadlineBadge';
import { ArrowLeft, CheckSquare, FileBarChart, Files, FolderKanban, Info } from 'lucide-react';

const ProjectNavHeader = ({ project, activeTab, children }) => {
  const location = useLocation();
  const id = project?.id;

  const tabs = [
    { id: 'overview', name: 'Overview', path: `/projects/${id}`, icon: Info },
    { id: 'tasks', name: 'Tasks Board', path: `/projects/${id}/tasks`, icon: CheckSquare },
    { id: 'resources', name: 'Assets & Files', path: `/projects/${id}/resources`, icon: Files },
    { id: 'contributions', name: 'Contributions', path: `/projects/${id}/contributions`, icon: FolderKanban },
    { id: 'report', name: 'Mission Report', path: `/projects/${id}/report`, icon: FileBarChart },
  ];

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider group py-1"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>All Missions / Projects</span>
        </Link>

        {project && (
          <div className="flex items-center gap-2">
            <Badge type={project.status === 'active' ? 'active' : 'archived'}>
              {project.status}
            </Badge>
            {project.visibility && (
              <Badge type="lead">{project.visibility}</Badge>
            )}
            {project.deadline && (
              <div className="hidden sm:flex items-center gap-1 text-xs font-mono">
                <span className="text-text-muted">DUE:</span>
                <DeadlineBadge dateString={project.deadline} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Project Identity & Actions Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-wide break-words">
              {project?.name || 'Mission Project'}
            </h1>
            {project?.description && (
              <p className="text-text-secondary text-xs sm:text-sm mt-1 line-clamp-2 max-w-3xl">
                {project.description}
              </p>
            )}
          </div>
          {children && (
            <div className="flex items-center gap-3 shrink-0">
              {children}
            </div>
          )}
        </div>

        {/* Unified Project Navigation Tabs */}
        {id && (
          <div className="flex gap-1 sm:gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab ? activeTab === tab.id : location.pathname === tab.path;
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 glow-cyan font-bold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-cyan-300' : 'text-text-muted'} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectNavHeader;
