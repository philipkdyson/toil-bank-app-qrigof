
// TOIL Event types
export interface ToilEvent {
  id: string;
  timestamp: string; // ISO 8601 format
  type: 'ADD' | 'TAKE';
  minutes: number; // Always positive integer
  note?: string;
  created_at: string; // ISO 8601 format
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approved_by?: string;
  approval_timestamp?: string;
}

// Pending event with user details (for managers)
export interface PendingToilEvent extends ToilEvent {
  user_id: string;
  user_name: string;
  user_email: string;
}

export interface ToilBalance {
  balance: number; // Total minutes (can be negative)
  addMinutes: number;
  takeMinutes: number;
}

// Helper function to format minutes to "Xh Ym" display
export function formatMinutes(minutes: number): string {
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  const sign = minutes < 0 ? '−' : '';
  
  if (hours === 0) {
    return `${sign}${mins}m`;
  }
  if (mins === 0) {
    return `${sign}${hours}h`;
  }
  return `${sign}${hours}h ${mins}m`;
}

// Helper to snap minutes down to 5-minute increments
export function snapToFiveMinutes(minutes: number): number {
  return Math.floor(minutes / 5) * 5;
}

// Helper to check if a date is today
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Helper to format date for grouping
export function formatDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // Format as "Mon, Jan 15"
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}
