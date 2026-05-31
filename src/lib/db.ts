import { openDB } from 'idb';
import { PickSet } from '../types';

const DB_NAME = 'PickEmGenDB';
const STORE_NAME = 'PickSets';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function getAllPickSets(): Promise<PickSet[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function getPickSet(id: string): Promise<PickSet | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}

export async function savePickSet(pickSet: PickSet): Promise<void> {
  const db = await initDB();
  await db.put(STORE_NAME, pickSet);
}

export async function deletePickSet(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}
