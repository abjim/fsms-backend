import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  jwt: {
    jwt_secret: process.env.JWT_ACCESS_SECRET || 'fsms_jwt_access_secret',
    expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '7d',
    refresh_token_secret: process.env.JWT_REFRESH_SECRET || 'fsms_jwt_refresh_secret',
    refresh_token_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@fsms.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@1234',
  },
  server_url: process.env.SERVER_URL || 'http://localhost:5000',
  ssl: {
    store_id: process.env.SSL_STORE_ID || '',
    store_passwd: process.env.SSL_STORE_PASSWORD || '',
    is_live: process.env.SSL_IS_LIVE === 'true',
  },
};
