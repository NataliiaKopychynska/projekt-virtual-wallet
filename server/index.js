const express = require('express')
const cors = require('cors')
const { OAuth2Client } = require('google-auth-library')
require('dotenv').config({ path: '../.env' })

const app = express()
const PORT = process.env.PORT || 3001
const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID
const client = new OAuth2Client(CLIENT_ID)

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())

/**
 * POST /api/auth/google
 * Receives a Google credential (JWT) from the frontend,
 * verifies it, and returns the authenticated user data.
 */
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body

  if (!credential) {
    return res.status(400).json({ error: 'Missing credential' })
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: CLIENT_ID,
    })

    const payload = ticket.getPayload()

    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      givenName: payload.given_name,
    }

    return res.json({ user })
  } catch (error) {
    console.error('Token verification failed:', error.message)
    return res.status(401).json({ error: 'Invalid or expired Google token' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  if (!CLIENT_ID) {
    console.warn('Warning: VITE_GOOGLE_CLIENT_ID is not set in .env')
  }
})
