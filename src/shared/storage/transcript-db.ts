import { openDB, type IDBPDatabase } from 'idb'
import type { TranscriptEntry } from 'src/shared/types'

const DB_NAME = 'subtle-transcripts'
const DB_VERSION = 1
const STORE = 'transcripts'

let db: IDBPDatabase | null = null

async function getDb(): Promise<IDBPDatabase> {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        const store = database.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
      },
    })
  }
  return db
}

export async function saveTranscriptEntry(entry: TranscriptEntry): Promise<void> {
  const database = await getDb()
  await database.put(STORE, entry)
}

export async function getTranscriptsBySession(
  from: number,
  to: number,
): Promise<TranscriptEntry[]> {
  const database = await getDb()
  return database.getAllFromIndex(STORE, 'timestamp', IDBKeyRange.bound(from, to))
}
