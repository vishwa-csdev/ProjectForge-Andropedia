import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../hooks/useAuth';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import Avatar from './ui/Avatar';
import Modal from './ui/Modal';

const MemberControlPanel = ({ project, onProjectUpdated }) => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const currentMembership = project?.members?.find(m => m.id === user?.id);
  const isLead = currentMembership?.role === 'lead' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isLead && showAddModal) {
      const fetchClubUsers = async () => {
        setLoadingUsers(true);
        try {
          const data = await api.get('/users');
          setAllUsers(data || []);
        } catch (e) {
          console.error('Failed to load club users', e);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchClubUsers();
    }
  }, [isLead, showAddModal]);

  const handleRoleChange = async (memberId, newRole) => {
    setActionError('');
    try {
      await api.put(`/projects/${project.id}/members/${memberId}/role`, { role: newRole });
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) return;
    setActionError('');
    try {
      await api.delete(`/projects/${project.id}/members/${memberId}`);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to remove member');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      setActionError('Please select a member to add');
      return;
    }
    setActionError('');
    setSubmitting(true);
    try {
      await api.post(`/projects/${project.id}/members`, {
        user_id: parseInt(selectedUserId),
        role: selectedRole,
      });
      setShowAddModal(false);
      setSelectedUserId('');
      if (onProjectUpdated) onProjectUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to add member to project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVisibilityToggle = async () => {
    const newVis = project.visibility === 'open' ? 'invite' : 'open';
    try {
      await api.put(`/projects/${project.id}`, { visibility: newVis });
      if (onProjectUpdated) onProjectUpdated();
    } catch (e) {
      console.error('Failed to update project visibility', e);
    }
  };

  // Filter available users (not already members)
  const existingMemberIds = new Set(project?.members?.map(m => m.id) || []);
  const availableUsers = allUsers
    .filter(u => !existingMemberIds.has(u.id))
    .filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex flex-col gap-6">
      {/* Control Deck Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-sm">⬢</span>
            <h2 className="font-display text-xl font-bold text-text-primary tracking-wide">
              {isLead ? 'Command & Crew Control Deck' : 'Mission Crew Directory'}
            </h2>
          </div>
          <p className="text-text-secondary text-xs mt-0.5 font-mono">
            {isLead
              ? 'PROJECT LEAD & ADMIN CLEARANCE LEVEL ACTIVE'
              : 'READ-ONLY CREW ROSTER'}
          </p>
        </div>

        {isLead && (
          <div className="flex items-center gap-3">
            <Button variant="cyan" onClick={() => setShowAddModal(true)}>
              Enlist / Add Member
            </Button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs font-mono">
          {actionError}
        </div>
      )}

      {/* Telemetry Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between py-3 px-4">
          <span className="text-xs font-mono text-text-muted uppercase">Total Crew</span>
          <span className="font-mono text-2xl font-bold text-text-primary mt-1">
            {project?.members?.length || 0}
          </span>
        </Card>

        <Card className="flex flex-col justify-between py-3 px-4">
          <span className="text-xs font-mono text-text-muted uppercase">Project Leads</span>
          <span className="font-mono text-2xl font-bold text-cyan-300 mt-1">
            {project?.members?.filter(m => m.role === 'lead').length || 0}
          </span>
        </Card>

        <Card className="flex flex-col justify-between py-3 px-4">
          <span className="text-xs font-mono text-text-muted uppercase">Visibility Access</span>
          <div className="flex items-center justify-between mt-1">
            <Badge type="lead">{project?.visibility || 'open'}</Badge>
            {isLead && (
              <button
                onClick={handleVisibilityToggle}
                className="text-[11px] font-mono text-cyan-400 hover:underline cursor-pointer"
                title="Toggle Open/Invite Access"
              >
                Change
              </button>
            )}
          </div>
        </Card>

        <Card className="flex flex-col justify-between py-3 px-4">
          <span className="text-xs font-mono text-text-muted uppercase">Your Rank</span>
          <span className="font-mono text-sm font-semibold text-accent mt-1 uppercase">
            {isAdmin ? 'Club Admin' : isLead ? 'Project Lead' : 'Member'}
          </span>
        </Card>
      </div>

      {/* Crew Table */}
      <Card elevated className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-text-muted font-mono text-xs bg-white/[0.01]">
                <th className="py-3 px-4 uppercase">Operative</th>
                <th className="py-3 px-4 uppercase">Email Address</th>
                <th className="py-3 px-4 uppercase">Role Designation</th>
                {isLead && <th className="py-3 px-4 text-right uppercase">Command Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {project?.members?.map(m => {
                const isTargetSelf = m.id === user?.id;
                const isTargetLead = m.role === 'lead';

                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <Avatar name={m.name} size="sm" />
                      <div>
                        <div className="font-medium text-text-primary flex items-center gap-2">
                          {m.name}
                          {isTargetSelf && (
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
                              YOU
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-text-secondary">
                      {m.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {isLead ? (
                        <div className="flex items-center gap-2">
                          <Badge type={isTargetLead ? 'lead' : 'member'}>
                            {m.role}
                          </Badge>
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className="bg-base border border-white/10 rounded px-2 py-1 text-xs font-mono text-text-primary focus:outline-none focus:border-cyan-400/50 cursor-pointer"
                          >
                            <option value="member">Demote to Member</option>
                            <option value="lead">Promote to Lead</option>
                          </select>
                        </div>
                      ) : (
                        <Badge type={isTargetLead ? 'lead' : 'member'}>
                          {m.role}
                        </Badge>
                      )}
                    </td>

                    {isLead && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRemoveMember(m.id, m.name)}
                          className="px-2.5 py-1 rounded bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger text-xs font-mono transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Member Modal */}
      {showAddModal && (
        <Modal title="Enlist Member to Project" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddMember} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">
                Filter Registered Club Members
              </label>
              <Input
                placeholder="Search by operative name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">
                Select Member ({availableUsers.length} available)
              </label>
              {loadingUsers ? (
                <div className="text-text-secondary font-mono text-xs p-4 text-center">
                  Scanning club member directory...
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="p-4 rounded-lg bg-base border border-white/10 text-text-secondary text-xs text-center font-mono">
                  No registered users found matching query.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-white/10 rounded-lg divide-y divide-white/5 bg-base">
                  {availableUsers.map(u => (
                    <label
                      key={u.id}
                      className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${
                        selectedUserId === String(u.id) ? 'bg-cyan-500/15 text-cyan-300' : 'hover:bg-white/5 text-text-primary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="member"
                        value={u.id}
                        checked={selectedUserId === String(u.id)}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="accent-cyan-400"
                      />
                      <Avatar name={u.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{u.name}</div>
                        <div className="text-xs font-mono text-text-muted truncate">{u.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-text-secondary mb-1.5 uppercase">
                Assign Initial Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('member')}
                  className={`py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                    selectedRole === 'member'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 glow-cyan'
                      : 'bg-base border-white/10 text-text-secondary'
                  }`}
                >
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('lead')}
                  className={`py-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                    selectedRole === 'lead'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 glow-amber'
                      : 'bg-base border-white/10 text-text-secondary'
                  }`}
                >
                  Project Lead
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="cyan" disabled={submitting || !selectedUserId}>
                {submitting ? 'Enlisting...' : 'Add to Crew'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MemberControlPanel;
