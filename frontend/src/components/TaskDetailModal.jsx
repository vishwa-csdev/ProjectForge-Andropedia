import React, { useState, useEffect } from 'react';
import { api } from '../api';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Avatar from './ui/Avatar';
import Badge from './ui/Badge';
import DeadlineBadge from './DeadlineBadge';

const TaskDetailModal = ({ task: initialTask, projectId, isOpen, onClose, projectMembers }) => {
  const [task, setTask] = useState(initialTask);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(initialTask.title);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const statuses = ['todo', 'in_progress', 'blocked', 'done'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  const fetchTaskDetail = async () => {
    try {
      const data = await api.get(`/projects/${projectId}/tasks/${initialTask.id}`);
      setTask(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetail();
  }, [initialTask.id, projectId]);

  const handleUpdate = async (updates) => {
    try {
      const updatedTask = await api.put(`/projects/${projectId}/tasks/${task.id}`, { ...task, ...updates });
      setTask(updatedTask);
    } catch (e) {
      console.error('Failed to update task', e);
    }
  };

  const handleTitleSubmit = () => {
    setEditingTitle(false);
    if (titleValue !== task.title) {
      handleUpdate({ title: titleValue });
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      await api.post(`/projects/${projectId}/tasks/${task.id}/comments`, { content: newComment });
      setNewComment('');
      fetchTaskDetail();
    } catch (e) {
      console.error('Failed to add comment', e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading && !task.comments) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading Task...">
        <div className="p-8 text-center text-text-secondary">Loading details...</div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={
      <div className="flex items-center gap-2">
        <span className="text-text-secondary font-mono text-sm">#{task.id}</span>
      </div>
    }>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <div>
          {editingTitle ? (
            <input
              autoFocus
              className="w-full bg-base border border-accent/50 rounded-lg px-3 py-2 text-text-primary text-xl font-display font-semibold focus:outline-none"
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
            />
          ) : (
            <h2 
              className="font-display text-xl font-bold text-text-primary cursor-pointer hover:bg-white/5 p-2 -ml-2 rounded-lg transition-colors break-words"
              onClick={() => setEditingTitle(true)}
            >
              {task.title}
            </h2>
          )}
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Status</label>
            <div className="flex flex-wrap gap-1">
              {statuses.map(s => (
                <button
                  key={s}
                  onClick={() => handleUpdate({ status: s })}
                  className={`py-1 px-2 rounded text-xs font-medium transition-colors cursor-pointer capitalize ${
                    task.status === s
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-base text-text-secondary border border-white/5 hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">Priority</label>
            <div className="flex flex-wrap gap-1">
              {priorities.map(p => (
                <button
                  key={p}
                  onClick={() => handleUpdate({ priority: p })}
                  className={`py-1 px-2 rounded text-xs font-medium transition-colors cursor-pointer capitalize ${
                    task.priority === p
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-base text-text-secondary border border-white/5 hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-6 py-4 border-y border-white/10">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Assignee</label>
            <div className="flex items-center gap-2">
              {task.assignee ? (
                <>
                  <Avatar name={task.assignee.name} size="sm" />
                  <span className="text-sm font-medium text-text-primary">{task.assignee.name}</span>
                </>
              ) : (
                <span className="text-sm text-text-secondary">Unassigned</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Due Date</label>
            <div>
              {(task.due_date || task.deadline) ? <DeadlineBadge dateString={task.due_date || task.deadline} /> : <span className="text-sm text-text-secondary">No due date</span>}
            </div>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-text-primary">Description</label>
            <p className="text-text-secondary text-sm whitespace-pre-line leading-relaxed">
              {task.description}
            </p>
          </div>
        )}

        {/* Subtasks */}
        {(task.subtasks && task.subtasks.length > 0) && (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-text-primary">Subtasks</label>
            <div className="flex flex-col gap-2 bg-base p-3 rounded-lg border border-white/5">
              {task.subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 text-sm">
                  <Badge type={st.status === 'done' ? 'success' : 'todo'}>{st.status}</Badge>
                  <span className={st.status === 'done' ? 'text-text-secondary line-through' : 'text-text-primary'}>
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="flex flex-col gap-4 mt-2">
          <label className="text-sm font-semibold text-text-primary">Comments ({task.comments?.length || 0})</label>
          
          <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
            {task.comments?.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <Avatar name={comment.user?.name || 'User'} size="sm" className="shrink-0" />
                <div className="flex flex-col gap-1 bg-base p-3 rounded-xl border border-white/5 flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm font-medium text-text-primary truncate">
                      {comment.user?.name || 'User'}
                    </span>
                    <span className="text-xs font-mono text-text-secondary shrink-0">
                      {new Date(comment.created_at || comment.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-2">
            <Input 
              as="textarea"
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isSubmittingComment || !newComment.trim()}>
                Post Comment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;
