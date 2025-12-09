export function formatDueDate(date: string | null): string {
  if (!date) return '';

  const dueDate = new Date(date);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days overdue`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export function isOverdue(date: string | null): boolean {
  if (!date) return false;
  const dueDate = new Date(date);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < now;
}

export function isUpcoming(date: string | null): boolean {
  if (!date) return false;
  const dueDate = new Date(date);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 2;
}

export function formatDateForInput(date: string | null): string {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}
