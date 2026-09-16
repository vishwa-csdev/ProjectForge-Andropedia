import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import DeadlineBadge from '../components/DeadlineBadge';
import { Activity, ArrowUpRight, Check, FileText, Library, ListChecks, Plus, RotateCcw } from 'lucide-react';

const Skeleton = ({ className = '' }) => <div className={`dashboard-skeleton ${className}`} />;

const Metric = ({ eyebrow, value, detail, accent = 'teal', href }) => (
  <Link to={href} className="dashboard-metric group block text-left">
    <div className="dashboard-metric-body text-left">
      <div className="flex items-center justify-between gap-3">
        <span className="dashboard-eyebrow">{eyebrow}</span>
        <span className={`metric-spark metric-spark-${accent}`} aria-hidden="true" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="flex items-end gap-2">
          <strong className="text-3xl font-display font-semibold tracking-tight text-white group-hover:text-cyan-300 transition-colors">{value}</strong>
          <span className="mb-1 text-[11px] font-mono text-text-muted">{detail}</span>
        </div>
        <div className="dashboard-metric-link text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
          <ArrowUpRight size={14} />
        </div>
      </div>
    </div>
  </Link>
);

const ProjectRow = ({ project }) => (
  <Link to={`/projects/${project.id}`} className="project-row group">
    <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="project-signal" /><h3 className="truncate font-display text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">{project.name}</h3></div><div className="mt-2 flex items-center gap-3 text-[11px] font-mono text-text-muted"><span>{project.member_count || 0} collaborators</span><span className="h-1 w-1 rounded-full bg-white/20" /><span>{project.task_count || 0} tracked tasks</span></div></div>
    <div className="flex items-center gap-4"><div className="w-28 sm:w-36"><div className="mb-1 flex justify-between text-[10px] font-mono text-text-muted"><span>progress</span><span className="text-cyan-300">{Math.round(project.progress || 0)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(45,212,191,0.65)]" style={{ width: `${Math.min(100, project.progress || 0)}%` }} /></div></div><ArrowUpRight size={15} className="text-text-muted transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" /></div>
  </Link>
);

