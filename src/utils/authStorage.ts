// IndexedDB utility for persistent authentication storage

const DB_NAME = 'nss-auth-db';
const DB_VERSION = 1;
const STORE_NAME = 'auth';

interface AuthSession {
  id: string;
  userType: 'student' | 'coordinator' | 'officer';
  userData: unknown;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveAuthSession = async (
  userType: 'student' | 'coordinator' | 'officer',
  userData: unknown
): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const session: AuthSession = {
      id: 'current-session',
      userType,
      userData,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.put(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save auth session'));
    });
  } catch (error) {
    console.error('Failed to save auth session:', error);
  }
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get('current-session');
      request.onsuccess = () => {
        const session = request.result as AuthSession | undefined;
        if (session) {
          // Check if session is still valid (7 days)
          const sevenDays = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - session.timestamp < sevenDays) {
            resolve(session);
          } else {
            // Session expired, clear it
            void clearAuthSession();
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error('Failed to get auth session'));
    });
  } catch (error) {
    console.error('Failed to get auth session:', error);
    return null;
  }
};

export const clearAuthSession = async (): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete('current-session');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear auth session'));
    });
  } catch (error) {
    console.error('Failed to clear auth session:', error);
  }
};
