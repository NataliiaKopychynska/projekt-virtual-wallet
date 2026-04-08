const fs = require('fs')
const path = require('path')
const admin = require('./firebase')

const db = admin.firestore()
const TARGET_EMAIL = process.argv[2] || 'kadeem393@gmail.com'
const SEED_TAG = 'mock-human-pattern-v1'
const ROOT_ENV_PATH = path.join(__dirname, '../.env')

const resolveCredentialSource = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return 'FIREBASE_SERVICE_ACCOUNT_JSON'
  }

  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  const defaultPath = path.join(__dirname, 'firebase-service-account.json')
  const serviceAccountPath = configuredPath || defaultPath
  if (fs.existsSync(serviceAccountPath)) {
    return configuredPath
      ? `FIREBASE_SERVICE_ACCOUNT_PATH (${serviceAccountPath})`
      : `default file (${serviceAccountPath})`
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return `GOOGLE_APPLICATION_CREDENTIALS (${process.env.GOOGLE_APPLICATION_CREDENTIALS})`
  }

  return 'Application Default Credentials (ADC)'
}

const daysAgoAtNoon = (daysAgo) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(12, 0, 0, 0)
  return date
}

const pln = (amount) => Math.round(amount * 100)

const tx = (type, amountPln, category, comment, daysAgo) => ({
  type,
  amount: pln(amountPln),
  category,
  comment,
  transactionDate: daysAgoAtNoon(daysAgo),
})

