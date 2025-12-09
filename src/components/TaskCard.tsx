import { Calendar, Flag, Trash2, Edit } from 'lucide-react';
import type { TaskWithCategory } from '../types/database';
import { formatDueDate, isOverdue, isUpcoming } from '../utils/dateUtils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: TaskWithCategory;
  onEdit: (task: TaskWithCategory) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-[#abad94]/20 text-[#abad94] border-[#abad94]/50',
  medium: 'bg-[#1e3f71]/20 text-[#1e3f71] border-[#1e3f71]/50',
  high: 'bg-[#a13c87]/20 text-[#a13c87] border-[#a13c87]/50',
};

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dueDateText = formatDueDate(task.due_date);
  const overdue = isOverdue(task.due_date);
  const upcoming = isUpcoming(task.due_date);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move border-l-4"
      style={{
        ...style,
        borderLeftColor: task.category?.color || '#D1D5DB',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-[#1e3f71] flex-1">{task.title}</h3>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 hover:bg-[#d7d6cd] rounded transition-colors"
          >
            <Edit className="w-4 h-4 text-[#493d45]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1 hover:bg-[#a13c87]/10 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4 text-[#a13c87]" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-[#493d45] mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {task.category && (
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${task.category.color}20`,
              color: task.category.color,
            }}
          >
            {task.category.name}
          </span>
        )}

        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[task.priority]}`}>
          <Flag className="w-3 h-3 inline mr-1" />
          {task.priority}
        </span>

        {task.due_date && (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              overdue
                ? 'bg-[#a13c87]/20 text-[#a13c87]'
                : upcoming
                ? 'bg-[#1e3f71]/20 text-[#1e3f71]'
                : 'bg-[#d7d6cd] text-[#493d45]'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {dueDateText}
          </span>
        )}
      </div>
    </div>
  );
}
