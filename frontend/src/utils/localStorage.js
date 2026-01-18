export const STORAGE_KEYS = {
  USERS: 'service_app_users',
  COMPLAINTS: 'service_app_complaints',
  PAYMENTS: 'service_app_payments',
  FEEDBACKS: 'service_app_feedbacks',
  CURRENT_USER: 'service_app_current_user',
};

export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const initialUsers = [];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) {
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.FEEDBACKS)) {
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify([]));
  }
};

export const getFromStorage = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const saveToStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const addToStorage = (key, item) => {
  const items = getFromStorage(key) || [];
  const newItem = { ...item, id: Date.now().toString() };
  items.push(newItem);
  saveToStorage(key, items);
  return newItem;
};

export const updateInStorage = (key, id, updates) => {
  const items = getFromStorage(key) || [];
  const updatedItems = items.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  saveToStorage(key, updatedItems);
  return updatedItems.find((item) => item.id === id);
};

export const deleteFromStorage = (key, id) => {
  const items = getFromStorage(key) || [];
  const filteredItems = items.filter((item) => item.id !== id);
  saveToStorage(key, filteredItems);
};
