import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "true" ? { output: "standalone" as const } : {}),
  serverExternalPackages: ["playwright"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
