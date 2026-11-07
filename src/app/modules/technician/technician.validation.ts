import { z } from 'zod';

const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
});

const updateAvailabilityValidationSchema = z.object({
  slots: z.array(availabilitySlotSchema),
});

const updateStatusValidationSchema = z.object({
  isAvailable: z.boolean(),
});

export const TechnicianValidation = {
  updateAvailabilityValidationSchema,
  updateStatusValidationSchema,
};
