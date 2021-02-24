import axios from 'axios';
import config from './config';
import { logger } from './logger';

const httpClient = axios.create({
  headers: {
    Authorization: `Bearer ${config.digitalOcean.token}`
  }
});

type DomainRecord = {
  id: number;
  type: string;
  name: string;
  data: string;
  ttl: number;
};

type DomainRecordsResponseBody = {
  // eslint-disable-next-line camelcase
  domain_records: DomainRecord[];
};

type DomainRecordWithDomainName = DomainRecord & {
  domainName: string;
};

const getDomainRecords = async (
  domainName: string
): Promise<DomainRecord[]> => {
  const { data } = await httpClient.get<DomainRecordsResponseBody>(
    `${config.digitalOcean.apiBaseUrl}/domains/${domainName}/records`
  );

  logger.debug('Fetched domain records', data);

  return data.domain_records;
};

const findDomainRecordByHostname = async (
  hostname: string
): Promise<DomainRecordWithDomainName | undefined> => {
  const domainName = hostname.split('.').slice(-2).join('.');
  const records = await getDomainRecords(domainName);

  const hostnameRecord = records.find((record) => {
    const fqdn = `${record.name}.${domainName}`;
    return fqdn === hostname;
  });

  if (!hostnameRecord) {
    return undefined;
  }

  if (['A', 'AAAA'].includes(hostnameRecord.type)) {
    return undefined;
  }

  return { ...hostnameRecord, domainName };
};

export const updateHostname = async (
  hostname: string,
  currentIpAddress: string
): Promise<void> => {
  const record = await findDomainRecordByHostname(hostname);
  if (!record) {
    throw new Error(
      `Failed to find domain A/AAAA record with hostname "${hostname}"`
    );
  }

  await updateDomainRecord(record, currentIpAddress);
};

const updateDomainRecord = async (
  record: DomainRecordWithDomainName,
  newIpAddress: string
): Promise<void> => {
  await httpClient.put(
    `${config.digitalOcean.apiBaseUrl}/domains/${record.domainName}/records/${record.id}`,
    { data: newIpAddress }
  );

  logger.info('Domain record updated');
};
