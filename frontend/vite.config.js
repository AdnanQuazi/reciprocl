import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	base: "/assets/reciprocl/frontend/",
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			"/api": {
				target: "http://library.localhost:8001",
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: "../reciprocl/public/frontend",
		emptyOutDir: true,
	},
});
