import path from "path";
import fs from "fs";

function getCommonSiteConfig() {
	let currentDir = path.resolve(".");
	// traverse up till we find frappe-bench with sites directory
	while (currentDir !== "/") {
		if (
			fs.existsSync(path.join(currentDir, "sites")) &&
			fs.existsSync(path.join(currentDir, "apps"))
		) {
			let configPath = path.join(currentDir, "sites", "common_site_config.json");
			if (fs.existsSync(configPath)) {
				return { config: JSON.parse(fs.readFileSync(configPath)), benchDir: currentDir };
			}
			return { config: null, benchDir: currentDir };
		}
		currentDir = path.resolve(currentDir, "..");
	}
	return { config: null, benchDir: null };
}

function getSiteName(benchDir) {
	if (!benchDir) return "localhost";
	let currentSitePath = path.join(benchDir, "sites", "currentsite.txt");
	if (fs.existsSync(currentSitePath)) {
		return fs.readFileSync(currentSitePath, "utf-8").trim();
	}
	// fallback: find first directory with site_config.json
	let sitesDir = path.join(benchDir, "sites");
	for (let entry of fs.readdirSync(sitesDir)) {
		if (fs.existsSync(path.join(sitesDir, entry, "site_config.json"))) {
			return entry;
		}
	}
	return "localhost";
}

const { config, benchDir } = getCommonSiteConfig();
const webserver_port = config ? config.webserver_port : 8000;
const site_name = getSiteName(benchDir);

if (!config) {
	console.log("No common_site_config.json found, using default port 8000");
}
console.log(`Proxy -> http://${site_name}:${webserver_port}`);

export default {
	"^/(app|api|assets|files|private)": {
		target: `http://127.0.0.1:${webserver_port}`,
		ws: true,
		secure: false,
		headers: {
			Host: site_name,
		},
	},
};
