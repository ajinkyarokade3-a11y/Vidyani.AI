import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, ".."), "");
  const frontendEnv = loadEnv(mode, __dirname, "");

  return {
    root: __dirname,
    plugins: [react(), tailwindcss()],
    define: {
      "import.meta.env.VITE_YOUTUBE_API_KEY_1": JSON.stringify(
        rootEnv.YOUTUBE_API_KEY_1 ||
          frontendEnv.YOUTUBE_API_KEY_1 ||
          frontendEnv.VITE_YOUTUBE_API_KEY_1 ||
          ""
      ),
      "import.meta.env.VITE_YOUTUBE_API_KEY_2": JSON.stringify(
        rootEnv.YOUTUBE_API_KEY_2 ||
          frontendEnv.YOUTUBE_API_KEY_2 ||
          frontendEnv.VITE_YOUTUBE_API_KEY_2 ||
          ""
      ),
      "import.meta.env.VITE_YOUTUBE_API_KEY_3": JSON.stringify(
        rootEnv.YOUTUBE_API_KEY_3 ||
          frontendEnv.YOUTUBE_API_KEY_3 ||
          frontendEnv.VITE_YOUTUBE_API_KEY_3 ||
          ""
      ),
      "import.meta.env.VITE_YOUTUBE_API_KEY_4": JSON.stringify(
        rootEnv.YOUTUBE_API_KEY_4 ||
          frontendEnv.YOUTUBE_API_KEY_4 ||
          frontendEnv.VITE_YOUTUBE_API_KEY_4 ||
          ""
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
    },
  };
});
