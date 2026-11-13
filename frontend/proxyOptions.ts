import path from "path";
import fs from "fs";
import type { ProxyOptions } from "vite";
import type { IncomingMessage } from "node:http";

// Keep the existing Frappe proxy option; Vite's public ProxyOptions type omits it.
type FrappeProxyOptions = ProxyOptions & { router: (req: IncomingMessage) => string };

function readWebserverPort(configPath: string): number | null {
  const parsed: unknown = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  if (parsed && typeof parsed === "object" && "webserver_port" in parsed &&
      typeof parsed.webserver_port === "number") {
    return parsed.webserver_port;
  }
  return null;
}

function getCommonSiteConfig() {
	let currentDir = path.resolve(".");
	// traverse up till we find frappe-bench with sites directory
	while (currentDir !== "/") {
		if (
			fs.existsSync(path.join(currentDir, "sites")) &&
			fs.existsSync(path.join(currentDir, "apps"))
		) {
			const configPath = path.join(currentDir, "sites", "common_site_config.json");
			if (fs.existsSync(configPath)) {
				return { port: readWebserverPort(configPath), benchDir: currentDir };
			}
			return { port: null, benchDir: currentDir };
		}
		currentDir = path.resolve(currentDir, "..");
	}
	return { port: null, benchDir: null };
}

function getSiteName(benchDir: string | null) {
	if (!benchDir) return "localhost";
	const currentSitePath = path.join(benchDir, "sites", "currentsite.txt");
	if (fs.existsSync(currentSitePath)) {
		return fs.readFileSync(currentSitePath, "utf-8").trim();
	}
	// fallback: find first directory with site_config.json
	const sitesDir = path.join(benchDir, "sites");
	for (const entry of fs.readdirSync(sitesDir)) {
		if (fs.existsSync(path.join(sitesDir, entry, "site_config.json"))) {
			return entry;
		}
	}
	return "localhost";
}

const { port, benchDir } = getCommonSiteConfig();
const webserver_port = port ?? 8000;
const site_name = getSiteName(benchDir);

if (port === null) {
	console.log("No common_site_config.json found, using default port 8000");
}
console.log(`Proxy default site -> http://${site_name}:${webserver_port}`);

const proxyOptions: Record<string, FrappeProxyOptions> = {
	"^/(desk|app|login|logout|api|assets|files|private)": {
		target: `http://127.0.0.1:${webserver_port}`,
		ws: true,
		secure: false,
		router: function (req) {
			const requestSiteName = req.headers.host?.split(":")[0] ?? site_name;
			return `http://${requestSiteName}:${webserver_port}`;
		},
	},
};

export default proxyOptions;
