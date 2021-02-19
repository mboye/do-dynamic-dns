import Koa, { Context } from "koa";
import config from "./config";
import morgan from "koa-morgan";
import koaBasicAuth from "koa-basic-auth";

const app = new Koa();
app.use(morgan("combined"));
app.use(koaBasicAuth({ name: config.apiUser, pass: config.apiPassword }));

app.use(async (ctx) => {
  if (ctx.path === "/update") {
    return updateHandler(ctx);
  }

  ctx.body = "Hello world";
});

const updateHandler = (ctx: Context) => {
  console.log(ctx.request.toJSON());
  const { hostname, myip: currentIpAddress } = ctx.request.query;
  console.log(
    `Received update. Hostname: ${hostname}, IP address: ${currentIpAddress}`
  );

  ctx.status = 200;
};

console.log(`Listening on port ${config.listenPort}`);
app.listen(config.listenPort);
