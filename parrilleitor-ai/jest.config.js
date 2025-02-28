module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^next/navigation': '<rootDir>/node_modules/next/navigation.js',
    '^next/router': '<rootDir>/node_modules/next/router.js',
    '^next/link': '<rootDir>/node_modules/next/link.js'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react'
      ],
      plugins: ['@babel/plugin-transform-modules-commonjs']
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@auth0/nextjs-auth0|next|@babel/runtime)/)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ],
  globals: {
    'React': true
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
} 