/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // During the build process, ignore TypeScript errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // During the build process, ignore ESLint errors
    ignoreDuringBuilds: true,
  },
  // Increase the static generation timeout
  staticPageGenerationTimeout: 180,  // Default handling for builds to make it compatible with both dev and production
  serverExternalPackages: ['@react-pdf/renderer']
}

export default nextConfig;
