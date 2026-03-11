import { useState, useEffect } from 'react';
import { Ceremony } from '@/lib/types';
import { loadCeremonies } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MapPin, Phone, MessageSquare, Users, FileText, Clock, ChevronRight, Info, Settings } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const CONTACT_INFO = {
  name: 'พระมหาสมชาย (เจ้าหน้าที่กิจนิมนต์)',
  phone: '081-234-5678',
  lineQr: '', // placeholder
};

export default function HomePage() {
  const navigate = useNavigate();
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    setCeremonies(loadCeremonies());
  }, []);

  const confirmedCeremonies = ceremonies.filter(c => c.status === 'confirmed' || c.status === 'pending');

  const ceremoniesOnDate = confirmedCeremonies.filter(c => {
    try {
      return isSameDay(parseISO(c.date), selectedDate);
    } catch {
      return false;
    }
  });

  // Get dates that have ceremonies for calendar highlighting
  const ceremonyDates = confirmedCeremonies.map(c => {
    try { return parseISO(c.date); } catch { return null; }
  }).filter(Boolean) as Date[];

  const getTypeStyle = (type: string, location?: string) => {
    if (type === 'อวมงคล') return { bg: 'bg-muted', text: 'text-muted-foreground', dot: '🔘' };
    if (location === 'ในวัด') return { bg: 'bg-accent/10', text: 'text-accent', dot: '🟡' };
    return { bg: 'bg-success/10', text: 'text-success', dot: '🟢' };
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-maroon px-4 py-6 shadow-lg">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <span className="text-xl">🛕</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-cream">ระบบบริหารจัดการกิจนิมนต์</h1>
              <p className="text-sm text-cream/70">ปฏิทินงานบุญ & รายละเอียดนิมนต์</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Navigation */}
        <div className="flex flex-wrap gap-2">
          <Button variant="gold" size="sm" className="gap-1">
            <CalendarIcon className="h-4 w-4" /> หน้าหลัก
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/request')}>
            🙏 แบบฟอร์มนิมนต์
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/admin')}>
            <Settings className="h-4 w-4" /> Admin
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/monk')}>
            📿 พระ/เณร
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/building-head')}>
            🏛️ หัวหน้าตึก
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/queue')}>
            <Users className="h-4 w-4" /> ดูคิว
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/history')}>
            <Clock className="h-4 w-4" /> ประวัติ
          </Button>
        </div>

        {/* 1. ปฏิทินงานบุญ */}
        <Card className="shadow-card border-gold-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-accent" />
              1. ปฏิทินงานบุญ
            </CardTitle>
            <div className="flex gap-3 text-xs mt-2">
              <span className="flex items-center gap-1">🟡 งานในวัด</span>
              <span className="flex items-center gap-1">🟢 งานมงคลนอกวัด</span>
              <span className="flex items-center gap-1">🔘 งานอวมงคล</span>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className={cn("p-3 pointer-events-auto mx-auto")}
              modifiers={{
                ceremony: ceremonyDates,
              }}
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
              {ceremoniesOnDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">ไม่มีงานในวันนี้</p>
              ) : (
                ceremoniesOnDate.map(c => {
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
                              {c.locationUrl && (
                                <a href={c.locationUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline ml-1">
                                  ดูแผนที่
                                </a>
                              )}
                            </p>
                          )}
                        </div>
                        <Badge variant={c.status === 'confirmed' ? 'success' : 'warning'}>
                          {c.status === 'confirmed' ? 'ยืนยัน' : 'รอ'}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. รายละเอียดงานนิมนต์ */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              2. รายละเอียดงานนิมนต์
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold">📌 งานในวัด</p>
                <p className="text-sm text-muted-foreground">ทำบุญประจำวัน, งานพิธีในพระอุโบสถ, งานบุญเทศกาล</p>
              </div>
              <div>
                <p className="text-sm font-semibold">📌 งานนอกวัด</p>
                <p className="text-sm text-muted-foreground">งานทำบุญบ้าน, งานมงคลสมรส, งานขึ้นบ้านใหม่, งานศพ</p>
              </div>
              <div>
                <p className="text-sm font-semibold">📦 สิ่งที่ต้องเตรียม</p>
                <p className="text-sm text-muted-foreground">ดอกไม้ ธูป เทียน, น้ำมนต์, สังฆทาน, ภัตตาหาร</p>
                <p className="text-xs text-accent mt-1">หากไม่มี สามารถให้ทางวัดจัดเตรียมให้ได้ (มีค่าใช้จ่ายเพิ่มเติม)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. ช่องทางติดต่อ */}
        <Card className="shadow-card border-gold-subtle">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-accent" />
              3. ช่องทางติดต่อเจ้าหน้าที่กิจนิมนต์
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg">
                👤
              </div>
              <div>
                <p className="font-semibold text-sm">{CONTACT_INFO.name}</p>
                <a href={`tel:${CONTACT_INFO.phone}`} className="text-sm text-accent flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {CONTACT_INFO.phone}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success text-lg">
                💬
              </div>
              <div>
                <p className="font-semibold text-sm">LINE Official</p>
                <p className="text-sm text-muted-foreground">สแกน QR Code หรือเพิ่มเพื่อน @temple-nimmon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. ข้อความแจ้ง */}
        <Card className="bg-accent/10 border-accent/30">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-accent mt-0.5 shrink-0" />
              <p className="text-sm">
                <strong>หมายเหตุ:</strong> ปฏิทินนี้แสดงงานเบื้องต้น หากต้องการนิมนต์ในวันที่มีงานแล้ว กรุณาสอบถามเจ้าหน้าที่ เพราะทางวัดอาจจัดสรรคณะสงฆ์เพิ่มเติมให้ท่านได้
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
