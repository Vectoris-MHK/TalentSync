import { promises as dns } from "dns";
import dnsSync from "dns";

dnsSync.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

export async function uriFromSrv(srvUri) {
  const match = srvUri.match(/^mongodb\+srv:\/\/(.*)@([^/]+)\/(.*)$/);
  if (!match) return srvUri;

  const [, auth, hostname, rest] = match;

  const params = new URLSearchParams(rest.replace(/^\?/, ""));
  const suffix = [...params].map(([k, v]) => `${k}=${v}`).join("&");

  const records = await dns.resolveSrv(`_mongodb._tcp.${hostname}`);
  const hosts = records.map((r) => `${r.name}:${r.port}`).join(",");

  return `mongodb://${auth}@${hosts}/?authSource=admin&ssl=true&${suffix}`;
}
