/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
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
