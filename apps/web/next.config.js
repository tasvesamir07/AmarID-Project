/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  async rewrites() {
    const apiBase =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
