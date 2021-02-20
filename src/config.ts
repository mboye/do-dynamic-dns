import { config } from 'dotenv';

config({ path: '.env' });

const env = process.env.NODE_ENV || 'dev';
console.log(`Loading config for environment: ${env}`);
config({ path: `.env.${env}` });

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable undefiend: ${key}`);
  }
  return value;
};

export default {
  listenPort: process.env.PORT,
  apiUser: requireEnv('API_USER'),
  apiPassword: requireEnv('API_PASSWORD'),
  digitalOcean: {
    apiBaseUrl: requireEnv('DO_API_BASE_URL'),
    token: requireEnv('DO_TOKEN'),
  },
};
