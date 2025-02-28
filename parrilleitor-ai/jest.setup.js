import '@testing-library/jest-dom'
import React from 'react'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  const Link = ({ children, href, ...rest }) => {
    return React.createElement('a', { href, ...rest }, children)
  }
  Link.displayName = 'Link'
  return Link
})

// Mock Auth0 client
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn(),
  UserProvider: ({ children }) => React.createElement(React.Fragment, null, children)
}))

// Set up environment variables
process.env.AUTH0_BASE_URL = 'http://localhost:3000' 