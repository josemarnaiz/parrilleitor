/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  },
  images: {
    domains: ['lh3.googleusercontent.com', 's.gravatar.com'],
    unoptimized: true
  },
  async headers() {
    return [
      {
        // Aplica estos headers a todas las rutas
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization, x-next-router-state-tree, x-next-url',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    return {
      ...config,
      resolve: {
        ...config.resolve,
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
        fallback: {
          "mongodb-client-encryption": false,
          "aws4": false,
          "kerberos": false,
          "supports-color": false,
          "@mongodb-js/zstd": false,
          "snappy": false,
          "@aws-sdk/credential-providers": false,
          "bson-ext": false,
          "mongodb-client-encryption": false,
          "snappy/package.json": false,
          "aws4/lib/browser": false,
          "kerberos/lib/win32/wrappers": false,
        }
      }
    };
  },
};

export default nextConfig;
