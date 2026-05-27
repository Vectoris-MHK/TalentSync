import { promises as dns } from "dns";

export async function uriFromSrv(srvUri) {
  const match = srvUri.match(/^mongodb\+srv:\/\/(.*)@([^/]+)\/(.*)$/);
  if (!match) return srvUri;

  const [, auth, hostname, rest] = match;
  const records = await dns.resolveSrv(`_mongodb._tcp.${hostname}`);

  const hosts = records
    .map((r) => `${r.name}:${r.port}`)
    .join(",");

  return `mongodb://${auth}@${hosts}/?${rest}&ssl=true`;
}
