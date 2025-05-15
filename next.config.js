/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_URL: 'https://task-management-system-hearing-hope.vercel.app',
    NEXT_PUBLIC_API_BASE_URL: 'https://task-management-system-hearing-hope.vercel.app/api'
  },
  images: {
    domains: ['task-management-system-hearing-hope.vercel.app']
  }
};

module.exports = nextConfig; 