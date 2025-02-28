/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        extensions: ['.js', '.jsx', '.mjs', '.json'],
      }
    };
  },
};
