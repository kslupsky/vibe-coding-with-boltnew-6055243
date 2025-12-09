import type { TaskWithCategory } from '../types/database';

export async function prioritizeInProgressTasks(
  tasks: TaskWithCategory[]
): Promise<{ summary: string; taskCount: number }> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/summarize-tasks`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach the AI service. Check your connection.');
    }
    throw error;
  }
}
