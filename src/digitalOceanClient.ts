import axios from "axios";
import config from "./config";

const httpClient = axios.create({
  headers: {
    Authorization: `Bearer ${config.digitalOcean.token}`,
  },
});

type Domain = {
  name: string;
  ttl: number;
};

type DomainsResponseBody = {
  domains: Domain[];
};

type DomainRecord = {
  id: number;
  type: string;
  name: string;
  data: string;
  ttl: number;
};

type DomainRecordsResponseBody = {
  domain_records: DomainRecord[];
};

type DomainRecordResponseBody = {
  domain_record: DomainRecord;
};

type ExtendedDomainRecord = DomainRecord & {
  fqdn: string;
  domain: Domain;
};

const getAllDomains = async (): Promise<Domain[]> => {
  const { data } = await httpClient.get<DomainsResponseBody>(
    `${config.digitalOcean.apiBaseUrl}/domains`
  );

  return data.domains;
};

const getDomainRecords = async (
  domainName: string
): Promise<DomainRecord[]> => {
  const { data } = await httpClient.get<DomainRecordsResponseBody>(
    `${config.digitalOcean.apiBaseUrl}/domains/${domainName}/records`
  );

  return data.domain_records;
};

const getAllDomainRecords = async (): Promise<ExtendedDomainRecord[]> => {
  const domains = await getAllDomains();

  return (
    await Promise.all(
      domains.map(async (domain) =>
        (await getDomainRecords(domain.name))
          .filter((record) => ["A", "AAAA"].includes(record.type))
          .map<ExtendedDomainRecord>((record) => ({
            ...record,
            domain,
            fqdn: `${record.name}.${domain.name}`,
          }))
      )
    )
  ).flat();
};

const findDomainRecordByHostname = async (
  hostname: string
): Promise<ExtendedDomainRecord | undefined> => {
  const records = await getAllDomainRecords();
  return records.find((record) => record.fqdn === hostname);
};

export const updateHostname = async (
  hostname: string,
  currentIpAddress: string
): Promise<void> => {
  const record = await findDomainRecordByHostname(hostname);
  if (!record) {
    throw new Error(`Failed to find domain record with hostname "${hostname}"`);
  }

  if (record.type !== "A") {
    console.log("Found domain record", record);
    throw new Error("Found domain record, but its type is not A or AAAA.");
  }

  await updateDomainRecord(record, currentIpAddress);
};

const updateDomainRecord = async (
  record: ExtendedDomainRecord,
  newIpAddress: string
): Promise<void> => {
  const { data } = await httpClient.put<DomainRecordResponseBody>(
    `${config.digitalOcean.apiBaseUrl}/domains/${record.domain.name}/records/${record.id}`,
    { data: newIpAddress }
  );

  console.log("Domain record updated", data.domain_record);
};
