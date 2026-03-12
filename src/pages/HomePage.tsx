import { useState, useEffect, useMemo } from 'react';
import { Ceremony, Monk } from '@/lib/types';
import { loadCeremonies, loadMonks } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon, MapPin, Phone, Users, Clock, ChevronRight, Info, Settings,
  BookOpen, UserCheck, BarChart3, FileText, Heart, Shield, Star
} from 'lucide-react';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const CONTACT_INFO = {
  name: 'พระมหาสมชาย (เจ้าหน้าที่กิจนิมนต์)',
  phone: '081-234-5678',
  line: '@temple-nimmon',
};

// Mock special dates for the temple calendar
const SPECIAL_DATES = [
  { date: '2026-03-15', label: 'วันมาฆบูชา', type: 'buddhist' as const },
  { date: '2026-03-22', label: 'วันพระ', type: 'wan-phra' as const },
  { date: '2026-03-29', label: 'วันพระ', type: 'wan-phra' as const },
  { date: '2026-04-05', label: 'งานเททองหล่อพระ', type: 'event' as const },
  { date: '2026-04-13', label: 'วันสงกรานต์', type: 'buddhist' as const },
  { date: '2026-04-19', label: 'วันพระ', type: 'wan-phra' as const },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [monks, setMonks] = useState<Monk[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonkId, setSelectedMonkId] = useState<string>('');
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    setCeremonies(loadCeremonies());
    setMonks(loadMonks());
  }, []);

  const confirmedCeremonies = ceremonies.filter(c => c.status === 'confirmed' || c.status === 'pending');

  const ceremoniesOnDate = confirmedCeremonies.filter(c => {
    try { return isSameDay(parseISO(c.date), selectedDate); } catch { return false; }
  });

  const ceremonyDates = confirmedCeremonies.map(c => {
    try { return parseISO(c.date); } catch { return null; }
  }).filter(Boolean) as Date[];

  const specialDatesThisMonth = SPECIAL_DATES.filter(s => {
    try {
      const d = parseISO(s.date);
      return isWithinInterval(d, { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });
    } catch { return false; }
  });

  const selectedMonk = monks.find(m => m.id === selectedMonkId);

  const monkAssignments = useMemo(() => {
    if (!selectedMonk) return [];
    return confirmedCeremonies.filter(c =>
      c.assignments?.some(a => a.monk.id === selectedMonk.id)
    ).slice(0, 5);
  }, [selectedMonk, confirmedCeremonies]);

  const thisMonthCount = useMemo(() => {
    if (!selectedMonk) return 0;
    const now = new Date();
    return confirmedCeremonies.filter(c => {
      try {
        const d = parseISO(c.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          && c.assignments?.some(a => a.monk.id === selectedMonk.id);
      } catch { return false; }
    }).length;
  }, [selectedMonk, confirmedCeremonies]);

  const getTypeStyle = (type: string, location?: string) => {
    if (type === 'อวมงคล') return { bg: 'bg-muted', text: 'text-muted-foreground', dot: '⬜' };
    if (location === 'ในวัด') return { bg: 'bg-secondary/10', text: 'text-secondary-foreground', dot: '🟡' };
    return { bg: 'bg-success/10', text: 'text-success', dot: '🟢' };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="gradient-maroon px-4 py-8 shadow-lg">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary shadow-gold">
              <span className="text-3xl">🛕</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">
            ระบบนิมนต์พระ-สามเณร ประจำวัด
          </h1>
          <p className="text-sm text-primary-foreground/70 mt-1">
            Temple Monk Invitation Portal
          </p>
        </div>
      </header>

      {/* Quick Nav */}
      <div className="container mx-auto max-w-4xl px-4 -mt-4 relative z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button variant="gold" size="sm" className="gap-1 shrink-0">
            <CalendarIcon className="h-4 w-4" /> หน้าหลัก
          </Button>
          <Button variant="outline" size="sm" className="gap-1 shrink-0 bg-card" onClick={() => navigate('/admin')}>
            <Settings className="h-4 w-4" /> Admin
          </Button>
          <Button variant="outline" size="sm" className="gap-1 shrink-0 bg-card" onClick={() => navigate('/queue')}>
            <Users className="h-4 w-4" /> ดูคิว
          </Button>
          <Button variant="outline" size="sm" className="gap-1 shrink-0 bg-card" onClick={() => navigate('/history')}>
            <Clock className="h-4 w-4" /> ประวัติ
          </Button>
        </div>
      </div>

      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-8">

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 1: สำหรับญาติโยม (Laypeople Section)      */}
        {/* ═══════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-foreground">สำหรับญาติโยม</h2>
          </div>

          {/* CTA Card */}
          <Card className="shadow-card border-gold-subtle overflow-hidden">
            <div className="gradient-gold p-6 text-center">
              <span className="text-4xl mb-3 block">🙏</span>
              <h3 className="text-xl font-bold text-secondary-foreground mb-1">
                ต้องการนิมนต์พระ?
              </h3>
              <p className="text-sm text-secondary-foreground/80 mb-4">
                กรอกแบบฟอร์มนิมนต์พระ เพื่อจองคิวงานบุญของท่าน
              </p>
              <Button
                variant="maroon"
                size="lg"
                className="gap-2 text-base px-8 shadow-lg"
                onClick={() => navigate('/request')}
              >
                <FileText className="h-5 w-5" />
                กรอกแบบฟอร์มนิมนต์พระ
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Guide Accordion */}
          <Card className="shadow-card mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" />
                ข้อควรรู้ / คู่มือการจัดเตรียม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="mangkol">
                  <AccordionTrigger className="text-sm">
                    🟢 งานมงคล — ต้องเตรียมอะไรบ้าง?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p><strong>ประเภทงาน:</strong> ทำบุญบ้าน, ขึ้นบ้านใหม่, มงคลสมรส, งานบวช</p>
                    <p><strong>สิ่งที่ต้องเตรียม:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>โต๊ะหมู่บูชา พร้อมพระพุทธรูป</li>
                      <li>ดอกไม้ ธูป เทียน</li>
                      <li>น้ำมนต์ (ขันสาคร)</li>
                      <li>สายสิญจน์</li>
                      <li>ภัตตาหาร / สังฆทาน</li>
                    </ul>
                    <p className="text-secondary text-xs mt-2">
                      💡 หากไม่มี สามารถให้ทางวัดจัดเตรียมให้ได้ (มีค่าใช้จ่ายเพิ่มเติม)
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="avamangkol">
                  <AccordionTrigger className="text-sm">
                    ⬜ งานอวมงคล — ต้องเตรียมอะไรบ้าง?
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p><strong>ประเภทงาน:</strong> งานศพ, งานทำบุญ 7 วัน / 50 วัน / 100 วัน</p>
                    <p><strong>สิ่งที่ต้องเตรียม:</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>โต๊ะหมู่บูชา พร้อมรูปผู้ล่วงลับ</li>
                      <li>ดอกไม้จันทน์ ธูป เทียน</li>
                      <li>สังฆทาน / ชุดไทยธรรม</li>
                      <li>ภัตตาหาร</li>
                    </ul>
                    <p className="text-secondary text-xs mt-2">
                      💡 ทางวัดมีบริการจัดเตรียมชุดไทยธรรม กรุณาแจ้งในแบบฟอร์ม
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="inwat">
                  <AccordionTrigger className="text-sm">
                    🟡 งานในวัด — กำหนดการ
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground space-y-2">
                    <p>ทำบุญประจำวัน, งานพิธีในพระอุโบสถ, งานบุญเทศกาล</p>
                    <p><strong>เวลาที่แนะนำ:</strong> 07:00 - 09:00 น. หรือ 10:00 - 11:00 น.</p>
                    <p>ทางวัดจัดเตรียมสถานที่ให้เรียบร้อย เจ้าภาพเตรียมเฉพาะสิ่งของถวาย</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="shadow-card mt-4 border-gold-subtle">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-5 w-5 text-secondary" />
                ช่องทางติดต่อวัด
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20">
                  <UserCheck className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{CONTACT_INFO.name}</p>
                  <a href={`tel:${CONTACT_INFO.phone}`} className="text-sm text-secondary flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {CONTACT_INFO.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                  <span className="text-lg">💬</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">LINE Official</p>
                  <p className="text-sm text-muted-foreground">เพิ่มเพื่อน {CONTACT_INFO.line}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">แผนที่วัด</p>
                  <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer"
                    className="text-sm text-secondary underline">
                    เปิดใน Google Maps
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-2" />

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 2: สำหรับพระภิกษุ-สามเณร                   */}
        {/* ═══════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-foreground">สำหรับพระภิกษุ-สามเณร</h2>
          </div>

          <Card className="shadow-card border-gold-subtle">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                📿 เข้าดูคิวงานและสถิติส่วนตัว
              </CardTitle>
              <CardDescription>เลือกชื่อ/ฉายาของท่าน เพื่อดูตารางงานกิจนิมนต์</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Select value={selectedMonkId} onValueChange={setSelectedMonkId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="เลือกชื่อ / ฉายา" />
                  </SelectTrigger>
                  <SelectContent>
                    {monks.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.rank})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="gold"
                  disabled={!selectedMonkId}
                  onClick={() => setShowDashboard(true)}
                  className="gap-1 shrink-0"
                >
                  <BarChart3 className="h-4 w-4" />
                  ดูคิวงาน
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1 flex-1" onClick={() => navigate('/monk')}>
                  📿 จัดการบทสวด
                </Button>
                <Button variant="outline" size="sm" className="gap-1 flex-1" onClick={() => navigate('/building-head')}>
                  🏛️ หัวหน้าตึก
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Monk Dashboard Dialog */}
        <Dialog open={showDashboard} onOpenChange={setShowDashboard}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-secondary" />
                แดชบอร์ด: {selectedMonk?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedMonk && (
              <div className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-secondary/10 p-3 text-center">
                    <p className="text-2xl font-bold text-secondary">{selectedMonk.totalAssignments}</p>
                    <p className="text-xs text-muted-foreground">งานทั้งหมด</p>
                  </div>
                  <div className="rounded-lg bg-success/10 p-3 text-center">
                    <p className="text-2xl font-bold text-success">{thisMonthCount}</p>
                    <p className="text-xs text-muted-foreground">เดือนนี้</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{selectedMonk.queueScore}</p>
                    <p className="text-xs text-muted-foreground">ลำดับคิว</p>
                  </div>
                </div>

                {/* Info badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">ชั้น: {selectedMonk.rank}</Badge>
                  <Badge variant="outline">พรรษา: {selectedMonk.yearsOrdained}</Badge>
                  <Badge variant="outline">{selectedMonk.building}</Badge>
                  <Badge variant="outline">ความสามารถ: {selectedMonk.ability}</Badge>
                  {selectedMonk.canLead && <Badge variant="default">หัวนำสวดได้</Badge>}
                  {selectedMonk.isFrozen && <Badge variant="destructive">ถูกระงับ</Badge>}
                </div>

                <Separator />

                {/* Assignments Table */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" /> ตารางงานกิจนิมนต์
                  </h4>
                  {monkAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">ยังไม่มีงานที่ได้รับมอบหมาย</p>
                  ) : (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">วันที่</TableHead>
                            <TableHead className="text-xs">เวลา</TableHead>
                            <TableHead className="text-xs">ประเภท</TableHead>
                            <TableHead className="text-xs">สถานที่</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monkAssignments.map(c => (
                            <TableRow key={c.id}>
                              <TableCell className="text-xs">
                                {(() => { try { return format(parseISO(c.date), 'd MMM', { locale: th }); } catch { return c.date; } })()}
                              </TableCell>
                              <TableCell className="text-xs">{c.time || '-'}</TableCell>
                              <TableCell className="text-xs">
                                <Badge variant={c.type === 'มงคล' ? 'success' : 'secondary'} className="text-xs">
                                  {c.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs truncate max-w-[100px]">{c.location || c.ceremonyLocation || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Separator className="my-2" />

        {/* ═══════════════════════════════════════════════════ */}
        {/* SECTION 3: ปฏิทินกิจกรรมวัด (Public Calendar)      */}
        {/* ═══════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-foreground">ปฏิทินกิจกรรมวัด</h2>
          </div>

          <Card className="shadow-card border-gold-subtle">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-secondary" />
                ปฏิทินงานบุญ — {format(selectedDate, 'MMMM yyyy', { locale: th })}
              </CardTitle>
              <div className="flex flex-wrap gap-3 text-xs mt-2">
                <span className="flex items-center gap-1">🟡 งานในวัด</span>
                <span className="flex items-center gap-1">🟢 งานมงคลนอกวัด</span>
                <span className="flex items-center gap-1">⬜ งานอวมงคล</span>
                <span className="flex items-center gap-1">🔴 วันพระ/วันสำคัญ</span>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                className={cn("p-3 pointer-events-auto mx-auto")}
                modifiers={{ ceremony: ceremonyDates }}
                modifiersStyles={{
                  ceremony: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    textDecorationColor: 'hsl(43, 74%, 49%)',
                  },
                }}
              />

              {/* Events on selected date */}
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">
                  📅 {format(selectedDate, 'PPP', { locale: th })}
                </p>

                {/* Special dates */}
                {SPECIAL_DATES.filter(s => {
                  try { return isSameDay(parseISO(s.date), selectedDate); } catch { return false; }
                }).map((s, i) => (
                  <div key={i} className="rounded-lg p-3 bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-semibold text-destructive">🔴 {s.label}</p>
                  </div>
                ))}

                {ceremoniesOnDate.length === 0 && (
                  <p className="text-sm text-muted-foreground">ไม่มีงานนิมนต์ในวันนี้</p>
                )}

                {ceremoniesOnDate.map(c => {
                  const style = getTypeStyle(c.type, c.ceremonyLocation);
                  return (
                    <div key={c.id} className={`rounded-lg p-3 ${style.bg} border`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold text-sm ${style.text}`}>
                            {style.dot} {c.type} — {c.monkCount} รูป
                            {c.ceremonyLocation && ` (${c.ceremonyLocation})`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {c.time || '-'} · {c.requesterName} · {c.description}
                          </p>
                          {c.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" /> {c.location}
                            </p>
                          )}
                        </div>
                        <Badge variant={c.status === 'confirmed' ? 'success' : 'warning'}>
                          {c.status === 'confirmed' ? 'ยืนยัน' : 'รอ'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Special dates list for this month */}
              {specialDatesThisMonth.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs font-semibold mb-2">📌 วันสำคัญในเดือนนี้:</p>
                  <div className="space-y-1">
                    {specialDatesThisMonth.map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        • {(() => { try { return format(parseISO(s.date), 'd MMM', { locale: th }); } catch { return s.date; } })()} — {s.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notice */}
          <Card className="bg-secondary/10 border-secondary/30 mt-4">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-secondary mt-0.5 shrink-0" />
                <p className="text-sm">
                  <strong>หมายเหตุ:</strong> ปฏิทินนี้แสดงงานเบื้องต้น หากต้องการนิมนต์ในวันที่มีงานแล้ว กรุณาสอบถามเจ้าหน้าที่ เพราะทางวัดอาจจัดสรรคณะสงฆ์เพิ่มเติมให้ท่านได้
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-muted-foreground">
          <p>ระบบบริหารจัดการกิจนิมนต์ © {new Date().getFullYear()}</p>
        </footer>
      </main>
    </div>
  );
}
