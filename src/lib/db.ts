import { createClient } from '@libsql/client';

function getDb() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    // Local development fallback: use a local SQLite file
    return createClient({ url: 'file:local.db' });
  }
  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export const db = getDb();
