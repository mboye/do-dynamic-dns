import Koa, { Context } from "koa";
import config from "./config";
import morgan from "koa-morgan";
import koaBasicAuth from "koa-basic-auth";
import { updateHostname } from "./digitalOceanClient";

const app = new Koa();
app.use(morgan("combined"));
app.use(koaBasicAuth({ name: config.apiUser, pass: config.apiPassword }));

app.use(async (ctx) => {
  if (ctx.path === "/nic/update") {
    await updateHandler(ctx);
    return;
  }

  ctx.status = 404;
});

const updateHandler = async (ctx: Context) => {
  const { hostname, myip: currentIpAddress } = ctx.query as Record<
    string,
    string
  >;
  console.log(
    `Received update. Hostname: ${hostname}, IP address: ${currentIpAddress}`
  );

  await updateHostname(hostname, currentIpAddress);

  ctx.status = 200;
};

console.log(`Listening on port ${config.listenPort}`);
app.listen(config.listenPort);
