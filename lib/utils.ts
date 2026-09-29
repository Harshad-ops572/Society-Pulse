import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { UrgencyLevel, ComplaintStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateComplaintId(seq: number, year: number = new Date().getFullYear()): string {
  const padded = String(seq).padStart(4, '0');
  return `SP-${year}-${padded}`;
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string | Date | undefined): string {
  if (!date) return '-';
  const now = new Date().getTime();
  const past = new Date(date).getTime();
  const diffMinutes = Math.floor((now - past) / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function getSlaCountdown(slaDueAt: string | Date | undefined): {
  text: string;
  isOverdue: boolean;
  hoursLeft: number;
} {
  if (!slaDueAt) {
    return { text: 'N/A', isOverdue: false, hoursLeft: 999 };
  }
  const now = new Date().getTime();
  const due = new Date(slaDueAt).getTime();
  const diffMs = due - now;
  const hoursLeft = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs <= 0) {
    const overdueHours = Math.abs(hoursLeft);
    return {
      text: overdueHours === 0 ? 'Overdue now' : `${overdueHours}h overdue`,
      isOverdue: true,
      hoursLeft,
    };
  }

  if (hoursLeft < 1) {
    const minutesLeft = Math.round(diffMs / (1000 * 60));
    return {
      text: `${Math.max(1, minutesLeft)}m left`,
      isOverdue: false,
      hoursLeft: 0.5,
    };
  }

  return {
    text: `${hoursLeft}h left`,
    isOverdue: false,
    hoursLeft,
  };
}

export function getUrgencyBadgeStyle(urgency: UrgencyLevel): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (urgency) {
    case 'critical':
      return {
        bg: 'bg-red-500/10 text-red-400',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
      };
    case 'high':
      return {
        bg: 'bg-orange-500/10 text-orange-400',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        dot: 'bg-orange-500 shadow-[0_0_8px_#f97316]',
      };
    case 'medium':
      return {
        bg: 'bg-amber-500/10 text-amber-400',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-500 shadow-[0_0_8px_#eab308]',
      };
    case 'low':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500 shadow-[0_0_8px_#22c55e]',
      };
  }
}

export function getStatusBadgeStyle(status: ComplaintStatus): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case 'new':
      return { bg: 'bg-sky-500/15', text: 'text-sky-300', label: 'New' };
    case 'triaged':
      return { bg: 'bg-purple-500/15', text: 'text-purple-300', label: 'Triaged' };
    case 'assigned':
      return { bg: 'bg-blue-500/15', text: 'text-blue-300', label: 'Assigned' };
    case 'in_progress':
      return { bg: 'bg-amber-500/15', text: 'text-amber-300', label: 'In Progress' };
    case 'resolved':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-300', label: 'Resolved' };
    case 'rejected':
      return { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Rejected' };
    case 'reopened':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Reopened' };
  }
}
