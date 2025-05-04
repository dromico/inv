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
  staticPageGenerationTimeout: 180,
  // Use standard output mode
  // output: 'standalone' - removed to allow npm run dev/start
}

export default nextConfig;
