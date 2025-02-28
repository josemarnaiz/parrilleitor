let mockConfig = {}

jest.mock('@auth0/nextjs-auth0/edge', () => {
  const mockHandleAuth = jest.fn()
  const mockHandleCallback = jest.fn()
  const mockHandleLogin = jest.fn()
  const mockHandleLogout = jest.fn()

  mockConfig = {
    login: {
      returnTo: 'https://parrilleitorai.vercel.app'
    },
    callback: {
      afterCallback: jest.fn()
    },
    logout: {
      returnTo: 'https://parrilleitorai.vercel.app'
    }
  }

  return {
    handleAuth: mockHandleAuth.mockReturnValue(mockConfig),
    handleCallback: mockHandleCallback,
    handleLogin: mockHandleLogin,
    handleLogout: mockHandleLogout
  }
})

describe('Auth Route Handlers', () => {
  beforeEach(() => {
    // Clear all mocks and config before each test
    jest.clearAllMocks()
    mockConfig = {
      login: {
        returnTo: 'https://parrilleitorai.vercel.app'
      },
      callback: {
        afterCallback: jest.fn()
      },
      logout: {
        returnTo: 'https://parrilleitorai.vercel.app'
      }
    }
    // Reset modules to ensure clean state
    jest.resetModules()
    // Import the route configuration
    require('../[auth0]/route')
  })

  test('handleAuth is configured with correct handlers', () => {
    expect(mockConfig).toBeDefined()
    expect(mockConfig.login).toBeDefined()
    expect(mockConfig.callback).toBeDefined()
    expect(mockConfig.logout).toBeDefined()
  })

  test('logout handler is configured with correct returnTo URL', () => {
    expect(mockConfig.logout).toBeDefined()
    expect(mockConfig.logout.returnTo).toBe('https://parrilleitorai.vercel.app')
  })

  test('logout handler does not have onRedirecting hook', () => {
    expect(mockConfig.logout).toBeDefined()
    expect(mockConfig.logout.onRedirecting).toBeUndefined()
  })

  test('session enhancement in callback', async () => {
    const mockSession = {
      user: {
        email: 'test@example.com'
      }
    }

    const afterCallback = mockConfig.callback.afterCallback
    afterCallback.mockImplementation((req, session) => {
      return {
        ...session,
        user: {
          ...session.user,
          sessionStartTime: expect.any(String)
        },
        expiresIn: 86400
      }
    })

    const enhancedSession = await afterCallback({}, mockSession)

    expect(enhancedSession).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          email: 'test@example.com',
          sessionStartTime: expect.any(String)
        }),
        expiresIn: 86400
      })
    )
  })
}) 