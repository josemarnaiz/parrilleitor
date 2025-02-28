import React from 'react'
import { render, screen } from '@testing-library/react'
import { useUser } from '@auth0/nextjs-auth0/client'
import Navbar from '../Navbar'

// Mock useUser hook
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: jest.fn()
}))

describe('Navbar', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  test('shows loading state', () => {
    useUser.mockReturnValue({ isLoading: true })
    render(<Navbar />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  test('shows login button when user is not authenticated', () => {
    useUser.mockReturnValue({ user: null, isLoading: false })
    render(<Navbar />)
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
  })

  test('shows user menu when authenticated', () => {
    const mockUser = {
      email: 'test@example.com',
      name: 'Test User'
    }
    useUser.mockReturnValue({ user: mockUser, isLoading: false })
    render(<Navbar />)
    
    expect(screen.getByText('Bienvenido, Test User')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Mi Cuenta')).toBeInTheDocument()
    expect(screen.getByText('Cerrar Sesión')).toBeInTheDocument()
  })

  test('logout button has correct href', () => {
    const mockUser = {
      email: 'test@example.com',
      name: 'Test User'
    }
    useUser.mockReturnValue({ user: mockUser, isLoading: false })
    render(<Navbar />)
    
    const logoutButton = screen.getByText('Cerrar Sesión')
    expect(logoutButton.getAttribute('href')).toBe('/api/auth/logout')
  })

  test('navigation links do not trigger logout', () => {
    const mockUser = {
      email: 'test@example.com',
      name: 'Test User'
    }
    useUser.mockReturnValue({ user: mockUser, isLoading: false })
    render(<Navbar />)
    
    // Verify that other navigation links exist and don't have logout URL
    const chatLink = screen.getByText('Chat')
    const accountLink = screen.getByText('Mi Cuenta')
    
    expect(chatLink.getAttribute('href')).toBe('/chat')
    expect(accountLink.getAttribute('href')).toBe('/admin/users')
  })
}) 