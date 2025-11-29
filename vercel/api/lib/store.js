/**
 * In-memory data store for serverless functions
 * Note: This is ephemeral storage - data resets on cold starts
 * For production, connect to a database like MongoDB, PostgreSQL, or Vercel KV
 */

// Default departments
const defaultDepartments = [
  { id: 'dept-1', name: 'Mathematics', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-2', name: 'Physics', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-3', name: 'Chemistry', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-4', name: 'Microbiology', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-5', name: 'History', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-6', name: 'English', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-7', name: 'ASM', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-8', name: 'BBA', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-9', name: 'BCOM', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-10', name: 'Computer Science', isActive: true, createdAt: new Date().toISOString() },
  { id: 'dept-11', name: 'Economics', isActive: true, createdAt: new Date().toISOString() },
];

// Default officer credentials
const defaultOfficer = {
  id: 'officer',
  name: 'Program Officer',
  password: 'officer123',
};

// In-memory store
export const store = {
  programs: [],
  students: [],
  coordinators: [],
  departments: [...defaultDepartments],
  studentReports: [],
  officers: [defaultOfficer],
  homepageImages: [],
};

// Helper functions for CRUD operations
export const generateId = (prefix = '') => {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const findById = (collection, id) => {
  return collection.find(item => item.id === id);
};

export const findIndex = (collection, id) => {
  return collection.findIndex(item => item.id === id);
};

export const removeById = (collection, id) => {
  const index = findIndex(collection, id);
  if (index !== -1) {
    return collection.splice(index, 1)[0];
  }
  return null;
};

export const updateById = (collection, id, updates) => {
  const index = findIndex(collection, id);
  if (index !== -1) {
    collection[index] = { ...collection[index], ...updates };
    return collection[index];
  }
  return null;
};
