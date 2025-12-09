import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import type { TaskWithCategory } from '../types/database';

interface ColumnProps {
  id: string;
  title: string;
  tasks: TaskWithCategory[];
  onEditTask: (task: TaskWithCategory) => void;
  onDeleteTask: (id: string) => void;
}

const columnIcons = {
  todo: '📋',
  in_progress: '⚡',
  done: '✅',
};

export default function Column({ id, title, tasks, onEditTask, onDeleteTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col bg-[#d7d6cd]/30 rounded-lg p-4 min-w-[320px] max-w-[400px] flex-1 border border-[#abad94]/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg text-[#1e3f71] flex items-center gap-2">
          <span>{columnIcons[id as keyof typeof columnIcons]}</span>
          {title}
        </h2>
        <span className="bg-[#493d45] text-white rounded-full px-3 py-1 text-sm font-semibold">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-3 min-h-[200px] transition-colors rounded-lg p-2 ${
          isOver ? 'bg-[#1e3f71]/10 border-2 border-[#1e3f71] border-dashed' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-full text-[#493d45] text-sm">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
}
