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
  // Note: We don't set X-Frame-Options header to allow iframe embedding in Umbrel
  // Umbrel's proxy handles security, and apps should open in iframes by default
}

module.exports = nextConfig
