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
  // Add output: 'standalone' for better vercel compatibility
  output: 'standalone',  // Configure webpack for @react-pdf/renderer compatibility
  webpack: (config: any) => {
    // Add support for both .js and .mjs files in node_modules
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx', '.jsx', '.mjs'],
    };
    
    // Return the modified config
    return config;
  },  // Configure @react-pdf/renderer - can't be both transpiled and external
  // For production builds, using serverExternalPackages is better for performance
  serverExternalPackages: ['@react-pdf/renderer']
}

export default nextConfig;
