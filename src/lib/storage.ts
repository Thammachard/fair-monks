import { Monk, Ceremony, CeremonyRequest } from './types';
import { MOCK_MONKS } from './mockData';

const MONKS_KEY = 'nimmon_monks';
const CEREMONIES_KEY = 'nimmon_ceremonies';
const REQUESTS_KEY = 'nimmon_requests';
const MONK_CHANTS_KEY = 'nimmon_monk_chants';

export function loadMonks(): Monk[] {
  const stored = localStorage.getItem(MONKS_KEY);
  if (stored) return JSON.parse(stored);
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

export function loadRequests(): CeremonyRequest[] {
  const stored = localStorage.getItem(REQUESTS_KEY);
  if (stored) return JSON.parse(stored);
  return [];
}

export function saveRequests(requests: CeremonyRequest[]) {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function loadMonkChants(monkId: string): string[] {
  const stored = localStorage.getItem(`${MONK_CHANTS_KEY}_${monkId}`);
  if (stored) return JSON.parse(stored);
  return [];
}

export function saveMonkChants(monkId: string, chantIds: string[]) {
  localStorage.setItem(`${MONK_CHANTS_KEY}_${monkId}`, JSON.stringify(chantIds));
}
