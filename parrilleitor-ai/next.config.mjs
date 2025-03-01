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
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    // Solo aplicar optimizaciones de chunks al código del cliente, no al servidor
    if (!isServer && process.env.NODE_ENV === 'production') {
      // Configuración más segura para splitChunks en el cliente
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Componentes comunes que se reutilizan
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          // Librerías de node_modules
          libs: {
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'async',
          }
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
