import { mockDatabase, initMockDatabase } from './mockData';

// Usar dados mockados ao invés do banco SQLite
export const initDatabase = initMockDatabase;

export const database = mockDatabase;