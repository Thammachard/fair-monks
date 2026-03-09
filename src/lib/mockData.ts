import { Monk } from './types';

const buildings = ['ตึก ก', 'ตึก ข', 'ตึก ค', 'ตึก ง'];

function createMonk(
  id: number, name: string, rank: Monk['rank'],
  years: number, building: string, ability: Monk['ability'],
  canLead: boolean, queueScore: number
): Monk {
  return {
    id: `m${id}`,
    name,
    rank,
    yearsOrdained: years,
    building,
    ability,
    canLead,
    queueScore,
    isFrozen: false,
    totalAssignments: Math.floor(Math.random() * 20),
  };
}

export const MOCK_MONKS: Monk[] = [
  // มหาเถระ (19 รูป)
  createMonk(1, 'พระมหาสมชาย', 'มหาเถระ', 35, buildings[0], 'ทั้งสอง', true, 1),
  createMonk(2, 'พระมหาธรรมรัตน์', 'มหาเถระ', 33, buildings[0], 'ทั้งสอง', true, 2),
  createMonk(3, 'พระมหาวิชัย', 'มหาเถระ', 31, buildings[0], 'มงคล', true, 3),
  createMonk(4, 'พระมหาประเสริฐ', 'มหาเถระ', 30, buildings[1], 'ทั้งสอง', true, 4),
  createMonk(5, 'พระมหาสุวรรณ', 'มหาเถระ', 28, buildings[1], 'ทั้งสอง', true, 5),
  createMonk(6, 'พระมหาอนันต์', 'มหาเถระ', 27, buildings[1], 'อวมงคล', false, 6),
  createMonk(7, 'พระมหาบุญเลิศ', 'มหาเถระ', 26, buildings[2], 'ทั้งสอง', true, 7),
  createMonk(8, 'พระมหาศักดิ์', 'มหาเถระ', 25, buildings[2], 'มงคล', false, 8),
  createMonk(9, 'พระมหาพิชัย', 'มหาเถระ', 24, buildings[2], 'ทั้งสอง', false, 9),
  createMonk(10, 'พระมหาวิเชียร', 'มหาเถระ', 23, buildings[3], 'ทั้งสอง', true, 10),
  createMonk(11, 'พระมหาสุเทพ', 'มหาเถระ', 22, buildings[3], 'มงคล', false, 11),
  createMonk(12, 'พระมหาปัญญา', 'มหาเถระ', 22, buildings[0], 'ทั้งสอง', false, 12),
  createMonk(13, 'พระมหาจำลอง', 'มหาเถระ', 21, buildings[1], 'อวมงคล', false, 13),
  createMonk(14, 'พระมหาสมบูรณ์', 'มหาเถระ', 21, buildings[2], 'ทั้งสอง', false, 14),
  createMonk(15, 'พระมหาเกรียงไกร', 'มหาเถระ', 20, buildings[3], 'มงคล', false, 15),
  createMonk(16, 'พระมหาณรงค์', 'มหาเถระ', 20, buildings[0], 'ทั้งสอง', false, 16),
  createMonk(17, 'พระมหาอดิศร', 'มหาเถระ', 19, buildings[1], 'ทั้งสอง', false, 17),
  createMonk(18, 'พระมหาชัยวัฒน์', 'มหาเถระ', 19, buildings[2], 'มงคล', false, 18),
  createMonk(19, 'พระมหาวรพล', 'มหาเถระ', 18, buildings[3], 'ทั้งสอง', false, 19),
  // เถระ (7 รูป)
  createMonk(20, 'พระครูวินัยธร', 'เถระ', 15, buildings[0], 'ทั้งสอง', true, 20),
  createMonk(21, 'พระครูสมุห์', 'เถระ', 14, buildings[1], 'ทั้งสอง', true, 21),
  createMonk(22, 'พระครูใบฎีกา', 'เถระ', 13, buildings[2], 'มงคล', false, 22),
  createMonk(23, 'พระปลัดสุรชัย', 'เถระ', 12, buildings[3], 'ทั้งสอง', false, 23),
  createMonk(24, 'พระอธิการวิโรจน์', 'เถระ', 11, buildings[0], 'อวมงคล', false, 24),
  createMonk(25, 'พระสมุห์ธนพล', 'เถระ', 10, buildings[1], 'ทั้งสอง', false, 25),
  createMonk(26, 'พระใบฎีกาสุริยะ', 'เถระ', 10, buildings[2], 'ทั้งสอง', false, 26),
  // มัชฌิมะ (2 รูป)
  createMonk(27, 'พระณัฐพล', 'มัชฌิมะ', 7, buildings[0], 'ทั้งสอง', false, 27),
  createMonk(28, 'พระกิตติศักดิ์', 'มัชฌิมะ', 6, buildings[1], 'มงคล', false, 28),
  // นวกะ (4 รูป)
  createMonk(29, 'พระนวกะสมศักดิ์', 'นวกะ', 2, buildings[2], 'มงคล', false, 29),
  createMonk(30, 'พระนวกะธีรพงศ์', 'นวกะ', 1, buildings[3], 'ทั้งสอง', false, 30),
  createMonk(31, 'พระนวกะอภิชาต', 'นวกะ', 1, buildings[0], 'ทั้งสอง', false, 31),
  createMonk(32, 'พระนวกะวรเมธ', 'นวกะ', 1, buildings[1], 'มงคล', false, 32),
];
