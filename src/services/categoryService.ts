import { supabase } from '../lib/supabase';
import type { Category } from '../types/database';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at'>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function initializeDefaultCategories(userId: string): Promise<void> {
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (existingCategories && existingCategories.length > 0) {
    return;
  }

  const defaultCategories = [
    { name: 'Work', color: '#3B82F6', icon: 'briefcase', user_id: userId },
    { name: 'Personal', color: '#10B981', icon: 'user', user_id: userId },
    { name: 'Health', color: '#EF4444', icon: 'heart', user_id: userId },
    { name: 'Learning', color: '#F59E0B', icon: 'book-open', user_id: userId },
    { name: 'Shopping', color: '#a13c87', icon: 'shopping-cart', user_id: userId },
  ];

  const { error } = await supabase
    .from('categories')
    .insert(defaultCategories);

  if (error) throw error;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
