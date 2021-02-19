import Koa, { Context } from "koa";
import config from "./config";
import morgan from "koa-morgan";

const app = new Koa();
app.use(morgan("combined"));

app.use(async (ctx) => {
  if (ctx.path === "/update") {
    return updateHandler(ctx);
  }

  ctx.body = "Hello world";
});

const updateHandler = (ctx: Context) => {
  console.log(ctx.request.toJSON());
  ctx.status = 200;
};

console.log(`Listening on port ${config.listenPort}`);
app.listen(config.listenPort);
