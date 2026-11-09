import { z } from 'zod';

const submitServiceReportValidationSchema = z.object({
  workOrderId: z.string({ required_error: 'Work order ID is required' }),
  problemFound: z.string({ required_error: 'Problem description is required' }).min(5),
  workSummary: z.string({ required_error: 'Work summary is required' }).min(10),
  partsUsed: z.string().optional(),
  laborHours: z.number({ required_error: 'Labor hours is required' }).min(0.5),
  customerSignatureUrl: z.string().optional(),
});

export const ServiceReportValidation = {
  submitServiceReportValidationSchema,
};
