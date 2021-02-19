import { config } from "dotenv";

config();

export default {
  listenPort: process.env.PORT,
};
