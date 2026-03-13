import { useState, useEffect, useMemo, useRef } from 'react';
import { Ceremony, Monk } from '@/lib/types';
import { loadCeremonies, loadMonks } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon, MapPin, Phone, Users, Clock, ChevronRight, Info, Settings,
  BookOpen, UserCheck, BarChart3, FileText, Heart, Shield, Star, ChevronDown
} from 'lucide-react';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const CONTACT_INFO = {
  name: 'พระมหาสมชาย (เจ้าหน้าที่กิจนิมนต์)',
  phone: '081-234-5678',
  line: '@temple-nimmon',
  address: 'วัดตัวอย่าง ต.ตัวอย่าง อ.เมือง จ.ตัวอย่าง 10000',
};

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

  const laypeopleRef = useRef<HTMLElement>(null);
  const monkRef = useRef<HTMLElement>(null);

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

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: HERO                                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 gradient-maroon" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(43_74%_49%/0.15),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 container mx-auto max-w-4xl px-4 pt-10 pb-16 text-center">
          {/* Temple icon */}
          <div className="flex justify-center mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/90 shadow-gold ring-4 ring-secondary/30">
              <span className="text-4xl">🛕</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-foreground tracking-tight leading-snug">
            ระบบบริหารกิจนิมนต์<br className="sm:hidden" />และตารางงานวัด
          </h1>
          <p className="text-sm text-primary-foreground/60 mt-2 max-w-md mx-auto">
            Temple Monk Invitation &amp; Scheduling Portal
          </p>

          {/* Dual CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button
              variant="gold"
              size="lg"
              className="gap-2 text-base px-8 shadow-lg"
              onClick={() => scrollTo(laypeopleRef)}
            >
              🙏 ขอนิมนต์พระ
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 text-base px-8 bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20 hover:text-primary-foreground"
              onClick={() => scrollTo(monkRef)}
            >
              🪷 เข้าสู่ระบบพระภิกษุ
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Quick Nav strip */}
      <div className="container mx-auto max-w-4xl px-4 -mt-4 relative z-10">
        <div className="flex gap-2 overflow-x-auto pb-2">
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

      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-10">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 2: PUBLIC CALENDAR                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Star className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-foreground">ตรวจสอบตารางกิจกรรมวัด</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            กรุณาตรวจสอบตารางงานส่วนกลางของวัดก่อนทำการขอนิมนต์
          </p>

          <Card className="shadow-card border-gold-subtle">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-secondary" />
                ปฏิทินงานบุญ — {format(selectedDate, 'MMMM yyyy', { locale: th })}
              </CardTitle>
              <div className="flex flex-wrap gap-3 text-xs mt-2">
                <span className="flex items-center gap-1">🟢 มงคลนอกวัด</span>
                <span className="flex items-center gap-1">🟡 งานในวัด</span>
                <span className="flex items-center gap-1">⬜ อวมงคล</span>
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

        <Separator />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 3: LAYPEOPLE                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section ref={laypeopleRef}>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-foreground">ขอนิมนต์พระและคู่มือเตรียมงาน</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            กรอกแบบฟอร์มเพื่อขอนิมนต์พระ พร้อมศึกษาคู่มือเตรียมงานบุญ
          </p>

          {/* Primary CTA */}
          <Button
            variant="gold"
            size="lg"
            className="w-full gap-2 text-base shadow-gold mb-5"
            onClick={() => navigate('/request')}
          >
            <FileText className="h-5 w-5" />
            📝 กรอกแบบฟอร์มขอนิมนต์พระ
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Guide cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auspicious guide */}
            <Card className="shadow-card border-success/30 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 mb-2">
                  <span className="text-2xl">🟢</span>
                </div>
                <CardTitle className="text-base">คู่มือเตรียมงานมงคล</CardTitle>
                <CardDescription className="text-xs">ทำบุญบ้าน, ขึ้นบ้านใหม่, มงคลสมรส, งานบวช</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="items" className="border-none">
                    <AccordionTrigger className="text-sm py-2">สิ่งที่ต้องเตรียม</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>โต๊ะหมู่บูชา พร้อมพระพุทธรูป</li>
                        <li>ดอกไม้ ธูป เทียน</li>
                        <li>น้ำมนต์ (ขันสาคร) + สายสิญจน์</li>
                        <li>ภัตตาหาร / สังฆทาน</li>
                      </ul>
                      <p className="text-xs text-secondary mt-2">
                        💡 วัดมีบริการจัดเตรียมให้ — แจ้งในแบบฟอร์ม
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Inauspicious guide */}
            <Card className="shadow-card border-muted hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-2">
                  <span className="text-2xl">⬜</span>
                </div>
                <CardTitle className="text-base">คู่มือเตรียมงานอวมงคล</CardTitle>
                <CardDescription className="text-xs">งานศพ, ทำบุญ 7/50/100 วัน</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="items" className="border-none">
                    <AccordionTrigger className="text-sm py-2">สิ่งที่ต้องเตรียม</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>โต๊ะหมู่บูชา พร้อมรูปผู้ล่วงลับ</li>
                        <li>ดอกไม้จันทน์ ธูป เทียน</li>
                        <li>สังฆทาน / ชุดไทยธรรม</li>
                        <li>ภัตตาหาร</li>
                      </ul>
                      <p className="text-xs text-secondary mt-2">
                        💡 ทางวัดมีบริการจัดเตรียมชุดไทยธรรม
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 4: PERSONALIZED MONK DASHBOARD (No login required) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section ref={monkRef}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-bold text-foreground">แดชบอร์ดส่วนตัวคณะสงฆ์</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            ข้อมูลกิจนิมนต์และสถิติส่วนตัวของท่าน
          </p>

          {(() => {
            // Simulate logged-in monk (first monk in list)
            const loggedInMonk = monks[0];
            if (!loggedInMonk) return <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>;

            const myAssignments = confirmedCeremonies.filter(c =>
              c.assignments?.some(a => a.monk.id === loggedInMonk.id)
            );
            const now = new Date();
            const myMonthCount = myAssignments.filter(c => {
              try {
                const d = parseISO(c.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              } catch { return false; }
            }).length;
            const upcomingAssignments = myAssignments
              .filter(c => { try { return parseISO(c.date) >= now; } catch { return false; } })
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 3);
            const nextEvent = upcomingAssignments[0];
            const myRole = nextEvent?.assignments?.find(a => a.monk.id === loggedInMonk.id);

            return (
              <div className="space-y-4">
                {/* 1. Welcome Card */}
                <Card className="shadow-card border-secondary/40 bg-gradient-to-br from-card to-secondary/5">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/20 ring-2 ring-secondary/30 shrink-0">
                        <span className="text-2xl">🙏</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-foreground leading-tight">
                          ยินดีต้อนรับ, {loggedInMonk.name}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge variant="maha" className="text-xs">{loggedInMonk.rank}</Badge>
                          <Badge variant="outline" className="text-xs">พรรษา {loggedInMonk.yearsOrdained}</Badge>
                          <Badge variant="outline" className="text-xs">{loggedInMonk.building}</Badge>
                          {loggedInMonk.canLead && <Badge variant="gold" className="text-xs">หัวนำสวดได้</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="shadow-card">
                    <CardContent className="pt-4 pb-3 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto mb-2">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">สถานะคิวปัจจุบัน</p>
                      <p className="text-2xl font-bold text-primary">{loggedInMonk.queueScore}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {loggedInMonk.isFrozen ? '⏸️ ถูกระงับคิวชั่วคราว' : `ลำดับที่ ${loggedInMonk.queueScore} พร้อมรับงาน`}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-card">
                    <CardContent className="pt-4 pb-3 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 mx-auto mb-2">
                        <BarChart3 className="h-5 w-5 text-success" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">กิจนิมนต์เดือนนี้</p>
                      <p className="text-2xl font-bold text-success">{myMonthCount}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">ออกงานแล้ว {myMonthCount} ครั้ง</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Overall progress */}
                <Card className="shadow-card">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>สถิติออกงานสะสม</span>
                      <span className="font-semibold">{loggedInMonk.totalAssignments} / 20 งาน (เป้าปี)</span>
                    </div>
                    <Progress value={Math.min((loggedInMonk.totalAssignments / 20) * 100, 100)} className="h-2.5" />
                  </CardContent>
                </Card>

                {/* 3. Upcoming Event Card */}
                <Card className={cn("shadow-card border-l-4", nextEvent ? "border-l-secondary" : "border-l-muted")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-secondary" />
                      งานกิจนิมนต์ที่กำลังจะถึง
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nextEvent ? (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-secondary/5 border border-secondary/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm">
                                {nextEvent.description || `${nextEvent.type} — ${nextEvent.monkCount} รูป`}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  {(() => { try { return format(parseISO(nextEvent.date), 'PPP', { locale: th }); } catch { return nextEvent.date; } })()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {nextEvent.time || 'ยังไม่ระบุเวลา'}
                                </span>
                              </div>
                              {(nextEvent.location || nextEvent.ceremonyLocation) && (
                                <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {nextEvent.location || nextEvent.ceremonyLocation}
                                </p>
                              )}
                            </div>
                            <Badge variant={nextEvent.type === 'มงคล' ? 'success' : 'secondary'} className="shrink-0">
                              {nextEvent.type}
                            </Badge>
                          </div>
                          {myRole && (
                            <div className="mt-3 pt-2 border-t border-secondary/20">
                              <Badge variant={myRole.role === 'หัวนำสวด' ? 'gold' : 'outline'} className="text-xs">
                                หน้าที่: {myRole.role}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {upcomingAssignments.length > 1 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground">งานถัดไป:</p>
                            {upcomingAssignments.slice(1).map(c => (
                              <div key={c.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                                <span className="text-xs text-foreground">
                                  {(() => { try { return format(parseISO(c.date), 'd MMM', { locale: th }); } catch { return c.date; } })()}
                                  {' · '}{c.description || c.type}
                                </span>
                                <Badge variant={c.type === 'มงคล' ? 'success' : 'secondary'} className="text-[10px]">{c.type}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
                          <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">ยังไม่มีกิจนิมนต์ในขณะนี้</p>
                        <p className="text-xs text-muted-foreground mt-1">ท่านจะได้รับแจ้งเตือนเมื่อมีงานมอบหมายใหม่</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4. Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Shortcut: จัดการบทสวด → หน้าโปรไฟล์ */}
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 bg-card hover:bg-secondary/5 border-secondary/30"
                    onClick={() => navigate('/monk')}
                  >
                    <BookOpen className="h-5 w-5 text-secondary" />
                    <span className="text-xs font-semibold">📿 จัดการบทสวด</span>
                    <span className="text-[10px] text-muted-foreground">หน้าโปรไฟล์</span>
                  </Button>
                  {/* Shortcut: จัดการคิวตึก — สำหรับหัวหน้าตึกเท่านั้น */}
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex-col gap-2 bg-card hover:bg-primary/5 border-primary/30"
                    onClick={() => navigate('/building-head')}
                  >
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold">🏛️ จัดการคิวตึก</span>
                    <span className="text-[10px] text-muted-foreground">สำหรับหัวหน้าตึก</span>
                  </Button>
                </div>
              </div>
            );
          })()}
        </section>

        <Separator />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* SECTION 5: FOOTER                                        */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <footer className="rounded-xl bg-card border shadow-card p-6 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Phone className="h-5 w-5 text-secondary" />
            ช่องทางติดต่อวัด
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 shrink-0">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20 shrink-0">
                <span className="text-lg">💬</span>
              </div>
              <div>
                <p className="font-semibold text-sm">LINE Official</p>
                <p className="text-sm text-muted-foreground">{CONTACT_INFO.line}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
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
          </div>

          <p className="text-xs text-muted-foreground">{CONTACT_INFO.address}</p>

          <Separator />

          <p className="text-center text-xs text-muted-foreground">
            ระบบบริหารจัดการกิจนิมนต์ © {new Date().getFullYear()} — พัฒนาเพื่อความโปร่งใสและเป็นธรรม
          </p>
        </footer>
      </main>
    </div>
  );
}
