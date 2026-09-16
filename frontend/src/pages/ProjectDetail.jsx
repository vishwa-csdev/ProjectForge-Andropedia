import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import ProgressDial from '../components/ProgressDial';
import DeadlineBadge from '../components/DeadlineBadge';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import MemberControlPanel from '../components/MemberControlPanel';
import { ArrowLeft } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'team_control'
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', status: 'active', deadline: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const fetchProject = async () => {
    try {
      const data = await api.get(`/projects/${id}`);
      setProject(data);
      setEditFormData({
        name: data.name || '',
        description: data.description || '',
        status: data.status || 'active',
        deadline: data.deadline ? data.deadline.slice(0, 10) : '',
      });
    } catch (e) {
      console.error('Failed to fetch project', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="text-text-secondary p-12 text-center font-mono text-sm">
        Establishing telemetry link with project mainframe...
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="text-center py-16 text-danger font-mono text-sm">
        Project record not found in central database.
      </Card>
    );
  }

  const currentMember = project.members?.find(m => m.id === user?.id);
  const isLead = currentMember?.role === 'lead' || user?.role === 'admin';
  const isMember = !!currentMember;

  const handleJoin = async () => {
    try {
      await api.post(`/projects/${id}/join`);
      await fetchProject();
    } catch (e) {
      console.error('Failed to join', e);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this project team?')) return;
    try {
      await api.post(`/projects/${id}/leave`);
      await fetchProject();
    } catch (e) {
      console.error('Failed to leave', e);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setSavingEdit(true);
    try {
      await api.put(`/projects/${id}`, {
        name: editFormData.name,
        description: editFormData.description,
        status: editFormData.status,
        deadline: editFormData.deadline ? new Date(editFormData.deadline).toISOString() : null,
      });
      setShowEditModal(false);
      await fetchProject();
    } catch (err) {
      setEditError(err.message || 'Failed to update project');
    } finally {
      setSavingEdit(false);
    }
  };

  const externalTabs = [
    { name: 'Tasks Board', path: `/projects/${id}/tasks`, icon: '⬢' },
    { name: 'Assets & Files', path: `/projects/${id}/resources`, icon: '◈' },
    { name: 'Contribution Log', path: `/projects/${id}/contributions`, icon: '⚡' },
    { name: 'Mission Report', path: `/projects/${id}/report`, icon: '📄' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Top Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider group py-1"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>All Missions / Projects</span>
        </Link>
      </div>

      {/* Spacecraft Project HUD Header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center p-6 rounded-2xl bg-surface/80 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Subtle glowing ambient gradient */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex-1 min-w-0 flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl font-bold text-text-primary tracking-wide break-words">
              {project.name}
            </h1>
            <Badge type={project.status === 'active' ? 'active' : 'archived'}>
              {project.status}
            </Badge>
            <Badge type="lead">
              {project.visibility}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono text-text-secondary flex-wrap">
            {project.deadline && (
              <div className="flex items-center gap-1.5">
                <span className="text-text-muted">DEADLINE:</span>
                <DeadlineBadge dateString={project.deadline} />
              </div>
            )}
            <div>
              <span className="text-text-muted">CREW:</span>{' '}
              <span className="text-text-primary font-bold">{project.members?.length || 0}</span>
            </div>

            {isLead && (
              <Button size="sm" variant="secondary" onClick={() => setShowEditModal(true)} className="ml-auto">
                Configure Project
              </Button>
            )}
          </div>
        </div>
        
        <div className="shrink-0 flex items-center justify-center relative z-10">
          <ProgressDial 
            size={160} 
            percentage={project.progress || 0} 
            nearDeadline={project.deadline && (new Date(project.deadline) - new Date() < 3 * 86400000)} 
            label="complete" 
          />
        </div>
      </div>

      {/* Primary Subsystem Navigation Rail */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer border whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 glow-cyan'
              : 'bg-surface/60 text-text-secondary border-white/5 hover:text-text-primary'
          }`}
        >
          MISSION OVERVIEW
        </button>

        <button
          onClick={() => setActiveTab('team_control')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer border whitespace-nowrap ${
            activeTab === 'team_control'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 glow-cyan'
              : 'bg-surface/60 text-text-secondary border-white/5 hover:text-text-primary'
          }`}
        >
          {isLead ? 'CREW COMMAND DECK' : 'CREW ROSTER'} ({project.members?.length || 0})
        </button>

        {externalTabs.map(tab => (
          <Link
            key={tab.name}
            to={tab.path}
            className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-text-secondary border border-white/5 hover:text-text-primary hover:border-white/15 bg-surface/60 transition-all whitespace-nowrap flex items-center gap-1.5"
          >
            <span>{tab.icon}</span>
            <span>{tab.name.toUpperCase()}</span>
          </Link>
        ))}
      </div>

      {/* Dynamic Tab Body */}
      {activeTab === 'team_control' ? (
        <MemberControlPanel project={project} onProjectUpdated={fetchProject} />
      ) : (
        /* Overview View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card elevated>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                <span className="text-cyan-400 font-mono text-sm">◈</span>
                <h2 className="font-display text-lg font-semibold text-text-primary tracking-wide">
                  Mission Directives & Objective
                </h2>
              </div>
              <p className="text-text-secondary whitespace-pre-line leading-relaxed text-sm">
                {project.description || 'No detailed specifications filed.'}
              </p>
            </Card>

            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-accent font-mono text-sm">⚡</span>
                <h3 className="font-display text-base font-semibold text-text-primary">
                  Subsystem Shortcuts
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link to={`/projects/${id}/tasks`} className="p-3.5 rounded-xl bg-base border border-white/5 hover:border-cyan-400/30 surface-hover block">
                  <div className="font-semibold text-sm text-text-primary">Kanban Task Board</div>
                  <div className="text-xs text-text-muted mt-1">Assign, track, and complete mission milestones.</div>
                </Link>
                <Link to={`/projects/${id}/resources`} className="p-3.5 rounded-xl bg-base border border-white/5 hover:border-cyan-400/30 surface-hover block">
                  <div className="font-semibold text-sm text-text-primary">Asset & Resource Storage</div>
                  <div className="text-xs text-text-muted mt-1">Shared binaries, CAD blueprints, and code links.</div>
                </Link>
                <Link to={`/projects/${id}/contributions`} className="p-3.5 rounded-xl bg-base border border-white/5 hover:border-cyan-400/30 surface-hover block">
                  <div className="font-semibold text-sm text-text-primary">Contribution Log</div>
                  <div className="text-xs text-text-muted mt-1">Record technical effort and view orbital feed.</div>
                </Link>
                <Link to={`/projects/${id}/report`} className="p-3.5 rounded-xl bg-base border border-white/5 hover:border-cyan-400/30 surface-hover block">
                  <div className="font-semibold text-sm text-text-primary">Mission PDF Report</div>
                  <div className="text-xs text-text-muted mt-1">One-click server export with telemetry tables.</div>
                </Link>
              </div>
            </Card>
          </div>

          {/* Quick Member Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <Card className="flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="font-display text-base font-semibold text-text-primary">Crew Members</h3>
                <button
                  onClick={() => setActiveTab('team_control')}
                  className="text-xs font-mono text-cyan-400 hover:underline cursor-pointer"
                >
                  Manage
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {project.members?.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar name={member.name} size="sm" />
                    <div className="flex-1 text-sm font-medium text-text-primary truncate">
                      {member.name}
                    </div>
                    <Badge type={member.role === 'lead' ? 'lead' : 'member'}>
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-2 pt-3 border-t border-white/10">
                {!isMember && project.visibility === 'open' && (
                  <Button variant="cyan" className="w-full" onClick={handleJoin}>
                    Enlist in Project
                  </Button>
                )}
                {isMember && !isLead && (
                  <Button variant="danger" className="w-full text-xs font-mono" onClick={handleLeave}>
                    Disembark Project
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <Modal title="Configure Project Parameters" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
            <Input
              label="Project Call-Sign / Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />

            <Input
              label="Mission Directives / Description"
              textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              className="min-h-[120px]"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="bg-base border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-400/50 w-full"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <Input
                label="Target Deadline"
                type="date"
                value={editFormData.deadline}
                onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
              />
            </div>

            {editError && (
              <div className="text-danger font-mono text-xs p-2.5 rounded-lg bg-danger/10 border border-danger/20">
                {editError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="cyan" disabled={savingEdit}>
                {savingEdit ? 'Saving...' : 'Update Parameters'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProjectDetail;
