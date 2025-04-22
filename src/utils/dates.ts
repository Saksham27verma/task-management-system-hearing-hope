import { format, isToday, isBefore, formatDistance, addDays, differenceInDays } from 'date-fns';

// Format date to string
export function formatDate(date: Date, formatString: string = 'yyyy-MM-dd'): string {
  return format(date, formatString);
}

// Format date to human-readable string
export function formatDateHuman(date: Date): string {
  return format(date, 'MMMM d, yyyy');
}

// Format date with time to human-readable string
export function formatDateTimeHuman(date: Date): string {
  return format(date, 'MMMM d, yyyy h:mm a');
}

// Check if date is today
export function isDateToday(date: Date): boolean {
  return isToday(date);
}

// Check if date is in the past
export function isDatePast(date: Date): boolean {
  return isBefore(date, new Date());
}

// Get human-readable time elapsed since date
export function getTimeElapsed(date: Date): string {
  return formatDistance(date, new Date(), { addSuffix: true });
}

// Get days remaining until date
export function getDaysRemaining(date: Date): number {
  const now = new Date();
  return Math.max(0, differenceInDays(date, now));
}

// Get array of dates for daily progress tracking
export function getDatesBetween(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  return dates;
}

// Get today's date at midnight
export function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// Get end of today
export function getEndOfToday(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}

// Determine task status based on due date and completion
export function determineTaskStatus(dueDate: Date, completedDate: Date | null, progressUpdates: any[]): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'INCOMPLETE' {
  const now = new Date();
  
  // If task is completed
  if (completedDate) {
    // Check if completed after due date
    return isBefore(completedDate, dueDate) ? 'COMPLETED' : 'DELAYED';
  }
  
  // Task is not completed
  if (isBefore(dueDate, now)) {
    // Due date passed without completion
    return 'INCOMPLETE';
  }
  
  // Task is still within timeframe
  return progressUpdates.length > 0 ? 'IN_PROGRESS' : 'PENDING';
} 