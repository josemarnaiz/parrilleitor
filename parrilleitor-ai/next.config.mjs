/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
    optimizeCss: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com', 's.gravatar.com'],
    unoptimized: true,
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1920],
    formats: ['image/webp', 'image/avif']
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
            value: 'X-Requested-With, Content-Type, Authorization, x-next-router-state-tree, x-next-url, x-auth-token, x-client-version',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
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
    
    // Optimizaciones adicionales
    if (process.env.NODE_ENV === 'production') {
      // Optimiza los chunks para mejor carga en dispositivos móviles
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](@next|next|react|react-dom)[\\/]/,
            priority: 40,
            chunks: 'all',
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `lib.${packageName.replace('@', '')}`;
            },
            priority: 10,
            minChunks: 1,
            chunks: 'async',
          },
        },
      };
    }
    
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
