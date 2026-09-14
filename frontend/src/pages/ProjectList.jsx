import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const ProjectList = () => {
  const [filter, setFilter] = useState('active'); // active, my, archived
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/projects?filter=${filter}`);
        setProjects(data || []);
      } catch (e) {
        console.error('Failed to fetch projects', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [filter]);

  const tabs = [
    { id: 'active', label: 'Active Missions' },
    { id: 'my', label: 'My Projects' },
    { id: 'archived', label: 'Archived / Decommissioned' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-sm">◈</span>
            <h1 className="font-display text-2xl font-bold text-text-primary tracking-wide">
              Missions Registry
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-0.5 font-mono">
            {projects.length} PROJECTS CATALOGED
          </p>
        </div>

        <Link to="/projects/new">
          <Button variant="cyan">Initiate Project</Button>
        </Link>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer border whitespace-nowrap ${
              filter === tab.id 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 glow-cyan font-semibold' 
                : 'bg-surface/60 text-text-secondary border-white/5 hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-text-secondary p-12 text-center font-mono text-sm">
          Querying project database...
        </div>
      ) : projects.length === 0 ? (
        <Card className="text-center py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
            🛰️
          </div>
          <h3 className="font-display font-semibold text-text-primary text-base">
            No projects found in this sector
          </h3>
          <p className="text-xs text-text-secondary max-w-sm">
            Adjust the filter query or initialize a new project to start collaborating.
          </p>
          <Link to="/projects/new" className="mt-2">
            <Button variant="cyan" size="sm">Initiate Project</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
