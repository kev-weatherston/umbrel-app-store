/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.nhle.com',
        pathname: '/logos/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            // Explicitly allow iframe embedding
            // Setting empty value or omitting X-Frame-Options allows embedding
            key: 'X-Frame-Options',
            value: '',
          },
          {
            // Allow framing from any origin (Umbrel will handle security)
            key: 'Content-Security-Policy',
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
