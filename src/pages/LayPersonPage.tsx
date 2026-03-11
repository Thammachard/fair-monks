import { useState } from 'react';
import { CeremonyType, CeremonyLocation, CeremonyRequest } from '@/lib/types';
import { loadMonks, loadRequests, saveRequests } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MapPin, Send, ArrowLeft, Info, Package } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const MONK_COUNTS = [3, 4, 5, 7, 9, 10];

const SUGGESTED_ITEMS: Record<CeremonyType, string> = {
  'มงคล': '- น้ำมนต์ (ขัน/ถัง)\n- ด้ายสายสิญจน์\n- ดอกไม้ ธูป เทียน\n- ภัตตาหาร/ปิ่นโต\n- น้ำดื่ม\n- พัดลม/แอร์ (ถ้าจัดนอกสถานที่)',
  'อวมงคล': '- สังฆทาน\n- ดอกไม้ ธูป เทียน\n- ภัตตาหาร/ปิ่นโต\n- น้ำดื่ม\n- ผ้าบังสุกุล',
};

const SUGGESTED_TIME: Record<CeremonyType, string> = {
  'มงคล': 'แนะนำเวลา: เช้า 09:00 น. หรือ สาย 10:30 น.\nควรเผื่อเวลาเดินทาง 30-60 นาที\nพิธีใช้เวลาประมาณ 30-45 นาที',
  'อวมงคล': 'แนะนำเวลา: เช้า 07:00 น. หรือ บ่าย 14:00 น.\nควรเผื่อเวลาเดินทาง 30-60 นาที\nพิธีใช้เวลาประมาณ 45-60 นาที',
};