const PanelAction = ({ label, href }) => href ? <Link to={href} className="dashboard-link">{label}<ArrowUpRight size={13} /></Link> : <span className="dashboard-link dashboard-link-static">{label}<ArrowUpRight size={13} /></span>;

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ projects: [], activities: [], upcoming_tasks: [] });
  const [loading, setLoading] = useState(true);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchDashboard = async () => {
    try { const [dashboardData, tasksData] = await Promise.all([api.get('/dashboard'), api.get('/dashboard/tasks').catch(() => [])]); setData({ projects: dashboardData?.my_projects || [], activities: dashboardData?.recent_activity || [], upcoming_tasks: tasksData || [] }); } catch (error) { console.error('Failed to load dashboard', error); } finally { setLoading(false); }
  };
  useEffect(() => { fetchDashboard(); }, []);

  const metrics = useMemo(() => { const activeTasks = data.upcoming_tasks.filter((task) => task.status !== 'done'); const dueSoon = activeTasks.filter((task) => task.due_date && (new Date(task.due_date) - new Date()) >= 0 && (new Date(task.due_date) - new Date()) < 7 * 24 * 60 * 60 * 1000); const averageProgress = data.projects.length ? Math.round(data.projects.reduce((sum, project) => sum + (project.progress || 0), 0) / data.projects.length) : 0; return { activeTasks, dueSoon, averageProgress }; }, [data]);
  const visibleProjects = activeTab === 'completion' ? data.projects.filter((project) => (project.progress || 0) < 100) : data.projects;
  const visibleTasks = activeTab === 'due' ? metrics.dueSoon : metrics.activeTasks;
  const visibleActivities = activeTab === 'activity' ? data.activities : data.activities;
  const completeTask = async (task) => { setUpdatingTask(task.id); try { await api.put(`/projects/${task.project_id}/tasks/${task.id}`, { status: 'done' }); setData((current) => ({ ...current, upcoming_tasks: current.upcoming_tasks.filter((item) => item.id !== task.id) })); } catch (error) { console.error('Failed to complete task', error); } finally { setUpdatingTask(null); } };
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero"><div className="dashboard-gridline" /><div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300"><span className="status-pip" />Workspace pulse · live</div><h1 className="max-w-2xl font-display text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">{greeting}, {user?.name?.split(' ')[0] || 'there'}<span className="text-cyan-300">.</span></h1><p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary">Your club operations at a glance. <span className="text-white">{metrics.dueSoon.length} task{metrics.dueSoon.length === 1 ? '' : 's'}</span> need attention this week across {data.projects.length} active project{data.projects.length === 1 ? '' : 's'}.</p></div><div className="flex shrink-0 gap-2"><Button to="/projects/new" variant="cyan" size="md"><Plus size={15} /> New project</Button><Button to="/projects" variant="secondary" size="md">Browse work</Button></div></div></section>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Workspace summary">{loading ? <>{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}</> : <><Metric eyebrow="Active projects" value={data.projects.length} detail="in your orbit" href="/projects?filter=active" /><Metric eyebrow="Due this week" value={metrics.dueSoon.length} detail="needs focus" accent="amber" href="/projects" /><Metric eyebrow="Completion rate" value={`${metrics.averageProgress}%`} detail="project average" href="/projects" /><Metric eyebrow="Activity score" value={data.activities.length} detail="recent signals" accent="amber" href={data.projects[0] ? `/projects/${data.projects[0].id}/contributions` : '/projects'} /></>}</section>
      {activeTab !== 'all' && <div className="dashboard-filter-bar"><span>Filtered view: <strong>{activeTab === 'projects' ? 'Active projects' : activeTab === 'due' ? 'Due this week' : activeTab === 'completion' ? 'Projects in progress' : 'Recent activity'}</strong></span><button type="button" onClick={() => setActiveTab('all')}><RotateCcw size={13} /> Reset view</button></div>}
      <div className="dashboard-paired-grid"><section className="dashboard-panel dashboard-paired-panel"><div className="dashboard-panel-header"><div><span className="dashboard-eyebrow">01 / Project runway</span><h2 className="dashboard-title">Your active work</h2></div><PanelAction label="View all" href="/projects" /></div>{loading ? <div className="space-y-2"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div> : visibleProjects.length ? <div className="divide-y divide-white/[0.06]">{visibleProjects.slice(0, 5).map((project) => <ProjectRow key={project.id} project={project} />)}</div> : <div className="empty-state dashboard-fill-empty"><div className="empty-mark">+</div><h3>No projects match this view</h3><p>Reset the filter or start a new build.</p><button type="button" onClick={() => setActiveTab('all')} className="dashboard-inline-action">Reset view</button></div>}</section>
        <section className="dashboard-panel dashboard-paired-panel"><div className="dashboard-panel-header"><div><span className="dashboard-eyebrow">02 / Assigned to me</span><h2 className="dashboard-title">Next actions</h2></div><PanelAction label="All tasks" href="/projects" /></div>{loading ? <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : visibleTasks.length ? <div className="space-y-1">{visibleTasks.slice(0, 5).map((task) => <div key={task.id} className="task-row"><button type="button" aria-label={`Complete ${task.title}`} onClick={() => completeTask(task)} disabled={updatingTask === task.id} className="task-check">{updatingTask === task.id ? '·' : ''}</button><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-white">{task.title}</div><div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-text-muted"><span className="truncate">{task.project_name}</span><span className="h-1 w-1 rounded-full bg-white/20" /><span className={task.priority === 'urgent' || task.priority === 'high' ? 'text-amber-300' : ''}>{task.priority}</span></div></div><DeadlineBadge dateString={task.due_date} /></div>)}</div> : <div className="empty-state dashboard-fill-empty"><div className="empty-mark"><Check size={18} /></div><h3>{activeTab === 'due' ? 'No deadlines this week' : 'Clear runway'}</h3><p>No tasks match this view.</p></div>}</section></div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]"><section className="dashboard-panel dashboard-paired-panel"><div className="dashboard-panel-header"><div><span className="dashboard-eyebrow">03 / Club signal</span><h2 className="dashboard-title">Recent activity</h2></div><PanelAction label="Live feed" /></div>{visibleActivities.length ? <div className="activity-list">{visibleActivities.slice(0, 5).map((item, index) => { const name = item.user_name || 'Operative'; return <div key={item.id || index} className="activity-row"><Avatar name={name} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm text-text-secondary"><strong className="text-white">{name}</strong> {item.description}</p><p className="mt-1 text-[10px] font-mono text-text-muted">{item.project_name || 'Club network'} · {item.logged_at ? new Date(item.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'recently'}</p></div><ArrowUpRight size={14} className="text-cyan-300" /></div>; })}</div> : <div className="empty-state dashboard-fill-empty"><div className="empty-mark"><Activity size={18} /></div><h3>No activity yet</h3><p>Activity will appear here once work starts moving.</p></div>}</section><section className="dashboard-panel dashboard-panel-accent dashboard-paired-panel"><div className="dashboard-panel-header"><div><span className="dashboard-eyebrow">04 / Quick access</span><h2 className="dashboard-title">Club library</h2></div><PanelAction label="View library" href="/library" /></div><div className="shortcut-list"><Link to="/library" className="shortcut-row"><span className="shortcut-icon"><Library size={15} /></span><span><strong>Club library</strong><small>Guides, templates & archives</small></span><ArrowUpRight size={14} className="ml-auto text-text-muted" /></Link><Link to={data.projects[0] ? `/projects/${data.projects[0].id}/contributions` : '/projects'} className="shortcut-row"><span className="shortcut-icon"><ListChecks size={15} /></span><span><strong>Log a contribution</strong><small>Keep the record current</small></span><ArrowUpRight size={14} className="ml-auto text-text-muted" /></Link><Link to={data.projects[0] ? `/projects/${data.projects[0].id}/report` : '/projects'} className="shortcut-row"><span className="shortcut-icon"><FileText size={15} /></span><span><strong>Project reports</strong><small>Exportable summaries</small></span><ArrowUpRight size={14} className="ml-auto text-text-muted" /></Link></div></section></div>
    </div>
  );
};

export default Dashboard;
