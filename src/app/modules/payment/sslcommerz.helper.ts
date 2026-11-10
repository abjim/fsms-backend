import axios from 'axios';
import config from '../../config';
import AppError from '../../errors/AppError';

const BASE_URL = config.ssl.is_live
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

type TSslInitResponse = {
  status: string;
  failedreason?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
};

type TSslValidationResponse = {
  status: string;
  tran_id?: string;
  amount?: string;
  bank_tran_id?: string;
  card_type?: string;
};

const initPayment = async (payload: {
  transactionId: string;
  amount: number;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
}) => {
  if (!config.ssl.store_id || !config.ssl.store_passwd) {
    throw new AppError(500, 'SSLCommerz store credentials are not configured');
  }

  const data = new URLSearchParams({
    store_id: config.ssl.store_id,
    store_passwd: config.ssl.store_passwd,
    total_amount: payload.amount.toString(),
    currency: 'BDT',
    tran_id: payload.transactionId,
    success_url: `${config.server_url}/api/v1/payments/ssl/success`,
    fail_url: `${config.server_url}/api/v1/payments/ssl/fail`,
    cancel_url: `${config.server_url}/api/v1/payments/ssl/cancel`,
    ipn_url: `${config.server_url}/api/v1/payments/ssl/ipn`,
    shipping_method: 'NO',
    product_name: `FSMS Invoice ${payload.invoiceNumber}`,
    product_category: 'Field Service',
    product_profile: 'general',
    cus_name: payload.customerName,
    cus_email: payload.customerEmail,
    cus_add1: payload.customerAddress || 'Dhaka',
    cus_city: 'Dhaka',
    cus_country: 'Bangladesh',
    cus_phone: payload.customerPhone || '01700000000',
  });

  const response = await axios.post<TSslInitResponse>(
    `${BASE_URL}/gwprocess/v4/api.php`,
    data,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );

  if (response.data.status !== 'SUCCESS') {
    throw new AppError(
      400,
      response.data.failedreason || 'Failed to create SSLCommerz session',
    );
  }

  return response.data;
};

const validatePayment = async (valId: string) => {
  const response = await axios.get<TSslValidationResponse>(
    `${BASE_URL}/validator/api/validationserverAPI.php`,
    {
      params: {
        val_id: valId,
        store_id: config.ssl.store_id,
        store_passwd: config.ssl.store_passwd,
        format: 'json',
      },
    },
  );

  return response.data;
};

const isValidStatus = (status?: string) =>
  status === 'VALID' || status === 'VALIDATED';

export const SslCommerzHelper = {
  initPayment,
  validatePayment,
  isValidStatus,
};
