import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, CircleAlert, Database, FolderKanban, Search, ShieldCheck, Trash2, UserRound, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';

const PAGE_SIZE = 8;

const Stat = ({ label, value, detail, icon: Icon, tone = 'teal' }) => (
  <div className={`admin-stat admin-stat-${tone}`}>
    <div className="flex items-center justify-between"><span className="admin-eyebrow">{label}</span><Icon size={19} /></div>
    <strong>{value}</strong>
    <span>{detail}</span>
  </div>
);

const SortButton = ({ label, field, sort, onSort }) => (
  <button type="button" className="admin-sort" onClick={() => onSort(field)}>
    {label}
    {sort.field === field && (sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
  </button>
);

const Pagination = ({ page, total, onChange }) => {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages === 1) return null;
  return <div className="admin-pagination"><span>Page {page} of {pages}</span><div><button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft size={15} /></button><button type="button" disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight size={15} /></button></div></div>;
};

const EmptyTable = ({ message }) => <div className="admin-table-empty"><Database size={22} /><span>{message}</span></div>;

const ConfirmModal = ({ action, onCancel, onConfirm, busy }) => {
  if (!action) return null;
  const isDelete = action.kind === 'delete-user';
  return <div className="admin-modal-backdrop" role="presentation" onClick={onCancel}><div className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}><button type="button" className="admin-modal-close" onClick={onCancel} aria-label="Close confirmation"><X size={17} /></button><div className="admin-danger-icon"><Trash2 size={20} /></div><span className="admin-eyebrow">Destructive command</span><h2 id="confirm-title">{isDelete ? 'Delete operative account?' : 'Purge mission?'}</h2><p>{isDelete ? `This will permanently remove ${action.label}'s account and their project ownership data.` : `This will permanently remove ${action.label} and all tasks, resources, and contributions inside it.`}</p><div className="admin-confirm-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'Executing...' : isDelete ? 'Delete operative' : 'Purge mission'}</Button></div></div></div>;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  const [userSort, setUserSort] = useState({ field: 'name', direction: 'asc' });
  const [projectSort, setProjectSort] = useState({ field: 'name', direction: 'asc' });

  const load = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, projectsData] = await Promise.all([api.get('/admin/stats'), api.get(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`), api.get('/admin/projects')]);
      setStats(statsData); setUsers(usersData.items || []); setProjects(projectsData || []); setError('');
    } catch (requestError) { setError(requestError.message); } finally { setLoading(false); }
  };

  useEffect(() => { if (user && user.role !== 'admin') navigate('/'); }, [user, navigate]);
  useEffect(() => { if (user?.role === 'admin') { setUserPage(1); load(); } }, [user, search]);

  const sortRows = (rows, sort) => [...rows].sort((a, b) => { const aValue = sort.field === 'lead' ? a.creator_name : a[sort.field]; const bValue = sort.field === 'lead' ? b.creator_name : b[sort.field]; return String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1); });
  const sortedUsers = useMemo(() => sortRows(users, userSort), [users, userSort]);
  const sortedProjects = useMemo(() => sortRows(projects, projectSort), [projects, projectSort]);
  const visibleUsers = sortedUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);
  const visibleProjects = sortedProjects.slice((projectPage - 1) * PAGE_SIZE, projectPage * PAGE_SIZE);

  const toggleSort = (setter, current, field) => setter({ field, direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc' });
  const updateRole = async (operative) => { await api.put(`/admin/users/${operative.id}/role`, { role: operative.role === 'admin' ? 'user' : 'admin' }); await load(); };
  const updateProject = async (project, changes) => { await api.put(`/admin/projects/${project.id}`, changes); await load(); };
  const executeDestructiveAction = async () => {
    setBusy(true);
    try { if (action.kind === 'delete-user') await api.delete(`/admin/users/${action.id}`); else await api.delete(`/admin/projects/${action.id}`); setAction(null); await load(); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };

  if (!user || user.role !== 'admin') return null;
  return <div className="admin-page">
    <header className="admin-header"><div><div className="admin-kicker"><ShieldCheck size={15} /> Central Club Oversight</div><h1>Admin Command Deck<span>.</span></h1><p>Global telemetry and mission governance.</p></div><div className="admin-network"><span /> Network nominal</div></header>
    {error && <div className="admin-error"><CircleAlert size={16} /> {error}</div>}
    <section className="admin-stats">{loading ? [1, 2, 3, 4].map((item) => <div className="admin-stat-skeleton" key={item} />) : <><Stat label="Operatives" value={stats?.operatives ?? 0} detail="registered accounts" icon={Users} /><Stat label="Active missions" value={stats?.active_projects ?? 0} detail={`${stats?.archived_projects ?? 0} archived`} icon={FolderKanban} tone="amber" /><Stat label="Cleared tasks" value={stats?.completed_milestones ?? 0} detail={`${stats?.completion_rate ?? 0}% completion`} icon={Check} /><Stat label="Stored artifacts" value={stats?.resources ?? 0} detail={`${stats?.contributions ?? 0} contributions`} icon={Database} tone="amber" /></>}</section>

    <section className="admin-panel"><div className="admin-panel-header"><div><span className="admin-eyebrow">01 / Access control</span><h2>Operative Directory</h2><p>Promote, demote, or remove global accounts.</p></div><label className="admin-search"><Search size={16} /><input aria-label="Search operatives" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th><SortButton label="Operative" field="name" sort={userSort} onSort={(field) => toggleSort(setUserSort, userSort, field)} /></th><th><SortButton label="Role" field="role" sort={userSort} onSort={(field) => toggleSort(setUserSort, userSort, field)} /></th><th><SortButton label="Projects" field="project_count" sort={userSort} onSort={(field) => toggleSort(setUserSort, userSort, field)} /></th><th className="text-right">Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="4"><EmptyTable message="Loading operative telemetry..." /></td></tr> : visibleUsers.length ? visibleUsers.map((operative) => <tr key={operative.id}><td><div className="admin-person"><Avatar name={operative.name} size="sm" /><span><strong>{operative.name}</strong><small>{operative.email}</small></span></div></td><td><span className={`admin-role admin-role-${operative.role}`}>{operative.role}</span></td><td className="admin-muted">{operative.project_count}</td><td><div className="admin-actions"><button type="button" className="admin-action-neutral" onClick={() => updateRole(operative)} title={operative.role === 'admin' ? 'Demote to standard operative' : 'Promote to admin'}><ShieldCheck size={14} /><span>{operative.role === 'admin' ? 'Demote' : 'Promote'}</span></button>{operative.id !== user.id && <button type="button" className="admin-action-danger" onClick={() => setAction({ kind: 'delete-user', id: operative.id, label: operative.name })} title="Delete operative"><Trash2 size={14} /><span>Delete</span></button>}</div></td></tr>) : <tr><td colSpan="4"><EmptyTable message={search ? 'No operatives match this search.' : 'No operatives registered.'} /></td></tr>}</tbody></table></div><Pagination page={userPage} total={sortedUsers.length} onChange={setUserPage} /></section>

    <section className="admin-panel"><div className="admin-panel-header"><div><span className="admin-eyebrow">02 / Mission governance</span><h2>Global Mission Registry</h2><p>All visibility modes and archived missions included.</p></div></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th><SortButton label="Mission" field="name" sort={projectSort} onSort={(field) => toggleSort(setProjectSort, projectSort, field)} /></th><th><SortButton label="Lead" field="lead" sort={projectSort} onSort={(field) => toggleSort(setProjectSort, projectSort, field)} /></th><th><SortButton label="Status" field="status" sort={projectSort} onSort={(field) => toggleSort(setProjectSort, projectSort, field)} /></th><th>Signal</th><th className="text-right">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="5"><EmptyTable message="Loading mission telemetry..." /></td></tr> : visibleProjects.length ? visibleProjects.map((project) => <tr key={project.id}><td><button type="button" className="admin-mission-link" onClick={() => navigate(`/projects/${project.id}`)}>{project.name}</button></td><td><select aria-label={`Lead for ${project.name}`} className="admin-select" value={project.members.find((member) => member.role === 'lead')?.id || ''} onChange={(event) => updateProject(project, { lead_user_id: Number(event.target.value) })}><option value="">Unassigned</option>{project.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></td><td><select aria-label={`Status for ${project.name}`} className="admin-select" value={project.status} onChange={(event) => updateProject(project, { status: event.target.value })}><option value="active">active</option><option value="archived">archived</option></select></td><td className="admin-muted">{project.member_count} members / {project.task_count} tasks</td><td><div className="admin-actions admin-actions-end"><button type="button" className="admin-action-danger" onClick={() => setAction({ kind: 'purge-project', id: project.id, label: project.name })} title="Purge mission"><Trash2 size={14} /><span>Purge</span></button></div></td></tr>) : <tr><td colSpan="5"><EmptyTable message="No missions registered." /></td></tr>}</tbody></table></div><Pagination page={projectPage} total={sortedProjects.length} onChange={setProjectPage} /></section>
    <ConfirmModal action={action} onCancel={() => !busy && setAction(null)} onConfirm={executeDestructiveAction} busy={busy} />
  </div>;
};

export default AdminDashboard;
