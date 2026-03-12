import { useState } from 'react';
import { CeremonyType, CeremonyLocation, CeremonyRequest, TransportOption, MealOption, DiningStyle } from '@/lib/types';
import { loadRequests, saveRequests } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MapPin, Send, ArrowLeft, User, Phone, MessageCircle, Clock, Car, UtensilsCrossed, Package, Loader2 } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ส่วนที่ 1: ข้อมูลเจ้าภาพ
  const [requesterName, setRequesterName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lineId, setLineId] = useState('');

  // ส่วนที่ 2: รายละเอียดกิจนิมนต์
  const [ceremonyType, setCeremonyType] = useState<CeremonyType>('มงคล');
  const [ceremonyTitle, setCeremonyTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [monkCount, setMonkCount] = useState<number>(5);
  const [specifiedMonkNames, setSpecifiedMonkNames] = useState('');

  // ส่วนที่ 3: สถานที่และการเดินทาง
  const [ceremonyLocation, setCeremonyLocation] = useState<CeremonyLocation>('นอกวัด');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [transportOption, setTransportOption] = useState<TransportOption>('เจ้าภาพรับ-ส่ง');
  const [pickupTime, setPickupTime] = useState('08:00');

  // ส่วนที่ 4: การรับรองและภัตตาหาร
  const [mealOption, setMealOption] = useState<MealOption>('ไม่มี');
  const [diningStyle, setDiningStyle] = useState<DiningStyle>('ฉันวง');
  const [additionalDetails, setAdditionalDetails] = useState('');

  // สังฆทาน
  const [needTemplePreparation, setNeedTemplePreparation] = useState(false);
  const [templePreparationDetails, setTemplePreparationDetails] = useState('');

  const handleSubmit = async () => {
    if (!requesterName.trim()) {
      toast.error('กรุณาระบุชื่อ-นามสกุล');
      return;
    }
    if (!phoneNumber.trim()) {
      toast.error('กรุณาระบุเบอร์โทรศัพท์');
      return;
    }
    if (!selectedDate) {
      toast.error('กรุณาเลือกวันที่จัดงาน');
      return;
    }
    if (ceremonyLocation === 'นอกวัด' && !location.trim()) {
      toast.error('กรุณาระบุสถานที่จัดงาน');
      return;
    }

    setIsSubmitting(true);

    const newRequest: CeremonyRequest = {
      id: `req${Date.now()}`,
      requesterName: requesterName.trim(),
      phoneNumber: phoneNumber.trim(),
      lineId: lineId.trim() || undefined,
      ceremonyType,
      ceremonyTitle: ceremonyTitle.trim() || undefined,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time,
      monkCount,
      specifiedMonkNames: specifiedMonkNames.trim() || undefined,
      ceremonyLocation,
      location: ceremonyLocation === 'ในวัด' ? 'ภายในวัด' : location.trim(),
      locationUrl: locationUrl.trim() || undefined,
      transportOption,
      pickupTime: transportOption === 'เจ้าภาพรับ-ส่ง' ? pickupTime : undefined,
      mealOption,
      diningStyle: mealOption !== 'ไม่มี' ? diningStyle : undefined,
      additionalDetails: additionalDetails.trim() || undefined,
      description: ceremonyTitle.trim() || `งาน${ceremonyType}`,
      needTemplePreparation,
      templePreparationDetails: needTemplePreparation ? templePreparationDetails.trim() : undefined,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      suggestedItems: SUGGESTED_ITEMS[ceremonyType],
      suggestedTime: SUGGESTED_TIME[ceremonyType],
    };

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const requests = loadRequests();
    saveRequests([newRequest, ...requests]);

    setIsSubmitting(false);
    toast.success('ทางวัดได้รับข้อมูลการนิมนต์ของท่านเรียบร้อยแล้ว');

    // Reset form
    setRequesterName('');
    setPhoneNumber('');
    setLineId('');
    setCeremonyTitle('');
    setSelectedDate(undefined);
    setTime('09:00');
    setMonkCount(5);
    setSpecifiedMonkNames('');
    setCeremonyLocation('นอกวัด');
    setLocation('');
    setLocationUrl('');
    setTransportOption('เจ้าภาพรับ-ส่ง');
    setPickupTime('08:00');
    setMealOption('ไม่มี');
    setDiningStyle('ฉันวง');
    setAdditionalDetails('');
    setNeedTemplePreparation(false);
    setTemplePreparationDetails('');
  };

  const extractGoogleMapsEmbed = (url: string) => {
    if (!url) return null;
    // Support various Google Maps URL formats
    const placeMatch = url.match(/place\/([^/]+)/);
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${coordMatch[2]}!3d${coordMatch[1]}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sth!4v1`;
    }
    if (placeMatch || url.includes('google.com/maps') || url.includes('goo.gl/maps')) {
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d100.5!3d13.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0!2s0x0!5e0!3m2!1sen!2sth!4v1`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-maroon px-4 py-6 shadow-lg">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <span className="text-xl">🙏</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-cream">แบบฟอร์มนิมนต์พระ</h1>
              <p className="text-sm text-cream/70">Monk Invitation Form</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6 space-y-5">
        <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Button>

        {/* ───── ส่วนที่ 1: ข้อมูลเจ้าภาพ ───── */}
        <Card className="shadow-card border-gold-subtle animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-5 w-5 text-accent" />
              ส่วนที่ 1: ข้อมูลเจ้าภาพ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อ-นามสกุล <span className="text-destructive">*</span></Label>
              <Input placeholder="ระบุชื่อ-นามสกุล" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> เบอร์โทรศัพท์ <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="0xx-xxx-xxxx" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} type="tel" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> Line ID
                </Label>
                <Input placeholder="Line ID (ถ้ามี)" value={lineId} onChange={(e) => setLineId(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ───── ส่วนที่ 2: รายละเอียดกิจนิมนต์ ───── */}
        <Card className="shadow-card border-gold-subtle animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-accent" />
              ส่วนที่ 2: รายละเอียดกิจนิมนต์
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ประเภทงาน</Label>
                <Select value={ceremonyType} onValueChange={(v) => setCeremonyType(v as CeremonyType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="มงคล">🟢 งานมงคล</SelectItem>
                    <SelectItem value="อวมงคล">🔴 งานอวมงคล</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ชื่องานพิธี</Label>
                <Input placeholder="เช่น ทำบุญขึ้นบ้านใหม่, สวดอภิธรรม" value={ceremonyTitle} onChange={(e) => setCeremonyTitle(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันที่จัดงาน <span className="text-destructive">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP', { locale: th }) : 'เลือกวันที่'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> เวลาเริ่มพิธีสงฆ์
                </Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>จำนวนพระ</Label>
                <Select value={String(monkCount)} onValueChange={(v) => setMonkCount(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONK_COUNTS.map(n => (
                      <SelectItem key={n} value={String(n)}>{n} รูป</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ระบุชื่อพระที่เจาะจง (ถ้ามี)</Label>
                <Input placeholder="ชื่อพระที่ต้องการ" value={specifiedMonkNames} onChange={(e) => setSpecifiedMonkNames(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ───── ส่วนที่ 3: สถานที่และการเดินทาง ───── */}
        <Card className="shadow-card border-gold-subtle animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-accent" />
              ส่วนที่ 3: สถานที่และการเดินทาง
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>สถานที่จัดงาน</Label>
              <Select value={ceremonyLocation} onValueChange={(v) => setCeremonyLocation(v as CeremonyLocation)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ในวัด">🏛️ ภายในวัด</SelectItem>
                  <SelectItem value="นอกวัด">🏠 นอกสถานที่</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {ceremonyLocation === 'นอกวัด' && (
              <>
                <div className="space-y-2">
                  <Label>ที่อยู่แบบละเอียด <span className="text-destructive">*</span></Label>
                  <Textarea placeholder="บ้านเลขที่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด" value={location} onChange={(e) => setLocation(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-accent" /> ลิงก์ Google Maps
                  </Label>
                  <Input placeholder="https://maps.google.com/..." value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} />
                  {locationUrl && (
                    <div className="space-y-2">
                      <a href={locationUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent underline flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> เปิดแผนที่ในแท็บใหม่
                      </a>
                      {extractGoogleMapsEmbed(locationUrl) && (
                        <div className="rounded-lg overflow-hidden border border-border">
                          <iframe
                            src={extractGoogleMapsEmbed(locationUrl)!}
                            width="100%"
                            height="200"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Google Maps"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" /> การเดินทาง
                  </Label>
                  <RadioGroup value={transportOption} onValueChange={(v) => setTransportOption(v as TransportOption)} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="เจ้าภาพรับ-ส่ง" id="transport-host" />
                      <Label htmlFor="transport-host" className="cursor-pointer font-normal">🚗 เจ้าภาพรับ-ส่ง</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="วัดเดินทางเอง" id="transport-temple" />
                      <Label htmlFor="transport-temple" className="cursor-pointer font-normal">🚐 วัดเดินทางเอง</Label>
                    </div>
                  </RadioGroup>
                </div>

                {transportOption === 'เจ้าภาพรับ-ส่ง' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> เวลานัดหมายรับพระ
                    </Label>
                    <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ───── ส่วนที่ 4: การรับรองและภัตตาหาร ───── */}
        <Card className="shadow-card border-gold-subtle animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-accent" />
              ส่วนที่ 4: การรับรองและภัตตาหาร
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>การถวายภัตตาหาร</Label>
              <RadioGroup value={mealOption} onValueChange={(v) => setMealOption(v as MealOption)} className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="ไม่มี" id="meal-none" />
                  <Label htmlFor="meal-none" className="cursor-pointer font-normal">ไม่มี</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="มื้อเช้า" id="meal-morning" />
                  <Label htmlFor="meal-morning" className="cursor-pointer font-normal">🍳 มื้อเช้า</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="มื้อเพล" id="meal-noon" />
                  <Label htmlFor="meal-noon" className="cursor-pointer font-normal">🍱 มื้อเพล</Label>
                </div>
              </RadioGroup>
            </div>

            {mealOption !== 'ไม่มี' && (
              <div className="space-y-3">
                <Label>รูปแบบการฉัน</Label>
                <RadioGroup value={diningStyle} onValueChange={(v) => setDiningStyle(v as DiningStyle)} className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ฉันวง" id="dining-circle" />
                    <Label htmlFor="dining-circle" className="cursor-pointer font-normal">🔵 ฉันวง</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ฉันโตก" id="dining-tray" />
                    <Label htmlFor="dining-tray" className="cursor-pointer font-normal">🟡 ฉันโตก</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label>หมายเหตุเพิ่มเติม</Label>
              <Textarea placeholder="รายละเอียดอื่นๆ ที่ต้องการแจ้ง" value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* ───── สังฆทาน ───── */}
        <Card className="border-gold-subtle animate-fade-in">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox id="temple-prep" checked={needTemplePreparation} onCheckedChange={(checked) => setNeedTemplePreparation(!!checked)} />
              <Label htmlFor="temple-prep" className="cursor-pointer flex items-center gap-2">
                <Package className="h-4 w-4 text-accent" />
                ต้องการให้วัดเตรียมสังฆทาน (มีค่าใช้จ่ายเพิ่มเติม)
              </Label>
            </div>
            {needTemplePreparation && (
              <Textarea placeholder="ระบุรายละเอียด เช่น สังฆทาน, ชุดไทยธรรม ฯลฯ" value={templePreparationDetails} onChange={(e) => setTemplePreparationDetails(e.target.value)} rows={3} />
            )}
          </CardContent>
        </Card>

        {/* ───── แนะนำเรื่องเวลาและสิ่งที่ต้องเตรียม ───── */}
        <Card className="bg-muted/50 border-gold-subtle">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-accent">
              📋 แนะนำเรื่องเวลาและสิ่งที่ต้องเตรียม ({ceremonyType === 'มงคล' ? 'งานมงคล' : 'งานอวมงคล'})
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

        {/* ───── ปุ่มยืนยัน ───── */}
        <Button variant="gold" size="lg" className="w-full gap-2" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              กำลังส่งข้อมูล...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              ยืนยันส่งคำขอนิมนต์
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground pb-4">
          เมื่อกดยืนยัน ข้อมูลจะถูกส่งไปยังเจ้าหน้าที่กิจนิมนต์เพื่อตรวจสอบและอนุมัติ
        </p>
      </main>
    </div>
  );
}
