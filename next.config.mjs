/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ws'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;