const makeTransactions = () => {
  const transactions = []

  ;[
    [89, 8450, 'Wynagrodzenie', 'Pensja - etat'],
    [61, 8450, 'Wynagrodzenie', 'Pensja - etat'],
    [33, 8650, 'Wynagrodzenie', 'Pensja - etat + podwyzka'],
    [4, 8650, 'Wynagrodzenie', 'Pensja - etat'],
    [46, 1800, 'Premia', 'Premia kwartalna'],
    [18, 950, 'Zwrot', 'Zwrot podatku'],
    [57, 420, 'Sprzedaż', 'Sprzedaz starego biurka'],
    [26, 300, 'Zwrot', 'Zwrot za wspolne zakupy'],
    [12, 650, 'Sprzedaż', 'Sprzedaz monitora'],
    [8, 1200, 'Inne', 'Dodatkowe zlecenie UX'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('income', amount, category, comment, daysAgo))
  })

  ;[
    [88, 2450, 'Dom', 'Czynsz i oplaty'],
    [60, 2450, 'Dom', 'Czynsz i oplaty'],
    [32, 2490, 'Dom', 'Czynsz i oplaty'],
    [3, 2490, 'Dom', 'Czynsz i oplaty'],
    [84, 184.72, 'Dom', 'Prad'],
    [70, 89.40, 'Dom', 'Internet swiatlowodowy'],
    [54, 67.18, 'Dom', 'Gaz'],
    [42, 121.33, 'Dom', 'Woda i smieci'],
    [24, 192.85, 'Dom', 'Prad'],
    [14, 89.40, 'Dom', 'Internet swiatlowodowy'],
    [5, 72.11, 'Dom', 'Gaz'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [87, 19.99, 'Subskrypcje', 'Netflix'],
    [87, 23.99, 'Subskrypcje', 'Spotify Premium Duo'],
    [86, 12.99, 'Subskrypcje', 'iCloud 200 GB'],
    [59, 19.99, 'Subskrypcje', 'Netflix'],
    [59, 23.99, 'Subskrypcje', 'Spotify Premium Duo'],
    [58, 12.99, 'Subskrypcje', 'iCloud 200 GB'],
    [31, 19.99, 'Subskrypcje', 'Netflix'],
    [31, 23.99, 'Subskrypcje', 'Spotify Premium Duo'],
    [30, 12.99, 'Subskrypcje', 'iCloud 200 GB'],
    [2, 19.99, 'Subskrypcje', 'Netflix'],
    [2, 23.99, 'Subskrypcje', 'Spotify Premium Duo'],
    [1, 12.99, 'Subskrypcje', 'iCloud 200 GB'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [90, 286.41, 'Zakupy', 'Duze zakupy weekendowe'],
    [83, 148.32, 'Zakupy', 'Biedronka'],
    [79, 62.47, 'Zakupy', 'Zabka po pracy'],
    [76, 214.88, 'Zakupy', 'Lidl'],
    [72, 173.56, 'Zakupy', 'Kaufland'],
    [68, 91.24, 'Zakupy', 'Rossmann i drobiazgi'],
    [64, 238.90, 'Zakupy', 'Carrefour'],
    [55, 184.73, 'Zakupy', 'Lidl'],
    [51, 57.80, 'Zakupy', 'Piekarnia i warzywniak'],
    [47, 263.15, 'Zakupy', 'Auchan'],
    [40, 132.06, 'Zakupy', 'Biedronka'],
    [36, 296.44, 'Zakupy', 'Duze zakupy przed weekendem'],
    [29, 118.72, 'Zakupy', 'Zabka i piekarnia'],
    [25, 221.39, 'Zakupy', 'Lidl'],
    [21, 76.55, 'Zakupy', 'Rossmann'],
    [17, 309.84, 'Zakupy', 'Carrefour'],
    [13, 143.26, 'Zakupy', 'Biedronka'],
    [9, 58.34, 'Zakupy', 'Zakupy na szybko'],
    [6, 271.90, 'Zakupy', 'Duze zakupy tygodniowe'],
    [1, 187.48, 'Zakupy', 'Lidl i warzywniak'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [85, 18.50, 'Jedzenie', 'Kawa i kanapka'],
    [82, 31.90, 'Restauracje', 'Lunch z zespollem'],
    [77, 24.00, 'Jedzenie', 'Kebab po silowni'],
    [74, 42.80, 'Restauracje', 'Sushi z dowozem'],
    [69, 15.20, 'Jedzenie', 'Kawa specialty'],
    [66, 28.50, 'Restauracje', 'Lunch na miescie'],
    [62, 54.90, 'Restauracje', 'Pizza z dowozem'],
    [56, 17.40, 'Jedzenie', 'Sniadanie na stacji'],
    [50, 33.60, 'Restauracje', 'Bistro po pracy'],
    [45, 21.90, 'Jedzenie', 'Bubble tea i przekaska'],
    [39, 46.00, 'Restauracje', 'Burger z frytkami'],
    [35, 14.80, 'Jedzenie', 'Kawa i ciastko'],
    [28, 37.20, 'Restauracje', 'Lunch biznesowy'],
    [23, 18.90, 'Jedzenie', 'Wrap i napoj'],
    [19, 58.70, 'Restauracje', 'Kolacja w miescie'],
    [15, 16.50, 'Jedzenie', 'Kawa na wynos'],
    [11, 26.40, 'Restauracje', 'Pho na miescie'],
    [7, 49.90, 'Restauracje', 'Pizza z dowozem'],
    [4, 22.80, 'Jedzenie', 'Kanapki i sok'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [81, 149.00, 'Transport', 'Paliwo'],
    [73, 38.00, 'Transport', 'Uber po spotkaniu'],
    [65, 119.80, 'Transport', 'Bilet miesieczny'],
    [52, 164.22, 'Transport', 'Paliwo i myjnia'],
    [44, 22.40, 'Transport', 'Parking w centrum'],
    [34, 41.50, 'Transport', 'Bolt po imprezie'],
    [27, 122.00, 'Transport', 'Bilet miesieczny'],
    [20, 176.35, 'Transport', 'Paliwo'],
    [10, 18.00, 'Transport', 'Komunikacja miejska'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [80, 74.99, 'Zdrowie', 'Apteka i suplementy'],
    [53, 220.00, 'Zdrowie', 'Wizyta u dentysty'],
    [22, 89.90, 'Zdrowie', 'Badania laboratoryjne'],
    [16, 54.30, 'Zdrowie', 'Leki sezonowe'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [78, 129.99, 'Rozrywka', 'Gra na Steam'],
    [63, 58.00, 'Rozrywka', 'Kino dla dwoch'],
    [41, 34.90, 'Rozrywka', 'Ksiiazka i ebook'],
    [37, 79.00, 'Rozrywka', 'Escape room'],
    [30, 24.99, 'Rozrywka', 'Wypozyczenie filmu'],
    [8, 69.00, 'Rozrywka', 'Krgle ze znajomymi'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [71, 199.90, 'Ubrania', 'Jeansy i t-shirt'],
    [38, 249.00, 'Ubrania', 'Buty sportowe'],
    [9, 89.99, 'Ubrania', 'Bluza'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [75, 49.00, 'Prezenty', 'Kwiaty i prezent'],
    [43, 120.00, 'Prezenty', 'Urodziny siostry'],
    [6, 69.00, 'Prezenty', 'Prezent dla znajomego'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [67, 39.00, 'Zwierzęta', 'Karma dla kota'],
    [48, 65.00, 'Zwierzęta', 'Zwir i przysmaki'],
    [18, 42.50, 'Zwierzęta', 'Karma weterynaryjna'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [49, 149.00, 'Edukacja', 'Kurs TypeScript'],
    [17, 39.90, 'Edukacja', 'Ksiazka o finansach'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  ;[
    [33, 9.00, 'Opłaty bankowe', 'Oplata za karte'],
    [4, 9.00, 'Opłaty bankowe', 'Oplata za karte'],
    [58, 399.00, 'Podróże', 'Bilet kolejowy do Krakowa'],
    [57, 219.00, 'Podróże', 'Nocleg weekendowy'],
    [24, 32.90, 'Inne', 'Pranie chemiczne'],
    [14, 45.00, 'Inne', 'Serwis roweru'],
    [2, 27.50, 'Inne', 'Dorobienie kluczy'],
  ].forEach(([daysAgo, amount, category, comment]) => {
    transactions.push(tx('expense', amount, category, comment, daysAgo))
  })

  return transactions.sort((a, b) => a.transactionDate - b.transactionDate)
}

const seedTransactions = async () => {
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.warn(
      `Warning: missing FIREBASE_PROJECT_ID in ${ROOT_ENV_PATH}. Firebase Admin may rely only on credential metadata.`,
    )
  }
  console.log(`Using Firebase Admin credential source: ${resolveCredentialSource()}`)
  console.log(`Target user email: ${TARGET_EMAIL}`)

  const userRecord = await admin.auth().getUserByEmail(TARGET_EMAIL)
  const uid = userRecord.uid
  const txCollection = db.collection('users').doc(uid).collection('transactions')

  const existingSeeded = await txCollection.where('seedTag', '==', SEED_TAG).get()
  const cleanupBatch = db.batch()
  existingSeeded.docs.forEach((docSnap) => cleanupBatch.delete(docSnap.ref))
  if (!existingSeeded.empty) {
    await cleanupBatch.commit()
  }

  const transactions = makeTransactions()
  const insertBatch = db.batch()
  transactions.forEach((tx) => {
    const docRef = txCollection.doc()
    insertBatch.set(docRef, {
      ...tx,
      transactionDate: admin.firestore.Timestamp.fromDate(tx.transactionDate),
      seedTag: SEED_TAG,
      seededAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  })
  await insertBatch.commit()

  const summary = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount
      if (tx.type === 'expense') acc.expense += tx.amount
      return acc
    },
    { income: 0, expense: 0 },
  )

  console.log(`Seed completed for ${TARGET_EMAIL} (uid: ${uid}).`)
  console.log(`Inserted transactions: ${transactions.length}`)
  console.log(`Income total: ${summary.income.toFixed(2)} PLN`)
  console.log(`Expense total: ${summary.expense.toFixed(2)} PLN`)
  console.log(`Net: ${(summary.income - summary.expense).toFixed(2)} PLN`)
}

seedTransactions().catch((error) => {
  const message = String(error?.message || error)
  if (
    message.includes('Could not load the default credentials') ||
    message.includes('The incoming JSON object does not contain a client_email field')
  ) {
    console.error(
      [
        'Seeding failed because Firebase Admin credentials are not configured correctly.',
        'Provide one of these in .env:',
        '- FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/firebase-service-account.json',
        '- FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}',
      ].join('\n'),
    )
  }
  console.error('Seeding failed:', error.message || error)
  process.exit(1)
})
