import { supabase } from '../lib/supabase';
import type { Task, TaskWithCategory } from '../types/database';

export async function fetchTasks(): Promise<TaskWithCategory[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      category:categories(*)
    `)
    .order('position', { ascending: true });

  if (error) throw error;
  return data as TaskWithCategory[];
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateTaskPosition(id: string, status: string, position: number): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ status, position, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}
