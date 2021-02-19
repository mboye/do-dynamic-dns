import { config } from "dotenv";

config();

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable undefiend: ${key}`);
  }
  return value;
};

export default {
  listenPort: process.env.PORT,
  apiUser: requireEnv("API_USER"),
  apiPassword: requireEnv("API_PASSWORD"),
};
