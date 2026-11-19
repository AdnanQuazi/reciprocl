import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import proxyOptions from "./proxyOptions.ts";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	base: mode === "production" ? "/assets/reciprocl/frontend/" : "/",
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	plugins: [
		react(),
		tailwindcss(),
		{
			name: "redirect-root-to-reciprocl",
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url === "/" || req.url === "") {
						res.writeHead(302, { Location: "/reciprocl" });
						res.end();
						return;
					}
					next();
				});
			},
		},
	],
	server: {
		port: 5173,
		proxy: proxyOptions,
	},
	build: {
		outDir: "../reciprocl/public/frontend",
		emptyOutDir: true,
	},
}));