export default function LayPersonPage() {
  const navigate = useNavigate();
  const [requesterName, setRequesterName] = useState('');
  const [ceremonyType, setCeremonyType] = useState<CeremonyType>('มงคล');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [monkCount, setMonkCount] = useState<number>(5);
  const [description, setDescription] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [ceremonyLocation, setCeremonyLocation] = useState<CeremonyLocation>('นอกวัด');
  const [needTemplePreparation, setNeedTemplePreparation] = useState(false);
  const [templePreparationDetails, setTemplePreparationDetails] = useState('');

  const handleSubmit = () => {
    if (!requesterName.trim()) {
      toast.error('กรุณาระบุชื่อเจ้าภาพ');
      return;
    }
    if (!selectedDate) {
      toast.error('กรุณาเลือกวันที่');
      return;
    }
    if (!location.trim()) {
      toast.error('กรุณาระบุสถานที่');
      return;
    }

    const newRequest: CeremonyRequest = {
      id: `req${Date.now()}`,
      requesterName: requesterName.trim(),
      ceremonyType,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time,
      location: location.trim(),
      locationUrl: locationUrl.trim() || undefined,
      monkCount,
      description: description.trim() || '-',
      additionalDetails: additionalDetails.trim() || undefined,
      needTemplePreparation,
      templePreparationDetails: needTemplePreparation ? templePreparationDetails.trim() : undefined,
      ceremonyLocation,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      suggestedItems: SUGGESTED_ITEMS[ceremonyType],
      suggestedTime: SUGGESTED_TIME[ceremonyType],
    };

    const requests = loadRequests();
    saveRequests([newRequest, ...requests]);
    toast.success('ส่งคำขอนิมนต์เรียบร้อยแล้ว กรุณารอการอนุมัติจาก Admin');

    // Reset form
    setRequesterName('');
    setSelectedDate(undefined);
    setLocation('');
    setLocationUrl('');
    setDescription('');
    setAdditionalDetails('');
    setNeedTemplePreparation(false);
    setTemplePreparationDetails('');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-maroon px-4 py-6 shadow-lg">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <span className="text-xl">🙏</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-cream">แบบฟอร์มนิมนต์พระ</h1>
              <p className="text-sm text-cream/70">สำหรับโยมกรอกข้อมูลการนิมนต์</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Button>

        <Card className="shadow-card border-gold-subtle animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-accent" />
              รายละเอียดการนิมนต์
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 1. ชื่อเจ้าภาพ */}
            <div className="space-y-2">
              <Label>1. ชื่อเจ้าภาพ <span className="text-destructive">*</span></Label>
              <Input
                placeholder="ระบุชื่อเจ้าภาพ"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
              />
            </div>

            {/* 2. ประเภทงาน */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>2. ประเภทงาน</Label>
                <Select value={ceremonyType} onValueChange={(v) => setCeremonyType(v as CeremonyType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="มงคล">🟢 งานมงคล</SelectItem>
                    <SelectItem value="อวมงคล">🔴 งานอวมงคล</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>สถานที่จัด</Label>
                <Select value={ceremonyLocation} onValueChange={(v) => setCeremonyLocation(v as CeremonyLocation)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ในวัด">🏛️ ในวัด</SelectItem>
                    <SelectItem value="นอกวัด">🏠 นอกวัด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3. วัน */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>3. วันที่ <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !selectedDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP', { locale: th }) : 'เลือกวันที่'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 4. เวลา */}
              <div className="space-y-2">
                <Label>4. เวลา</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* 5. สถานที่ */}
            <div className="space-y-2">
              <Label>5. สถานที่ <span className="text-destructive">*</span></Label>
              <Input
                placeholder="ระบุสถานที่จัดงาน"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-accent" />
                ลิงก์ Google Maps (ถ้ามี)
              </Label>
              <Input
                placeholder="https://maps.google.com/..."
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
              />
              {locationUrl && locationUrl.includes('google.com/maps') && (
                <a
                  href={locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent underline flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" /> เปิดแผนที่
                </a>
              )}
            </div>

            {/* 6. เพิ่มเติม */}
            <div className="space-y-2">
              <Label>6. รายละเอียดเพิ่มเติม</Label>
              <Textarea
                placeholder="รายละเอียดงาน, จำนวนแขก, ข้อมูลอื่นๆ"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={3}
              />
            </div>

            {/* 7. จำนวนพระ */}
            <div className="space-y-2">
              <Label>7. จำนวนพระ</Label>
              <Select value={String(monkCount)} onValueChange={(v) => setMonkCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONK_COUNTS.map(n => (
                    <SelectItem key={n} value={String(n)}>{n} รูป</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 8. แนะนำเรื่องเวลาและสิ่งที่ต้องเตรียม */}
            <Card className="bg-muted/50 border-gold-subtle">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-accent">
                  <Info className="h-4 w-4" />
                  8. แนะนำเรื่องเวลาและสิ่งที่ต้องเตรียม
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">⏰ เรื่องเวลา:</p>
                  <p className="text-sm whitespace-pre-line">{SUGGESTED_TIME[ceremonyType]}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">📦 สิ่งที่ต้องเตรียม:</p>
                  <p className="text-sm whitespace-pre-line">{SUGGESTED_ITEMS[ceremonyType]}</p>
                </div>
              </CardContent>
            </Card>

            {/* ให้วัดเตรียมสังฆทาน */}
            <Card className="border-gold-subtle">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="temple-prep"
                    checked={needTemplePreparation}
                    onCheckedChange={(checked) => setNeedTemplePreparation(!!checked)}
                  />
                  <Label htmlFor="temple-prep" className="cursor-pointer flex items-center gap-2">
                    <Package className="h-4 w-4 text-accent" />
                    ต้องการให้วัดเตรียมสังฆทาน (มีค่าใช้จ่ายเพิ่มเติม)
                  </Label>
                </div>
                {needTemplePreparation && (
                  <Textarea
                    placeholder="ระบุรายละเอียดสิ่งที่ต้องการให้วัดเตรียม เช่น สังฆทาน ชุดไทยธรรม ฯลฯ"
                    value={templePreparationDetails}
                    onChange={(e) => setTemplePreparationDetails(e.target.value)}
                    rows={3}
                  />
                )}
              </CardContent>
            </Card>

            {/* 9. ปุ่มยืนยัน */}
            <Button variant="gold" size="lg" className="w-full gap-2" onClick={handleSubmit}>
              <Send className="h-5 w-5" />
              9. ยืนยันส่งคำขอนิมนต์
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
