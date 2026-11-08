import { WorkOrderStatus } from '@prisma/client';
import { z } from 'zod';

const assignWorkOrderValidationSchema = z.object({
  serviceRequestId: z.string({ required_error: 'Service request ID is required' }),
  technicianId: z.string({ required_error: 'Technician ID is required' }),
  scheduledDate: z.string({ required_error: 'Scheduled date is required' }),
  startTime: z.string({ required_error: 'Start time is required' }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:mm'),
  endTime: z.string({ required_error: 'End time is required' }).regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:mm'),
  adminNotes: z.string().optional(),
});

const updateWorkOrderStatusValidationSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus, { required_error: 'Status is required' }),
  technicianNotes: z.string().optional(),
});

export const WorkOrderValidation = {
  assignWorkOrderValidationSchema,
  updateWorkOrderStatusValidationSchema,
};
