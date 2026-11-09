import { z } from 'zod';

const generateInvoiceValidationSchema = z.object({
  workOrderId: z.string({ required_error: 'Work order ID is required' }),
  laborCost: z.number({ required_error: 'Labor cost is required' }).min(0),
  partsCost: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
});

export const InvoiceValidation = {
  generateInvoiceValidationSchema,
};
