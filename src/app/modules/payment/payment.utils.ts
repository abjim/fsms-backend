import crypto from 'crypto';

export const generateTransactionId = () => {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `FSMS-${Date.now()}-${random}`;
};
