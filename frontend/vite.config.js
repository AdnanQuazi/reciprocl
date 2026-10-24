import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error - proxyOptions is not typed
import proxyOptions from "./proxyOptions";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	base: mode === "production" ? "/assets/reciprocl/frontend/" : "/",
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
