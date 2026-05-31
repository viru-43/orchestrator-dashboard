import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: ['./node_modules'],
  },
  webpack: (config) => {
    // Handle font files
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
    });
    return config;
  },
  // Empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;

// Made with Bob
