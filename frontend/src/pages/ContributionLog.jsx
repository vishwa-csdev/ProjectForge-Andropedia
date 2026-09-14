import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';

const ContributionLog = () => {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ description: '', task_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('log'); // 'log' or 'summary'

  const fetchData = async () => {
    try {
      const [projData, tasksData, contribs, summ] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/contributions${selectedMemberFilter ? `?user_id=${selectedMemberFilter}` : ''}`),
        api.get(`/projects/${projectId}/contributions/summary`),
      ]);
      setProject(projData);
      setTasks(tasksData || []);
      setContributions(contribs || []);
      setSummary(summ || []);
    } catch (e) {
      console.error('Failed to fetch contributions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, selectedMemberFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { 
        description: formData.description.trim() 
      };
      if (formData.task_id) {
        payload.task_id = parseInt(formData.task_id);
      }
      await api.post(`/projects/${projectId}/contributions`, payload);
      setShowAddModal(false);
      setFormData({ description: '', task_id: '' });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to log contribution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (contribId) => {
    if (!confirm('Delete this contribution record?')) return;
    try {
      await api.delete(`/projects/${projectId}/contributions/${contribId}`);
      fetchData();
    } catch (e) {
      console.error('Failed to delete', e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-sm">◈</span>
            <h1 className="font-display text-2xl font-bold text-text-primary tracking-wide">
              Mission Contribution Log
            </h1>
          </div>
          <p className="text-text-secondary text-sm mt-0.5">
            {project?.name || 'Project Activity & Verification'}
          </p>
        </div>

        <Button variant="cyan" onClick={() => setShowAddModal(true)}>
          Log Work / Activity
        </Button>
      </div>

      {/* Tabs & Member Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-white/10">
        <div className="flex gap-2">
          {[
            { id: 'log', label: 'Timeline Feed' },
            { id: 'summary', label: 'Team Metrics' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                viewMode === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 glow-cyan'
                  : 'bg-surface/60 text-text-secondary border-white/5 hover:text-text-primary'
              }`}
            >
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>

        {viewMode === 'log' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-muted">FILTER:</span>
            <select
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              className="bg-base border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-cyan-400/50"
            >
              <option value="">All Team Members</option>
              {project?.members?.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content View */}
      {loading ? (
        <div className="text-text-secondary p-12 text-center font-mono text-sm">
          Loading telemetry log...
        </div>
      ) : viewMode === 'log' ? (
        contributions.length === 0 ? (
          <Card className="text-center py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl border border-white/10">
              ⚡
            </div>
            <h3 className="font-display font-semibold text-text-primary text-base">
              No mission contributions logged yet
            </h3>
            <p className="text-text-secondary text-xs max-w-sm">
              Record technical deliverables, code commits, hardware assembly steps, or design decisions.
            </p>
            <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)} className="mt-2">
              Log First Entry
            </Button>
          </Card>
        ) : (
          <div className="relative border-l-2 border-cyan-500/20 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
            {contributions.map(c => (
              <div key={c.id} className="relative group">
                {/* Orbital timeline node indicator */}
                <div className="absolute -left-[23px] sm:-left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-surface border-2 border-cyan-400 shadow-[0_0_8px_#00F0FF] group-hover:scale-125 transition-transform" />

                <Card className="surface-hover">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.user_name || 'User'} size="sm" />
                      <div>
                        <span className="font-semibold text-sm text-text-primary">
                          {c.user_name || 'Team Member'}
                        </span>
                        {c.user_id === user?.id && (
                          <span className="ml-2 text-[10px] font-mono text-cyan-400 uppercase bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-text-muted">
                        {c.logged_at ? new Date(c.logged_at).toLocaleString() : '—'}
                      </span>
                      {c.user_id === user?.id && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-danger/60 hover:text-danger text-xs font-mono transition-colors cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-text-primary text-sm leading-relaxed whitespace-pre-line">
                    {c.description}
                  </p>

                  {c.task_title && (
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center gap-2 text-xs font-mono">
                      <span className="text-text-muted uppercase">Target Milestone:</span>
                      <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent truncate max-w-md">
                        {c.task_title}
                      </span>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Team Metrics Summary Table */
        summary.length === 0 ? (
          <Card className="text-center py-12 text-text-secondary font-mono text-sm">
            No activity metrics available yet.
          </Card>
        ) : (
          <Card elevated>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-text-muted font-mono text-xs">
                    <th className="pb-3 uppercase tracking-wider">Operative</th>
                    <th className="pb-3 text-center uppercase tracking-wider">Logged Contributions</th>
                    <th className="pb-3 text-right uppercase tracking-wider">Latest Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {summary.map(s => (
                    <tr key={s.user_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 flex items-center gap-3">
                        <Avatar name={s.user_name} size="sm" />
                        <div>
                          <div className="font-medium text-text-primary">{s.user_name}</div>
                          {s.user_id === user?.id && (
                            <span className="text-[10px] font-mono text-cyan-400">Current Session</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="font-mono font-bold text-base text-cyan-300 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/20">
                          {s.count}
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-mono text-xs text-text-secondary">
                        {s.latest_at ? new Date(s.latest_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* Log Contribution Modal */}
      {showAddModal && (
        <Modal title="Log Technical Contribution" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">
                Associated Task / Deliverable
              </label>
              <select
                value={formData.task_id}
                onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                className="bg-base border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan-400/50 w-full font-body"
              >
                <option value="">General Project Work (No specific task)</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.status.toUpperCase()}] #{t.id} - {t.title}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Work Description & Outcomes"
              textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              placeholder="Describe what was accomplished, commits merged, components wired, or blockers resolved..."
              className="min-h-[120px]"
            />

            {error && (
              <div className="text-danger font-mono text-xs p-2.5 rounded-lg bg-danger/10 border border-danger/20">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="cyan" disabled={submitting}>
                {submitting ? 'Recording...' : 'Commit to Log'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ContributionLog;
