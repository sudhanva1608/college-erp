import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    description: z.string().optional().max(1000, 'Description must be less than 1000 characters'),
  }),
  // Express file upload handling - file is accessed via req.file, not req.body
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>['body'];