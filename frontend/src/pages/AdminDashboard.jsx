import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

const Stat = ({ label, value, detail }) => <div className="bg-surface/70 border border-white/10 rounded-2xl p-5"><div className="text-xs font-mono uppercase tracking-widest text-text-muted">{label}</div><div className="text-3xl font-display font-bold text-cyan-300 mt-2">{value}</div>{detail && <div className="text-xs font-mono text-text-secondary mt-1">{detail}</div>}</div>;

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    try {
      const [statsData, usersData, projectsData] = await Promise.all([api.get('/admin/stats'), api.get(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`), api.get('/admin/projects')]);
      setStats(statsData); setUsers(usersData.items); setProjects(projectsData);
    } catch (requestError) { setError(requestError.message); }
  };

  useEffect(() => { if (user && user.role !== 'admin') navigate('/'); }, [user, navigate]);
  useEffect(() => { if (user?.role === 'admin') load(); }, [user, search]);

  const updateRole = async (operative) => { if (!window.confirm(`Change ${operative.name}'s role?`)) return; await api.put(`/admin/users/${operative.id}/role`, { role: operative.role === 'admin' ? 'user' : 'admin' }); load(); };
  const deleteUser = async (operative) => { if (!window.confirm(`Delete ${operative.name}'s account?`)) return; await api.delete(`/admin/users/${operative.id}`); load(); };
  const deleteProject = async (project) => { if (!window.confirm(`Purge ${project.name}?`)) return; await api.delete(`/admin/projects/${project.id}`); load(); };
  const updateProject = async (project, changes) => { await api.put(`/admin/projects/${project.id}`, changes); load(); };
  const resetWorkspace = async () => {
    if (resetConfirmation !== 'RESET ANDROPEDIA') return;
    setResetting(true);
    setError('');
    try { await api.post('/admin/reset-workspace', { confirmation: resetConfirmation }); setResetConfirmation(''); await load(); }
    catch (requestError) { setError(requestError.message); }
    finally { setResetting(false); }
  };

  if (!user || user.role !== 'admin') return null;
  return <div className="space-y-8">
    <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><div className="text-xs font-mono text-cyan-400 uppercase tracking-[0.25em]">Central Club Oversight</div><h1 className="text-3xl font-display font-bold mt-2">Admin Command Deck</h1><p className="text-text-secondary mt-1">Global telemetry and mission governance.</p></div><div className="text-xs font-mono text-emerald-400">● NETWORK NOMINAL</div></header>
    {error && <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>}
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">{stats && <><Stat label="Operatives" value={stats.operatives} /><Stat label="Active Missions" value={stats.active_projects} detail={`${stats.archived_projects} archived`} /><Stat label="Cleared Tasks" value={stats.completed_milestones} detail={`${stats.completion_rate}% completion`} /><Stat label="Stored Artifacts" value={stats.resources} detail={`${stats.contributions} contributions`} /></>}</section>
    <section className="bg-surface/60 border border-white/10 rounded-2xl overflow-hidden"><div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h2 className="font-display text-lg font-bold">Operative Directory</h2><p className="text-xs text-text-secondary mt-1">Promote, demote, or remove global accounts.</p></div><Input aria-label="Search operatives" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} className="sm:max-w-xs" /></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs font-mono uppercase text-text-muted"><tr><th className="p-4">Operative</th><th className="p-4">Role</th><th className="p-4">Projects</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{users.map((operative) => <tr key={operative.id} className="border-t border-white/5"><td className="p-4"><div className="font-medium">{operative.name}</div><div className="text-xs text-text-secondary">{operative.email}</div></td><td className="p-4"><span className={`px-2 py-1 rounded-md text-xs font-mono ${operative.role === 'admin' ? 'text-amber-300 bg-amber-400/10' : 'text-cyan-300 bg-cyan-400/10'}`}>{operative.role}</span></td><td className="p-4 text-text-secondary">{operative.project_count}</td><td className="p-4"><div className="flex justify-end gap-2"><Button size="sm" variant="secondary" onClick={() => updateRole(operative)}>{operative.role === 'admin' ? 'Demote' : 'Promote'}</Button>{operative.id !== user.id && <Button size="sm" variant="danger" onClick={() => deleteUser(operative)}>Delete</Button>}</div></td></tr>)}</tbody></table></div></section>
    <section className="bg-surface/60 border border-white/10 rounded-2xl overflow-hidden"><div className="p-5 border-b border-white/10"><h2 className="font-display text-lg font-bold">Global Mission Registry</h2><p className="text-xs text-text-secondary mt-1">All visibility modes and archived missions included.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs font-mono uppercase text-text-muted"><tr><th className="p-4">Mission</th><th className="p-4">Lead</th><th className="p-4">Status</th><th className="p-4">Signal</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{projects.map((project) => <tr key={project.id} className="border-t border-white/5"><td className="p-4 font-medium"><button className="text-cyan-300 hover:text-cyan-200" onClick={() => navigate(`/projects/${project.id}`)}>{project.name}</button></td><td className="p-4"><select aria-label={`Lead for ${project.name}`} className="bg-base border border-white/10 rounded-lg px-2 py-1 text-xs" value={project.members.find((member) => member.role === 'lead')?.id || ''} onChange={(event) => updateProject(project, { lead_user_id: Number(event.target.value) })}><option value="">Unassigned</option>{project.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></td><td className="p-4"><select aria-label={`Status for ${project.name}`} className="bg-base border border-white/10 rounded-lg px-2 py-1 text-xs" value={project.status} onChange={(event) => updateProject(project, { status: event.target.value })}><option value="active">active</option><option value="archived">archived</option></select></td><td className="p-4 text-text-secondary">{project.member_count} members / {project.task_count} tasks</td><td className="p-4 text-right"><Button size="sm" variant="danger" onClick={() => deleteProject(project)}>Purge</Button></td></tr>)}</tbody></table></div></section>
    <section className="rounded-2xl border border-danger/25 bg-danger/[0.04] p-5"><h2 className="font-display text-lg font-bold text-danger">Danger zone</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-text-secondary">Reset all workspace data, remove every other account, and create one clean test project owned by your current admin account. This cannot be undone.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"><Input label="Confirmation phrase" placeholder="RESET ANDROPEDIA" value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} /><Button variant="danger" disabled={resetConfirmation !== 'RESET ANDROPEDIA' || resetting} onClick={resetWorkspace}>{resetting ? 'Resetting...' : 'Reset workspace'}</Button></div></section>
  </div>;
};

export default AdminDashboard;