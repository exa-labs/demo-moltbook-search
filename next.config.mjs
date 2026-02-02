/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/moltbook",
  experimental: {
    serverActions: {
      allowedOrigins: ["demo.exa.ai", "exa.ai"],
      allowedForwardedHosts: ["demo.exa.ai", "exa.ai"],
    },
  },
};

export default nextConfig;
