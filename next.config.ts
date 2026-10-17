import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* cacheComponents désactivé : il empêchait l'hydratation des filtres client */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
