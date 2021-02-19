import Koa from "koa";
import config from "./config";

const app = new Koa();

app.use((ctx) => {
  ctx.body = "Hello world";
});

console.log(`Listening on port ${config.listenPort}`);
app.listen(config.listenPort);
