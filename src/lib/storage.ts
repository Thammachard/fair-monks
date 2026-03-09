import { Monk, Ceremony } from './types';
import { MOCK_MONKS } from './mockData';

const MONKS_KEY = 'nimmon_monks';
const CEREMONIES_KEY = 'nimmon_ceremonies';

export function loadMonks(): Monk[] {
  const stored = localStorage.getItem(MONKS_KEY);
  if (stored) return JSON.parse(stored);
  // Initialize with mock data
  localStorage.setItem(MONKS_KEY, JSON.stringify(MOCK_MONKS));
  return [...MOCK_MONKS];
}

export function saveMonks(monks: Monk[]) {
  localStorage.setItem(MONKS_KEY, JSON.stringify(monks));
}

export function loadCeremonies(): Ceremony[] {
  const stored = localStorage.getItem(CEREMONIES_KEY);
  if (stored) return JSON.parse(stored);
  return [];
}

export function saveCeremonies(ceremonies: Ceremony[]) {
  localStorage.setItem(CEREMONIES_KEY, JSON.stringify(ceremonies));
}
