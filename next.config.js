/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    NEXT_PUBLIC_APP_URL: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://task-management-system-hearing-hope.vercel.app',
    NEXT_PUBLIC_API_BASE_URL: process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/api'
      : 'https://task-management-system-hearing-hope.vercel.app/api'
  },
  images: {
    domains: ['task-management-system-hearing-hope.vercel.app', 'localhost']
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  }
};

module.exports = nextConfig; 