import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { DndContext, useDroppable, useDraggable, closestCenter, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import TaskCard from '../components/TaskCard';
import TaskDetailModal from '../components/TaskDetailModal';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const Column = ({ id, title, tasks, onTaskClick, titleColorClass }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col min-w-[280px] w-full">
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-current opacity-80" />
          <h3 className={`font-display text-sm font-bold uppercase tracking-wider ${titleColorClass}`}>{title}</h3>
        </div>
        <span className="text-xs font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-text-secondary font-semibold">
          {tasks.length}
        </span>
      </div>
      <div 
        ref={setNodeRef} 
        className={`bg-surface/40 backdrop-blur-md rounded-2xl border p-3 min-h-[450px] flex flex-col gap-3 transition-all duration-200 ${
          isOver ? 'border-cyan-400/50 bg-cyan-500/10 glow-cyan' : 'border-white/10 hover:border-white/15'
        }`}
      >
        {tasks.map(task => (
          <DraggableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  );
};

const DraggableTaskCard = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={`${isDragging ? 'opacity-50 z-50' : ''} touch-none`}
    >
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
};

const TaskBoard = () => {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeDragTask, setActiveDragTask] = useState(null);

  const fetchBoardData = async () => {
    try {
      const [projData, tasksData] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`)
      ]);
      setProject(projData);
      setTasks(tasksData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [projectId]);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveDragTask(task);
  };

  const handleDragEnd = async (event) => {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id;
    const newStatus = over.id;
    
    const task = tasks.find(t => t.id === taskId);
    if (task.status === newStatus) return;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/projects/${projectId}/tasks/${taskId}`, { ...task, status: newStatus });
    } catch (e) {
      console.error('Failed to update task status', e);
      // Revert on error
      fetchBoardData();
    }
  };

  const columns = [
    { id: 'todo', title: 'Todo', colorClass: 'text-text-secondary' },
    { id: 'in_progress', title: 'In Progress', colorClass: 'text-accent' },
    { id: 'blocked', title: 'Blocked', colorClass: 'text-danger' },
    { id: 'done', title: 'Done', colorClass: 'text-success' },
  ];

  if (loading) return <div className="text-text-secondary p-8">Loading board...</div>;

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-mono text-sm">⬢</span>
            <h1 className="font-display text-2xl font-bold text-text-primary tracking-wide">Tasks Board</h1>
          </div>
          <Link to={`/projects/${projectId}`} className="text-text-secondary hover:text-cyan-300 text-sm mt-0.5 inline-block transition-colors font-mono">
            ← {project?.name || 'Project'}
          </Link>
        </div>
        <Button variant="cyan" onClick={() => setIsCreateModalOpen(true)}>Add Task</Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
        <DndContext 
          collisionDetection={closestCenter} 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {columns.map(col => (
            <Column 
              key={col.id} 
              id={col.id} 
              title={col.title} 
              titleColorClass={col.colorClass}
              tasks={tasks.filter(t => t.status === col.id)}
              onTaskClick={setSelectedTask}
            />
          ))}
          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
            {activeDragTask ? <TaskCard task={activeDragTask} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          projectId={projectId} 
          isOpen={!!selectedTask} 
          onClose={() => {
            setSelectedTask(null);
            fetchBoardData();
          }}
          projectMembers={project?.members || []}
        />
      )}

      {isCreateModalOpen && (
        <CreateTaskModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          projectId={projectId} 
          onSuccess={fetchBoardData}
          members={project?.members || []}
        />
      )}
    </div>
  );
};

const CreateTaskModal = ({ isOpen, onClose, projectId, onSuccess, members }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    assignee_id: '',
    due_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const priorities = ['low', 'medium', 'high', 'urgent'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
        assignee_id: formData.assignee_id || null
      };
      await api.post(`/projects/${projectId}/tasks`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input 
          label="Title" 
          value={formData.title} 
          onChange={e => setFormData({...formData, title: e.target.value})} 
          required 
        />
        
        <Input 
          as="textarea"
          label="Description" 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          className="min-h-[100px] resize-y"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Priority</label>
          <div className="flex gap-2">
            {priorities.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData({...formData, priority: p})}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border capitalize ${
                  formData.priority === p 
                    ? 'bg-accent/10 border-accent/50 text-accent' 
                    : 'bg-base border-white/10 text-text-secondary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Assignee</label>
          <select 
            value={formData.assignee_id}
            onChange={e => setFormData({...formData, assignee_id: e.target.value})}
            className="bg-base border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 w-full"
          >
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.user_id || m.id} value={m.user_id || m.id}>
                {m.user?.name || m.name}
              </option>
            ))}
          </select>
        </div>

        <Input 
          label="Due Date (optional)" 
          type="date"
          value={formData.due_date} 
          onChange={e => setFormData({...formData, due_date: e.target.value})} 
        />

        {error && <div className="text-danger text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>Create Task</Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskBoard;
