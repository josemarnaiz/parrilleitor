import { handleAuth } from '@auth0/nextjs-auth0/edge'

export const GET = handleAuth()
export const POST = handleAuth()

export const runtime = 'edge' 