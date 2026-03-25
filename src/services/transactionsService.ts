import {
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit,
  serverTimestamp,
  QueryDocumentSnapshot,
  QueryConstraint,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  tId: string
  type: TransactionType
  amount: number
  category: string
  comment: string
  transactionDate: Date
  createdAt: Date | null
}

export interface TransactionInput {
  type: TransactionType
  amount: number
  category: string
  comment: string
  transactionDate: Date
}

export interface TransactionFilters {
  dateFrom?: Date | null
  dateTo?: Date | null
  type?: TransactionType | 'all'
  category?: string
  search?: string
  amountMin?: number | null
  amountMax?: number | null
}

export type TransactionCursor = QueryDocumentSnapshot<DocumentData> | null

export interface TransactionPageResult {
  items: Transaction[]
  nextCursor: TransactionCursor
  hasMore: boolean
}

const transactionsCollection = (uid: string) => collection(db, 'users', uid, 'transactions')

const toDateOrNull = (value: unknown) => {
  if (value instanceof Timestamp) return value.toDate()
  return null
}

const mapTransaction = (item: QueryDocumentSnapshot<DocumentData>): Transaction => {
  const data = item.data() as {
    type?: TransactionType
    amount?: number
    amountCents?: number
    category?: string
    comment?: string
    transactionDate?: Timestamp
    createdAt?: Timestamp
  }

  return {
    tId: item.id,
    type: data.type ?? 'expense',
    amount: data.amount ?? data.amountCents ?? 0,
    category: data.category ?? '',
    comment: data.comment ?? '',
    transactionDate: data.transactionDate?.toDate() ?? new Date(),
    createdAt: toDateOrNull(data.createdAt),
  }
}

const endOfDay = (date: Date) => {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

const shouldApplyClientFilter = (transaction: Transaction, filters: TransactionFilters) => {
  if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
    return false
  }

  if (filters.category?.trim() && transaction.category !== filters.category.trim()) {
    return false
  }

  if (filters.dateFrom && transaction.transactionDate < filters.dateFrom) {
    return false
  }

  if (filters.dateTo && transaction.transactionDate > endOfDay(filters.dateTo)) {
    return false
  }

  const normalizedSearch = filters.search?.trim().toLocaleLowerCase('pl-PL')
  if (normalizedSearch) {
    const haystack = `${transaction.comment} ${transaction.category}`.toLocaleLowerCase('pl-PL')
    if (!haystack.includes(normalizedSearch)) return false
  }

  if (typeof filters.amountMin === 'number' && transaction.amount < filters.amountMin) {
    return false
  }

  if (typeof filters.amountMax === 'number' && transaction.amount > filters.amountMax) {
    return false
  }

  return true
}

const buildServerConstraints = (filters: TransactionFilters) => {
  const constraints: QueryConstraint[] = [orderBy('transactionDate', 'desc')]

  if (filters.type && filters.type !== 'all') {
    constraints.push(where('type', '==', filters.type))
  }

  if (filters.category?.trim()) {
    constraints.push(where('category', '==', filters.category.trim()))
  }

  if (filters.dateFrom) {
    constraints.push(where('transactionDate', '>=', filters.dateFrom))
  }

  if (filters.dateTo) {
    constraints.push(where('transactionDate', '<=', endOfDay(filters.dateTo)))
  }

  return constraints
}

export const subscribeToTransactions = (
  uid: string,
  onData: (transactions: Transaction[]) => void,
  onError: (error: Error) => void,
): Unsubscribe => {
  const q = query(transactionsCollection(uid), orderBy('transactionDate', 'desc'))

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions = snapshot.docs.map(mapTransaction)
      onData(transactions)
    },
    (error) => {
      onError(error)
    },
  )
}

export const fetchTransactionsPage = async (
  uid: string,
  {
    filters,
    cursor = null,
    pageSize = 25,
  }: {
    filters: TransactionFilters
    cursor?: TransactionCursor
    pageSize?: number
  },
): Promise<TransactionPageResult> => {
  const basePageSize = Math.max(pageSize, 25)
  const constraints = buildServerConstraints(filters)

  const runQuery = async (
    nextCursor: TransactionCursor,
    includeServerFilters: boolean,
  ) => {
    const activeConstraints = includeServerFilters ? [...constraints] : [orderBy('transactionDate', 'desc')]
    if (nextCursor) {
      activeConstraints.push(startAfter(nextCursor))
    }
    activeConstraints.push(limit(basePageSize))

    const snapshot = await getDocs(query(transactionsCollection(uid), ...activeConstraints))
    return snapshot
  }

  const collectPage = async (includeServerFilters: boolean) => {
    const items: Transaction[] = []
    let nextCursor = cursor
    let hasMore = true

    while (items.length < pageSize && hasMore) {
      const snapshot = await runQuery(nextCursor, includeServerFilters)
      const batch = snapshot.docs.map(mapTransaction).filter((transaction) =>
        shouldApplyClientFilter(transaction, filters),
      )

      items.push(...batch)
      hasMore = snapshot.docs.length === basePageSize
      nextCursor = snapshot.docs.at(-1) ?? null
    }

    return {
      items: items.slice(0, pageSize),
      nextCursor,
      hasMore,
    }
  }

  try {
    return await collectPage(true)
  } catch (error) {
    console.warn('Falling back to client-side transaction filters:', error)
    return collectPage(false)
  }
}

export const createTransaction = async (uid: string, payload: TransactionInput) => {
  await addDoc(transactionsCollection(uid), {
    ...payload,
    createdAt: serverTimestamp(),
  })
}

export const updateTransaction = async (uid: string, txId: string, payload: TransactionInput) => {
  await updateDoc(doc(db, 'users', uid, 'transactions', txId), { ...payload })
}

export const deleteTransaction = async (uid: string, txId: string) => {
  await deleteDoc(doc(db, 'users', uid, 'transactions', txId))
}
