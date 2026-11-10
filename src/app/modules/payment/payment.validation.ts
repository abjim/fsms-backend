import { z } from 'zod';

const initiatePaymentValidationSchema = z.object({
  invoiceId: z.string({ required_error: 'Invoice ID is required' }),
});

export const PaymentValidation = {
  initiatePaymentValidationSchema,
};
