/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/moltbook-search",
  experimental: {
    serverActions: {
      allowedOrigins: ["demo.exa.ai"],
      allowedForwardedHosts: ["demo.exa.ai"],
    },
  },
};

export default nextConfig;
