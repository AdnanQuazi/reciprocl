import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error - proxyOptions is not typed
import proxyOptions from "./proxyOptions.js";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	base: mode === "production" ? "/assets/reciprocl/frontend/" : "/",
	plugins: [react(), tailwindcss()],
	server: {
		port: 8080,
		proxy: proxyOptions,
	},
	build: {
		outDir: "../reciprocl/public/frontend",
		emptyOutDir: true,
	},
}));
