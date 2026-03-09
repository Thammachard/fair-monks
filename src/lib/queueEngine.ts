import { Monk, MonkRank, CeremonyType, Assignment, QuotaConfig, QUOTA_CONFIGS, RANK_ORDER } from './types';

/**
 * Smart Queue Rotation Engine
 * - Selects monks based on fairness queue (lowest queueScore first)
 * - Respects rank quotas per ceremony size
 * - Cross-rank substitution when a rank has insufficient available monks
 * - Filters by ceremony type ability
 */

function filterByAbility(monks: Monk[], type: CeremonyType): Monk[] {
  return monks.filter(m =>
    m.ability === 'ทั้งสอง' || m.ability === type
  );
}

function getAvailable(monks: Monk[]): Monk[] {
  return monks.filter(m => !m.isFrozen);
}

function sortByQueue(monks: Monk[]): Monk[] {
  return [...monks].sort((a, b) => a.queueScore - b.queueScore);
}

function pickFromRank(
  available: Monk[],
  rank: MonkRank,
  count: number,
  alreadyPicked: Set<string>
): Monk[] {
  const candidates = sortByQueue(
    available.filter(m => m.rank === rank && !alreadyPicked.has(m.id))
  );
  return candidates.slice(0, count);
}

/**
 * Cross-rank substitution: when a rank doesn't have enough monks,
 * pull from higher ranks (มหาเถระ/เถระ) to fill the gap
 */
function crossRankSubstitute(
  available: Monk[],
  needed: number,
  alreadyPicked: Set<string>
): Monk[] {
  const substitutionOrder: MonkRank[] = ['มหาเถระ', 'เถระ', 'มัชฌิมะ', 'นวกะ'];
  const subs: Monk[] = [];
  
  for (const rank of substitutionOrder) {
    if (subs.length >= needed) break;
    const candidates = sortByQueue(
      available.filter(m => m.rank === rank && !alreadyPicked.has(m.id))
    );
    for (const c of candidates) {
      if (subs.length >= needed) break;
      subs.push(c);
    }
  }
  
  return subs.slice(0, needed);
}

export function generateAssignments(
  allMonks: Monk[],
  ceremonyType: CeremonyType,
  monkCount: number
): Assignment[] {
  const quota = QUOTA_CONFIGS[monkCount];
  if (!quota) throw new Error(`ไม่รองรับจำนวนพระ ${monkCount} รูป`);

  const eligible = getAvailable(filterByAbility(allMonks, ceremonyType));
  const picked = new Set<string>();
  const assignments: Assignment[] = [];

  // 1. Pick lead chanter (หัวนำสวด) - must be canLead, prefer highest rank
  const leadCandidates = sortByQueue(
    eligible.filter(m => m.canLead)
  );
  
  if (leadCandidates.length > 0) {
    const lead = leadCandidates[0];
    picked.add(lead.id);
    assignments.push({
      monk: lead,
      role: 'หัวนำสวด',
      status: 'draft',
    });
  }

  // 2. Fill quota per rank
  for (const rank of RANK_ORDER) {
    // Subtract 1 from the rank if lead was picked from this rank
    const leadFromThisRank = assignments.length > 0 && assignments[0].monk.rank === rank ? 1 : 0;
    const needed = Math.max(0, quota[rank] - leadFromThisRank);
    
    const selected = pickFromRank(eligible, rank, needed, picked);
    const deficit = needed - selected.length;

    for (const monk of selected) {
      picked.add(monk.id);
      assignments.push({
        monk,
        role: 'ผู้สวด',
        status: 'draft',
      });
    }

    // Cross-rank substitution for deficit
    if (deficit > 0) {
      const subs = crossRankSubstitute(eligible, deficit, picked);
      for (const monk of subs) {
        picked.add(monk.id);
        assignments.push({
          monk,
          role: 'ผู้สวด',
          status: 'draft',
        });
      }
    }
  }

  // Trim to exact count if over
  return assignments.slice(0, monkCount);
}

/**
 * Process approval/rejection and update queue scores
 */
export function processApproval(
  monks: Monk[],
  monkId: string,
  action: 'approve' | 'sick' | 'skip'
): Monk[] {
  return monks.map(m => {
    if (m.id !== monkId) return m;
    
    switch (action) {
      case 'approve':
        // Move to end of queue
        return {
          ...m,
          queueScore: Math.max(...monks.map(x => x.queueScore)) + 1,
          totalAssignments: m.totalAssignments + 1,
          isFrozen: false,
        };
      case 'sick':
        // Freeze at head of queue (keep current score)
        return { ...m, isFrozen: true };
      case 'skip':
        // Penalty: move to end of queue
        return {
          ...m,
          queueScore: Math.max(...monks.map(x => x.queueScore)) + 1,
          isFrozen: false,
        };
      default:
        return m;
    }
  });
}

/**
 * Find a substitute for a rejected monk
 */
export function findSubstitute(
  allMonks: Monk[],
  ceremonyType: CeremonyType,
  excludeIds: Set<string>,
  preferredRank?: MonkRank
): Monk | null {
  const eligible = getAvailable(filterByAbility(allMonks, ceremonyType))
    .filter(m => !excludeIds.has(m.id));
  
  // Try preferred rank first
  if (preferredRank) {
    const ranked = sortByQueue(eligible.filter(m => m.rank === preferredRank));
    if (ranked.length > 0) return ranked[0];
  }
  
  // Cross-rank fallback
  const sorted = sortByQueue(eligible);
  return sorted.length > 0 ? sorted[0] : null;
}
