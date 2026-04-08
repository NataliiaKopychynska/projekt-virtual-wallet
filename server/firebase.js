// Firebase admin initialization for backend
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const admin = require('firebase-admin')

const resolveCredential = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    return admin.credential.cert(parsed)
  }

  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  const defaultPath = path.join(__dirname, 'firebase-service-account.json')
  const serviceAccountPath = configuredPath
    ? path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(__dirname, '..', configuredPath)
    : defaultPath

  if (fs.existsSync(serviceAccountPath)) {
    const fileContent = fs.readFileSync(serviceAccountPath, 'utf8')
    return admin.credential.cert(JSON.parse(fileContent))
  }

  console.warn(
    'Firebase Admin credential not found in FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH. Falling back to Application Default Credentials.',
  )

  // Works in environments with Application Default Credentials (e.g. GCP runtime).
  return admin.credential.applicationDefault()
}

admin.initializeApp({
  credential: resolveCredential(),
  projectId: process.env.FIREBASE_PROJECT_ID,
})

module.exports = admin
