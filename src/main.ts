import Koa, { Context } from 'koa';
import morgan from 'koa-morgan';
import koaBasicAuth from 'koa-basic-auth';
import config from './config';
import { logger } from './logger';
import {
  findDomainRecordByHostname,
  updateDomainRecord
} from './digitalOceanClient';

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

  const record = await findDomainRecordByHostname(hostname);
  if (!record) {
    logger.error('Failed to find domain A/AAAA record with hostname', {
      hostname
    });
    ctx.body = 'nohost';
    ctx.status = 200;
    return;
  }

  if (record.data === currentIpAddress) {
    logger.info('Domain record is already up to date', { currentIpAddress });
    ctx.body = `nochg ${record.data}`;
    ctx.status = 200;
    return;
  }

  const updatedRecord = await updateDomainRecord(record, currentIpAddress);
  ctx.body = `good ${updatedRecord.data}`;
  ctx.status = 200;
};

logger.info('Starting server', { port: config.listenPort });
const listener = app.listen(config.listenPort);

const exitHandler = async () => {
  logger.info('Shutting down server');
  listener.close((error) => {
    if (error) {
      logger.error(error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.once('SIGTERM', exitHandler);
process.once('SIGINT', exitHandler);
