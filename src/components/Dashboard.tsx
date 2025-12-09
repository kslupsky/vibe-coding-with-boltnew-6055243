import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Search, Filter, Sparkles, X, LogOut } from 'lucide-react';
import Column from './Column';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import CelebrationEffect from './CelebrationEffect';
import type { TaskWithCategory, Category } from '../types/database';
import { fetchTasks, createTask, updateTask, deleteTask, updateTaskPosition } from '../services/taskService';
import { fetchCategories, initializeDefaultCategories } from '../services/categoryService';
import { prioritizeInProgressTasks } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<TaskWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithCategory | null>(null);
  const [activeTask, setActiveTask] = useState<TaskWithCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [summary, setSummary] = useState<{ text: string; taskCount: number } | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      if (user) {
        await initializeDefaultCategories(user.id);
      }
      const [tasksData, categoriesData] = await Promise.all([
        fetchTasks(),
        fetchCategories(),
      ]);
      setTasks(tasksData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDragStart = (event: any) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id.toString();
    const validStatuses = ['todo', 'in_progress', 'done'];
    const isOverColumn = validStatuses.includes(overId);

    let newStatus = activeTask.status;
    if (isOverColumn) {
      newStatus = overId as 'todo' | 'in_progress' | 'done';
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (active.id === over.id && activeTask.status === newStatus) return;

    if (activeTask.status !== 'done' && newStatus === 'done') {
      setShowCelebration(true);
    }

    const tasksInNewStatus = tasks.filter((t) => t.status === newStatus);
    const oldIndex = tasksInNewStatus.findIndex((t) => t.id === active.id);
    const newIndex = tasksInNewStatus.findIndex((t) => t.id === over.id);

    let updatedTasks = [...tasks];

    if (activeTask.status === newStatus && oldIndex !== -1 && newIndex !== -1) {
      const reorderedTasks = arrayMove(tasksInNewStatus, oldIndex, newIndex);
      updatedTasks = tasks.map((task) => {
        const indexInReordered = reorderedTasks.findIndex((t) => t.id === task.id);
        if (indexInReordered !== -1) {
          return { ...task, position: indexInReordered };
        }
        return task;
      });
    } else {
      updatedTasks = tasks.map((task) => {
        if (task.id === active.id) {
          return { ...task, status: newStatus, position: tasksInNewStatus.length };
        }
        return task;
      });
    }

    setTasks(updatedTasks);

    try {
      const taskToUpdate = updatedTasks.find((t) => t.id === active.id);
      if (taskToUpdate) {
        await updateTaskPosition(active.id.toString(), taskToUpdate.status, taskToUpdate.position);
      }
    } catch (error) {
      console.error('Error updating task position:', error);
      loadData();
    }
  };

  const handleCreateTask = async (taskData: Partial<TaskWithCategory>) => {
    if (!user) return;
    try {
      const newTask = await createTask({
        title: taskData.title!,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        category_id: taskData.category_id || null,
        due_date: taskData.due_date || null,
        position: tasks.filter((t) => t.status === (taskData.status || 'todo')).length,
        user_id: user.id,
      });
      loadData();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskData: Partial<TaskWithCategory>) => {
    if (!taskData.id) return;
    try {
      await updateTask(taskData.id, {
        title: taskData.title!,
        description: taskData.description || '',
        status: taskData.status!,
        priority: taskData.priority!,
        category_id: taskData.category_id || null,
        due_date: taskData.due_date || null,
      });
      loadData();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(id);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleOpenModal = (task?: TaskWithCategory) => {
    setEditingTask(task || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = (taskData: Partial<TaskWithCategory>) => {
    if (editingTask) {
      handleUpdateTask(taskData);
    } else {
      handleCreateTask(taskData);
    }
  };

  const handleSummarize = async () => {
    setIsLoadingSummary(true);
    try {
      const result = await prioritizeInProgressTasks(inProgressTasks);
      setSummary({ text: result.summary, taskCount: result.taskCount });
    } catch (error) {
      console.error('Error prioritizing tasks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSummary({
        text: `Failed to prioritize tasks: ${errorMessage}\n\nPlease check:\n- OpenAI API key is configured\n- Edge function is deployed\n- You have in-progress tasks`,
        taskCount: 0
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || task.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter((t) => t.status === 'done');

  const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#d7d6cd] via-white to-[#abad94] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3f71] mx-auto mb-4"></div>
          <p className="text-[#493d45]">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d7d6cd] via-white to-[#abad94]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-[#1e3f71] mb-2">Productivity Tracker</h1>
              <p className="text-[#493d45]">Organize your tasks and boost your productivity</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSummarize}
                disabled={isLoadingSummary || inProgressTasks.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5" />
                {isLoadingSummary ? 'Prioritizing...' : 'Prioritize'}
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-6 py-3 bg-[#1e3f71] text-white rounded-lg hover:bg-[#152d52] transition-colors shadow-lg hover:shadow-xl font-medium"
              >
                <Plus className="w-5 h-5" />
                New Task
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl font-medium"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#493d45]">
              <div className="text-sm text-[#493d45] mb-1">Total Tasks</div>
              <div className="text-2xl font-bold text-[#1e3f71]">{tasks.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#1e3f71]">
              <div className="text-sm text-[#493d45] mb-1">In Progress</div>
              <div className="text-2xl font-bold text-[#1e3f71]">{inProgressTasks.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#abad94]">
              <div className="text-sm text-[#493d45] mb-1">Completed</div>
              <div className="text-2xl font-bold text-[#abad94]">{doneTasks.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border-t-4 border-[#a13c87]">
              <div className="text-sm text-[#493d45] mb-1">Completion Rate</div>
              <div className="text-2xl font-bold text-[#a13c87]">{completionRate}%</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#493d45] w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-3 border border-[#abad94] rounded-lg focus:ring-2 focus:ring-[#1e3f71] focus:border-transparent bg-white"
              />
            </div>
            <div className="relative sm:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#493d45] w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#abad94] rounded-lg focus:ring-2 focus:ring-[#1e3f71] focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            <Column
              id="todo"
              title="To Do"
              tasks={todoTasks}
              onEditTask={handleOpenModal}
              onDeleteTask={handleDeleteTask}
            />
            <Column
              id="in_progress"
              title="In Progress"
              tasks={inProgressTasks}
              onEditTask={handleOpenModal}
              onDeleteTask={handleDeleteTask}
            />
            <Column
              id="done"
              title="Done"
              tasks={doneTasks}
              onEditTask={handleOpenModal}
              onDeleteTask={handleDeleteTask}
            />
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-50">
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        task={editingTask}
        categories={categories}
      />

      <CelebrationEffect
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {summary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-bold text-[#1e3f71]">Task Prioritization</h2>
              </div>
              <button
                onClick={() => setSummary(null)}
                className="text-[#493d45] hover:text-[#1e3f71] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-[#493d45] mb-1">Tasks Analyzed: {summary.taskCount}</p>
              <p className="text-base text-[#1e3f71] leading-relaxed">{summary.text}</p>
            </div>
            <button
              onClick={() => setSummary(null)}
              className="w-full px-4 py-2 bg-[#1e3f71] text-white rounded-lg hover:bg-[#152d52] transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
