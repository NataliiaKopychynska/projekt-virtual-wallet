const express = require('express')
const cors = require('cors')
const admin = require('./firebase')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json())


// Middleware: verify Firebase ID token
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const match = authHeader.match(/^Bearer (.+)$/)
  const idToken = match ? match[1] : null
  if (!idToken) {
    return res.status(401).json({ error: 'Missing Firebase ID token' })
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    req.firebaseUser = decodedToken
    next()
  } catch (err) {
    const reason = err && err.message ? err.message : 'Unknown token verification error'
    console.error('Firebase token verification failed:', reason)
    return res.status(401).json({ error: `Invalid Firebase ID token: ${reason}` })
  }
}

/**
 * POST /api/auth/firebase
 * Receives a Firebase ID token from the frontend, verifies it,
 * and returns the authenticated user data (from Firebase).
 */
app.post('/api/auth/firebase', verifyFirebaseToken, async (req, res) => {
  const { firebaseUser } = req
  // Możesz tu dodać logikę mapowania do użytkownika w MongoDB
  // lub tworzenia nowego użytkownika jeśli nie istnieje
  // Przykład:
  // const user = await User.findOneAndUpdate(...)
  // Na razie zwracamy dane z Firebase
  return res.json({
    user: {
      id: firebaseUser.uid,
      username: firebaseUser.name || '',
      email: firebaseUser.email,
      avatarURL: firebaseUser.picture || '',
      givenName: firebaseUser.name ? firebaseUser.name.split(' ')[0] : '',
    },
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
