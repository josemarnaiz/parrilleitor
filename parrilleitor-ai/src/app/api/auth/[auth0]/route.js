import { handleAuth } from '@auth0/nextjs-auth0/edge'

const AUTH0_BASE_URL = process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app'

export const GET = handleAuth()

export const POST = handleAuth()

export const runtime = 'edge' 