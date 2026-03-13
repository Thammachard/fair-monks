import { LeadChanterCriteria } from './chantingData';

export type MonkRank = 'มหาเถระ' | 'เถระ' | 'มัชฌิมะ' | 'นวกะ';

export type CeremonyType = 'มงคล' | 'อวมงคล';

export type MonkAbility = 'มงคล' | 'อวมงคล' | 'ทั้งสอง';

export type AssignmentStatus = 'draft' | 'pending' | 'approved' | 'rejected_sick' | 'rejected_skip' | 'substituted';

export type CeremonyLocation = 'ในวัด' | 'นอกวัด';

export interface AssignmentHistoryEntry {
  ceremonyId: string;
  ceremonyName: string;
  date: string;
  status: 'attended' | 'rejected' | 'substituted';
  role?: 'หัวนำสวด' | 'ผู้สวด';
}

export interface Monk {
  id: string;
  name: string;
  rank: MonkRank;
  yearsOrdained: number;
  building: string;
  ability: MonkAbility;
  canLead: boolean;
  queueScore: number;
  isFrozen: boolean;
  totalAssignments: number;
  chantIds?: string[];              // บทสวดที่สวดได้
  activityScore?: number;           // คะแนนกิจ 1-5
  leadCriteria?: LeadChanterCriteria; // เกณฑ์หัวนำสวด
  assignmentHistory?: AssignmentHistoryEntry[]; // ประวัติการรับงาน
}

export interface QuotaConfig {
  total: number;
  lead: number;
  มหาเถระ: number;
  เถระ: number;
  มัชฌิมะ: number;
  นวกะ: number;
}

export interface Assignment {
  monk: Monk;
  role: 'หัวนำสวด' | 'ผู้สวด';
  status: AssignmentStatus;
  rejectReason?: string;
  substitute?: Monk;
  sermonTopic?: string;  // บทเทศน์ (สำหรับหัวนำสวด)
}

export type TransportOption = 'เจ้าภาพรับ-ส่ง' | 'วัดเดินทางเอง';
export type MealOption = 'ไม่มี' | 'มื้อเช้า' | 'มื้อเพล';
export type DiningStyle = 'ฉันวง' | 'ฉันโตก';

export interface CeremonyRequest {
  id: string;
  // ส่วนที่ 1: ข้อมูลเจ้าภาพ
  requesterName: string;
  phoneNumber: string;
  lineId?: string;
  // ส่วนที่ 2: รายละเอียดกิจนิมนต์
  ceremonyType: CeremonyType;
  ceremonyTitle?: string;          // ชื่องานพิธี
  date: string;
  time: string;
  monkCount: number;
  specifiedMonkNames?: string;     // ระบุชื่อพระที่เจาะจง
  // ส่วนที่ 3: สถานที่และการเดินทาง
  ceremonyLocation: CeremonyLocation;
  location: string;
  locationUrl?: string;
  transportOption: TransportOption;
  pickupTime?: string;             // เวลานัดหมายรับพระ
  // ส่วนที่ 4: การรับรองและภัตตาหาร
  mealOption: MealOption;
  diningStyle?: DiningStyle;
  additionalDetails?: string;
  // ระบบเดิม
  description: string;
  needTemplePreparation: boolean;
  templePreparationDetails?: string;
  selectedChantIds?: string[];
  specifiedMonkIds?: string[];
  status: 'waiting' | 'approved' | 'rejected';
  createdAt: string;
  suggestedItems?: string;
  suggestedTime?: string;
}

export interface Ceremony {
  id: string;
  date: string;
  time?: string;
  type: CeremonyType;
  monkCount: number;
  requesterName: string;
  description: string;
  assignments: Assignment[];
  status: 'draft' | 'pending' | 'confirmed';
  createdAt: string;
  location?: string;
  locationUrl?: string;
  ceremonyLocation?: CeremonyLocation;
  selectedChantIds?: string[];
  suggestedItems?: string;
  suggestedTime?: string;
  needTemplePreparation?: boolean;
  templePreparationDetails?: string;
  requestId?: string;
}

// Quota configs for different ceremony sizes
export const QUOTA_CONFIGS: Record<number, QuotaConfig> = {
  3: { total: 3, lead: 1, มหาเถระ: 1, เถระ: 1, มัชฌิมะ: 1, นวกะ: 0 },
  4: { total: 4, lead: 1, มหาเถระ: 1, เถระ: 1, มัชฌิมะ: 1, นวกะ: 1 },
  5: { total: 5, lead: 1, มหาเถระ: 2, เถระ: 1, มัชฌิมะ: 1, นวกะ: 1 },
  7: { total: 7, lead: 1, มหาเถระ: 2, เถระ: 2, มัชฌิมะ: 2, นวกะ: 1 },
  9: { total: 9, lead: 1, มหาเถระ: 3, เถระ: 2, มัชฌิมะ: 2, นวกะ: 2 },
  10: { total: 10, lead: 1, มหาเถระ: 3, เถระ: 3, มัชฌิมะ: 2, นวกะ: 2 },
};

export const RANK_ORDER: MonkRank[] = ['มหาเถระ', 'เถระ', 'มัชฌิมะ', 'นวกะ'];

export const RANK_COLORS: Record<MonkRank, string> = {
  'มหาเถระ': 'bg-primary text-primary-foreground',
  'เถระ': 'bg-secondary text-secondary-foreground',
  'มัชฌิมะ': 'bg-gold-dark text-cream',
  'นวกะ': 'bg-muted text-foreground',
};

// Rejection reasons dropdown
export const REJECTION_REASONS = [
  'อาพาธ',
  'ติดสอบบาลี',
  'ติดสอบนักธรรม',
  'ติดธุระส่วนตัว',
  'เดินทางไม่ได้',
  'สละสิทธิ์',
  'อื่นๆ',
];
