import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Unsubscribe,
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

const transactionsCollection = (uid: string) => collection(db, 'users', uid, 'transactions')

const toDateOrNull = (value: unknown) => {
  if (value instanceof Timestamp) return value.toDate()
  return null
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
      const transactions = snapshot.docs.map((item) => {
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
      })
      onData(transactions)
    },
    (error) => {
      onError(error)
    },
  )
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
