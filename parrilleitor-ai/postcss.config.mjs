/** @type {import('postcss-load-config').Config} */
export default {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('autoprefixer'),
  ],
};
