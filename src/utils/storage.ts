import { RecordingItem } from '../types/recorder';

const DB_NAME = 'kbt_recorder_db';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export async function saveRecordingToDB(item: RecordingItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Don't store temporary blobUrl string in IndexedDB, only raw blob
    const { blobUrl, ...storableItem } = item;
    const req = store.put(storableItem);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllRecordingsFromDB(): Promise<RecordingItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const items: RecordingItem[] = (req.result || []).map((rec: any) => {
        if (rec.blob) {
          rec.blobUrl = URL.createObjectURL(rec.blob);
        }
        return rec;
      });
      // Sort newest first
      items.sort((a, b) => b.timestamp - a.timestamp);
      resolve(items);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecordingFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteMultipleRecordingsFromDB(ids: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const id of ids) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateRecordingInDB(item: RecordingItem): Promise<void> {
  return saveRecordingToDB(item);
}

export async function updateMultipleRecordingsInDB(items: RecordingItem[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const item of items) {
      const { blobUrl, ...storableItem } = item;
      store.put(storableItem);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
