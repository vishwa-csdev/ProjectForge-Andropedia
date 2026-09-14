import React from 'react';
import Avatar from './ui/Avatar';
import DeadlineBadge from './DeadlineBadge';

const TaskCard = ({ task, onClick }) => {
  const priorityColors = {
    low: 'border-l-white/20',
    medium: 'border-l-accent shadow-[inset_2px_0_8px_rgba(255,180,84,0.15)]',
    high: 'border-l-orange-500 shadow-[inset_2px_0_8px_rgba(249,115,22,0.15)]',
    urgent: 'border-l-danger shadow-[inset_2px_0_8px_rgba(239,68,68,0.25)]'
  };

  const priorityClass = priorityColors[task.priority] || priorityColors.low;

  return (
    <div 
      onClick={() => onClick && onClick(task)}
      className={`bg-surface/80 backdrop-blur-sm border border-white/10 border-l-[3px] ${priorityClass} rounded-xl p-3.5 cursor-pointer hover:border-cyan-400/40 surface-hover flex flex-col gap-3 select-none transition-all shadow-sm`}
    >
      <div className="text-sm font-medium text-text-primary line-clamp-2 leading-snug">
        {task.title}
      </div>
      
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <Avatar name={task.assignee.name} size="sm" />
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-white/20 flex items-center justify-center text-text-muted text-xs font-mono">
              —
            </div>
          )}
          
          <div className="flex items-center gap-2 text-text-muted text-xs font-mono">
            {(task.comment_count > 0 || task.subtask_count > 0) && (
              <div className="flex items-center gap-2">
                {task.comment_count > 0 && <span className="hover:text-cyan-300">💬 {task.comment_count}</span>}
                {task.subtask_count > 0 && <span className="text-emerald-400">✓ {task.subtask_count}</span>}
              </div>
            )}
          </div>
        </div>
        
        {(task.due_date || task.deadline) && <DeadlineBadge dateString={task.due_date || task.deadline} />}
      </div>
    </div>
  );
};

export default TaskCard;
