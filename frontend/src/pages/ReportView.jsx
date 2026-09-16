import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import ProgressDial from '../components/ProgressDial';
import DeadlineBadge from '../components/DeadlineBadge';
import ProjectNavHeader from '../components/ProjectNavHeader';

const ReportView = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await api.get(`/projects/${id}/report`);
        setReport(data);
      } catch (err) {
        console.error('Failed to fetch report', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/projects/${id}/report/pdf`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${id}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Error downloading PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="text-text-secondary p-8 text-center">Generating project report...</div>;
  }

  if (!report) {
    return (
      <Card className="text-center py-12 text-danger">
        Unable to load report for this project. Make sure you are a member of the project.
      </Card>
    );
  }

  const { project, progress, task_summary, members, tasks, contributions, resources, generated_at } = report;
  const totalTasks = task_summary.total || 0;

  return (
    <div className="flex flex-col gap-6">
      <ProjectNavHeader project={project} activeTab="report">
        <Button variant="cyan" onClick={handleDownloadPdf} disabled={downloading}>
          {downloading ? 'Generating PDF...' : 'Download PDF Report'}
        </Button>
      </ProjectNavHeader>

      {/* Overview & Signature Progress Dial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card elevated className="lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary mb-2">Project Overview</h2>
            <p className="text-text-secondary leading-relaxed whitespace-pre-line text-sm mb-6">
              {project.description || 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
            <div>
              <div className="text-text-secondary text-xs">Total Tasks</div>
              <div className="font-mono text-xl text-text-primary font-bold mt-1">{totalTasks}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Completed</div>
              <div className="font-mono text-xl text-success font-bold mt-1">{task_summary.done || 0}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Team Members</div>
              <div className="font-mono text-xl text-text-primary font-bold mt-1">{members.length}</div>
            </div>
            <div>
              <div className="text-text-secondary text-xs">Target Deadline</div>
              <div className="mt-1">
                {project.deadline ? <DeadlineBadge dateString={project.deadline} /> : <span className="text-text-secondary text-xs">None</span>}
              </div>
            </div>
          </div>
        </Card>

        <Card elevated className="flex flex-col items-center justify-center py-6 text-center">
          <ProgressDial
            size={160}
            percentage={progress}
            nearDeadline={project.deadline && (new Date(project.deadline) - new Date() < 3 * 86400000)}
            label="complete"
          />
          <div className="mt-4 font-display font-medium text-text-primary">Overall Velocity</div>
          <div className="text-text-secondary text-xs font-mono mt-1">
            {task_summary.done} of {totalTasks} milestones finalized
          </div>
        </Card>
      </div>

      {/* Task Distribution Breakdown */}
      <Card>
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Task Breakdown</h2>

        {totalTasks > 0 ? (
          <div>
            {/* Proportion Bar */}
            <div className="h-4 w-full bg-elevated rounded-full overflow-hidden flex mb-6">
              {task_summary.done > 0 && (
                <div
                  style={{ width: `${(task_summary.done / totalTasks) * 100}%` }}
                  className="bg-success h-full"
                  title={`Done: ${task_summary.done}`}
                />
              )}
              {task_summary.in_progress > 0 && (
                <div
                  style={{ width: `${(task_summary.in_progress / totalTasks) * 100}%` }}
                  className="bg-accent h-full"
                  title={`In Progress: ${task_summary.in_progress}`}
                />
              )}
              {task_summary.todo > 0 && (
                <div
                  style={{ width: `${(task_summary.todo / totalTasks) * 100}%` }}
                  className="bg-white/20 h-full"
                  title={`To Do: ${task_summary.todo}`}
                />
              )}
              {task_summary.blocked > 0 && (
                <div
                  style={{ width: `${(task_summary.blocked / totalTasks) * 100}%` }}
                  className="bg-danger h-full"
                  title={`Blocked: ${task_summary.blocked}`}
                />
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-base border border-white/5">
                <div className="w-3 h-3 rounded-full bg-white/30 shrink-0" />
                <div>
                  <div className="text-xs text-text-secondary">To Do</div>
                  <div className="font-mono text-base font-bold text-text-primary">{task_summary.todo}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-base border border-white/5">
                <div className="w-3 h-3 rounded-full bg-accent shrink-0" />
                <div>
                  <div className="text-xs text-text-secondary">In Progress</div>
                  <div className="font-mono text-base font-bold text-text-primary">{task_summary.in_progress}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-base border border-white/5">
                <div className="w-3 h-3 rounded-full bg-danger shrink-0" />
                <div>
                  <div className="text-xs text-text-secondary">Blocked</div>
                  <div className="font-mono text-base font-bold text-text-primary">{task_summary.blocked}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-base border border-white/5">
                <div className="w-3 h-3 rounded-full bg-success shrink-0" />
                <div>
                  <div className="text-xs text-text-secondary">Done</div>
                  <div className="font-mono text-base font-bold text-text-primary">{task_summary.done}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-text-secondary text-sm py-4">No tasks defined yet.</div>
        )}
      </Card>

      {/* Team Contributions Summary */}
      <Card>
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Team Contributions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-text-secondary font-mono text-xs">
                <th className="pb-3">Member</th>
                <th className="pb-3">Role</th>
                <th className="pb-3 text-right">Contributions Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 flex items-center gap-3">
                    <Avatar name={m.name} size="sm" />
                    <span className="font-medium text-text-primary">{m.name}</span>
                  </td>
                  <td className="py-3">
                    <Badge type={m.role === 'lead' ? 'medium' : 'todo'}>{m.role}</Badge>
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-accent">
                    {m.contribution_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Full Task Inventory */}
      <Card>
        <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Tasks Status</h2>
        {tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-text-secondary font-mono text-xs">
                  <th className="pb-3">Task</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Assignee</th>
                  <th className="pb-3 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 font-medium text-text-primary max-w-xs truncate">{t.title}</td>
                    <td className="py-3">
                      <Badge type={t.status}>{t.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-3">
                      <Badge type={t.priority}>{t.priority}</Badge>
                    </td>
                    <td className="py-3 text-text-secondary">{t.assignee_name || 'Unassigned'}</td>
                    <td className="py-3 text-right">
                      {t.due_date ? <DeadlineBadge dateString={t.due_date} /> : <span className="text-text-secondary text-xs font-mono">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-text-secondary text-sm">No tasks recorded.</div>
        )}
      </Card>

      {/* Recent Activity Log & Shared Resources Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Recent Activity</h2>
          {contributions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {contributions.slice(0, 8).map((c) => (
                <div key={c.id} className="text-sm border-b border-white/5 pb-3 last:border-none last:pb-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-medium text-text-primary">{c.user_name}</span>
                    <span className="font-mono text-xs text-text-secondary">
                      {c.logged_at ? new Date(c.logged_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs leading-relaxed">{c.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-secondary text-sm">No recent contributions logged.</div>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold text-text-primary mb-4">Project Resources</h2>
          {resources.length > 0 ? (
            <div className="flex flex-col gap-3">
              {resources.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-base border border-white/5">
                  <div className="min-w-0">
                    <div className="font-medium text-text-primary text-sm truncate">{r.title}</div>
                    <div className="text-text-secondary text-xs font-mono capitalize mt-0.5">{r.tag} / {r.type}</div>
                  </div>
                  <Badge type="todo">{r.tag}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-text-secondary text-sm">No shared resources found.</div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ReportView;
