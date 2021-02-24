import Koa, { Context } from 'koa';
import morgan from 'koa-morgan';
import koaBasicAuth from 'koa-basic-auth';
import config from './config';
import { updateHostname } from './digitalOceanClient';
import { logger } from './logger';

const app = new Koa();
app.use(morgan('combined'));
app.use(koaBasicAuth({ name: config.apiUser, pass: config.apiPassword }));

app.use(async (ctx) => {
  if (ctx.path === '/nic/update') {
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

  if (!hostname || !currentIpAddress) {
    ctx.throw(400, 'Invalid No-IP update request');
  }

  logger.info('Processing IP address update', { hostname, currentIpAddress });
  await updateHostname(hostname, currentIpAddress);

  ctx.status = 200;
};

logger.info('Starting server', { port: config.listenPort });
app.listen(config.listenPort);
