import { z } from 'zod';

export const complaintSubmitSchema = z.object({
  text: z.string().min(5, 'Complaint description must be at least 5 characters long'),
  wing: z.string().min(1, 'Wing is required'),
  flatNumber: z.string().min(1, 'Flat number is required'),
  commonArea: z.string().optional().default(''),
  residentName: z.string().min(2, 'Name must be at least 2 characters long'),
  phone: z.string().optional().default(''),
  photoUrl: z.string().optional().default(''),
  voiceTranscript: z.string().optional().default(''),
  honeypot: z.string().max(0, 'Spam detected').optional().default(''),
});

export const complaintUpdateSchema = z.object({
  status: z
    .enum(['new', 'triaged', 'assigned', 'in_progress', 'resolved', 'rejected', 'reopened'])
    .optional(),
  assignedTo: z.string().nullable().optional(),
  category: z
    .enum(['water', 'lift', 'parking', 'noise', 'cleaning', 'electrical', 'security', 'other'])
    .optional(),
  urgency: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  urgencyScore: z.number().min(0).max(100).optional(),
  internalNote: z.string().optional(),
  timelineNote: z.string().optional(),
  actorName: z.string().optional().default('Committee Member'),
});

export const residentCommentSchema = z.object({
  comment: z.string().min(2, 'Comment cannot be empty'),
  author: z.string().min(1, 'Author name is required'),
});

export const residentConfirmSchema = z.object({
  resolved: z.boolean(),
  feedback: z.string().optional().default(''),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
