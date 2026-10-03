/*
   MoneyMap — storage.js
   */

const STORAGE_PREFIX = 'moneymap_';

/*
 Read a collection (array of objects) from LocalStorage.
 */
function readCollection(key) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error(`MoneyMap: failed to read "${key}" from storage`, err);
    return [];
  }
}

/*
 Overwrite a collection in LocalStorage.
 */
function writeCollection(key, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error(`MoneyMap: failed to write "${key}" to storage`, err);
    return false;
  }
}

/*
 Generate a short, unique id for a new record.
 e.g. "acc_l3f9k2a1"
 */
function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/*
 Wipe every MoneyMap key from LocalStorage (used by Settings > Reset data).
*/
function resetAllData() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
