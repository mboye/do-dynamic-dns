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
  logger.debug('Fetching domain records', { domainName });
  const { data } = await httpClient.get<DomainRecordsResponseBody>(
    `${config.digitalOcean.apiBaseUrl}/domains/${domainName}/records`
  );

  logger.debug('Fetched domain records', data);

  return data.domain_records;
};

const findDomainRecordByHostname = async (
  hostname: string
): Promise<DomainRecordWithDomainName | undefined> => {
  logger.info('Finding domain name record by hostname', { hostname });

  const domainName = hostname.split('.').slice(-2).join('.');
  logger.debug(`Two-level domain name is ${domainName}`);

  const records = await getDomainRecords(domainName);
  logger.debug(`Found ${records.length} domain records`);

  const hostnameRecord = records.find((record) => {
    const fqdn = `${record.name}.${domainName}`;
    logger.debug('Mapping domain record to hostname', { fqdn });
    return fqdn === hostname;
  });

  if (!hostnameRecord) {
    logger.error('None of the domain records matched the hostname');
    return undefined;
  }

  if (!['A', 'AAAA'].includes(hostnameRecord.type)) {
    logger.error(
      'Found domain record with matching hostname, but the record type is not A/AAAA',
      { domainRecord: hostnameRecord }
    );
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
