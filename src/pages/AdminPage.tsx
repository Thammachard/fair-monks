import { useState } from 'react';
import { CeremonyType, CeremonyLocation, Ceremony, Assignment, QUOTA_CONFIGS, CeremonyRequest, Monk, AssignmentHistoryEntry } from '@/lib/types';
import { CHANT_CATEGORIES } from '@/lib/chantingData';
import { generateAssignments } from '@/lib/queueEngine';
import { loadMonks, saveMonks, loadCeremonies, saveCeremonies, loadRequests, saveRequests } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, CalendarIcon, Sparkles, FileText, ChevronRight, Clock, MapPin, Settings, Package, CheckCircle, XCircle, Info, History, UserCheck, UserX, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const MONK_COUNTS = [3, 4, 5, 7, 9, 10];

const rankBadgeVariant = (rank: string) => {
  switch (rank) {
    case 'มหาเถระ': return 'maha' as const;
    case 'เถระ': return 'thera' as const;
    case 'มัชฌิมะ': return 'majjhima' as const;
    case 'นวกะ': return 'navaka' as const;
    default: return 'default' as const;
  }
};

const SUGGESTED_ITEMS: Record<CeremonyType, string> = {
  'มงคล': '- น้ำมนต์ (ขัน/ถัง)\n- ด้ายสายสิญจน์\n- ดอกไม้ ธูป เทียน\n- ภัตตาหาร/ปิ่นโต\n- น้ำดื่ม',
  'อวมงคล': '- สังฆทาน\n- ดอกไม้ ธูป เทียน\n- ภัตตาหาร/ปิ่นโต\n- น้ำดื่ม\n- ผ้าบังสุกุล',
};

const SUGGESTED_TIME: Record<CeremonyType, string> = {
  'มงคล': 'แนะนำ: เช้า 09:00 น. หรือ สาย 10:30 น. เผื่อเวลาเดินทาง 30-60 นาที',
  'อวมงคล': 'แนะนำ: เช้า 07:00 น. หรือ บ่าย 14:00 น. เผื่อเวลาเดินทาง 30-60 นาที',
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [ceremonyType, setCeremonyType] = useState<CeremonyType>('มงคล');
  const [monkCount, setMonkCount] = useState<number>(5);
  const [requesterName, setRequesterName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [ceremonyLocation, setCeremonyLocation] = useState<CeremonyLocation>('นอกวัด');
  const [selectedChantIds, setSelectedChantIds] = useState<Set<string>>(new Set());
  const [specifiedMonkIds, setSpecifiedMonkIds] = useState<Set<string>>(new Set());
  const [suggestedItems, setSuggestedItems] = useState('');
  const [suggestedTime, setSuggestedTime] = useState('');
  const [needTemplePreparation, setNeedTemplePreparation] = useState(false);
  const [templePreparationDetails, setTemplePreparationDetails] = useState('');
  const [draftAssignments, setDraftAssignments] = useState<Assignment[] | null>(null);
  const [ceremonies, setCeremonies] = useState(() => loadCeremonies());
  const [requests, setRequests] = useState(() => loadRequests());
  const [showChants, setShowChants] = useState(false);
  const [showMonkSelect, setShowMonkSelect] = useState(false);
  // New: Open for All (งานส่วนรวม)
  const [isOpenForAll, setIsOpenForAll] = useState(false);
  const [checkInMap, setCheckInMap] = useState<Record<string, boolean>>({});
  // New: Monk history dialog
  const [historyMonk, setHistoryMonk] = useState<Monk | null>(null);
  // Communal ceremony management
  const [managingCeremony, setManagingCeremony] = useState<Ceremony | null>(null);

  const [monks, setMonksState] = useState(() => loadMonks());

  const handleGenerate = () => {
    try {
      const assignments = generateAssignments(monks, ceremonyType, monkCount);
      setDraftAssignments(assignments);
      toast.success('จัดรายชื่อสำเร็จ!');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleConfirmDraft = () => {
    if (!draftAssignments && !isOpenForAll) return;
    const newCeremony: Ceremony = {
      id: `c${Date.now()}`,
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      time,
      type: ceremonyType,
      monkCount: isOpenForAll ? monks.length : monkCount,
      requesterName: requesterName || 'ไม่ระบุ',
      description: description || '-',
      assignments: isOpenForAll ? [] : (draftAssignments || []).map(a => ({ ...a, status: 'pending' as const })),
      status: isOpenForAll ? 'confirmed' : 'pending',
      createdAt: new Date().toISOString(),
      location: location || undefined,
      locationUrl: locationUrl || undefined,
      ceremonyLocation,
      selectedChantIds: selectedChantIds.size > 0 ? Array.from(selectedChantIds) : undefined,
      suggestedItems: suggestedItems || SUGGESTED_ITEMS[ceremonyType],
      suggestedTime: suggestedTime || SUGGESTED_TIME[ceremonyType],
      needTemplePreparation,
      templePreparationDetails: needTemplePreparation ? templePreparationDetails : undefined,
      isOpenForAll,
      checkInResults: isOpenForAll ? monks.map(m => ({ monkId: m.id, attended: false })) : undefined,
    };
    const updated = [newCeremony, ...ceremonies];
    setCeremonies(updated);
    saveCeremonies(updated);
    setDraftAssignments(null);
    setRequesterName('');
    setDescription('');
    setLocation('');
    setLocationUrl('');
    setSelectedDate(undefined);
    setSelectedChantIds(new Set());
    setSpecifiedMonkIds(new Set());
    setNeedTemplePreparation(false);
    setTemplePreparationDetails('');
    setIsOpenForAll(false);
    setCheckInMap({});
    toast.success(isOpenForAll ? 'สร้างงานส่วนรวมเรียบร้อย' : 'ส่งรายชื่อไปยังหัวหน้าตึกเรียบร้อย');
  };

  // Complete a ceremony and record history for each monk
  const handleCompleteCeremony = (ceremony: Ceremony) => {
    const ceremonyName = ceremony.description || `${ceremony.type} — ${ceremony.monkCount} รูป`;
    let updatedMonks = [...monks];

    if (ceremony.isOpenForAll && ceremony.checkInResults) {
      // Communal: record for all, +1 activityScore for attendees
      for (const entry of ceremony.checkInResults) {
        updatedMonks = updatedMonks.map(m => {
          if (m.id !== entry.monkId) return m;
          const historyEntry: AssignmentHistoryEntry = {
            ceremonyId: ceremony.id,
            ceremonyName,
            date: ceremony.date,
            status: entry.attended ? 'attended' : 'rejected',
          };
          return {
            ...m,
            assignmentHistory: [...(m.assignmentHistory || []), historyEntry],
            activityScore: entry.attended ? (m.activityScore || 0) + 1 : (m.activityScore || 0),
          };
        });
      }
    } else {
      // Normal ceremony: record for assigned monks
      for (const a of ceremony.assignments) {
        const wasSubstituted = a.status === 'substituted' || a.status === 'rejected_sick' || a.status === 'rejected_skip';
        updatedMonks = updatedMonks.map(m => {
          if (m.id !== a.monk.id) return m;
          const historyEntry: AssignmentHistoryEntry = {
            ceremonyId: ceremony.id,
            ceremonyName,
            date: ceremony.date,
            status: wasSubstituted ? 'substituted' : 'attended',
            role: a.role,
          };
          return {
            ...m,
            assignmentHistory: [...(m.assignmentHistory || []), historyEntry],
          };
        });
      }
    }

    setMonksState(updatedMonks);
    saveMonks(updatedMonks);

    // Mark ceremony as completed
    const updatedCeremonies = ceremonies.map(c =>
      c.id === ceremony.id ? { ...c, status: 'completed' as const } : c
    );
    setCeremonies(updatedCeremonies);
    saveCeremonies(updatedCeremonies);
    setManagingCeremony(null);
    toast.success('บันทึกจบงานและประวัติเรียบร้อย');
  };

  // Toggle check-in for communal ceremony
  const toggleCheckIn = (ceremonyId: string, monkId: string) => {
    const updatedCeremonies = ceremonies.map(c => {
      if (c.id !== ceremonyId || !c.checkInResults) return c;
      return {
        ...c,
        checkInResults: c.checkInResults.map(cr =>
          cr.monkId === monkId ? { ...cr, attended: !cr.attended } : cr
        ),
      };
    });
    setCeremonies(updatedCeremonies);
    saveCeremonies(updatedCeremonies);
    // Also update managing ceremony state
    if (managingCeremony?.id === ceremonyId) {
      const updated = updatedCeremonies.find(c => c.id === ceremonyId);
      if (updated) setManagingCeremony(updated);
    }
  };

  const handleApproveRequest = (req: CeremonyRequest) => {
    setRequesterName(req.requesterName);
    setCeremonyType(req.ceremonyType);
    setMonkCount(req.monkCount);
    setDescription(req.description);
    setLocation(req.location);
    setLocationUrl(req.locationUrl || '');
    setTime(req.time);
    setCeremonyLocation(req.ceremonyLocation);
    setNeedTemplePreparation(req.needTemplePreparation);
    setTemplePreparationDetails(req.templePreparationDetails || '');
    if (req.date) {
      try { setSelectedDate(new Date(req.date)); } catch {}
    }
    const updatedReqs = requests.map(r => r.id === req.id ? { ...r, status: 'approved' as const } : r);
    setRequests(updatedReqs);
    saveRequests(updatedReqs);
    toast.success('โหลดข้อมูลจากคำขอเรียบร้อย กรุณากดจัดรายชื่อ');
  };

  const handleRejectRequest = (reqId: string) => {
    const updatedReqs = requests.map(r => r.id === reqId ? { ...r, status: 'rejected' as const } : r);
    setRequests(updatedReqs);
    saveRequests(updatedReqs);
    toast.success('ปฏิเสธคำขอเรียบร้อย');
  };

  const pendingRequests = requests.filter(r => r.status === 'waiting');

  const toggleChant = (id: string) => {
    setSelectedChantIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
              <p className="text-sm text-cream/70">Admin — สร้างงานและจัดรายชื่อ</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Navigation */}
        <div className="flex flex-wrap gap-2">
          <Button variant="gold" size="sm" className="gap-1">
            <Settings className="h-4 w-4" /> Admin
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/')}>
            <CalendarIcon className="h-4 w-4" /> หน้าหลัก
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/building-head')}>
            🏛️ หัวหน้าตึก <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/queue')}>
            <Users className="h-4 w-4" /> ดูคิว
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/history')}>
            <Clock className="h-4 w-4" /> ประวัติ
          </Button>
        </div>

        {/* Pending Requests from Laypeople */}
        {pendingRequests.length > 0 && (
          <Card className="shadow-card border-accent/30 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                🙏 คำขอนิมนต์จากโยม ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.map(req => (
                <div key={req.id} className="rounded-lg border p-4 space-y-2 bg-accent/5 border-accent/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{req.requesterName} — {req.ceremonyType} ({req.monkCount} รูป)</p>
                      <p className="text-xs text-muted-foreground">
                        {req.date} · {req.time} · {req.location} · {req.ceremonyLocation}
                      </p>
                      {req.additionalDetails && (
                        <p className="text-xs text-muted-foreground mt-1">{req.additionalDetails}</p>
                      )}
                      {req.needTemplePreparation && (
                        <Badge variant="warning" className="text-xs mt-1">
                          <Package className="h-3 w-3 mr-1" /> ขอให้วัดเตรียมสังฆทาน
                        </Badge>
                      )}
                    </div>
                  </div>
                  {req.locationUrl && (
                    <a href={req.locationUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> ดูแผนที่
                    </a>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button variant="gold" size="sm" className="gap-1" onClick={() => handleApproveRequest(req)}>
                      <CheckCircle className="h-4 w-4" /> รับคำขอ & สร้างงาน
                    </Button>
                    <Button variant="destructive" size="sm" className="gap-1" onClick={() => handleRejectRequest(req.id)}>
                      <XCircle className="h-4 w-4" /> ปฏิเสธ
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Create Ceremony Form */}
        <Card className="shadow-card border-gold-subtle animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarIcon className="h-5 w-5 text-accent" />
              สร้างงานกิจนิมนต์ใหม่
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* งานส่วนรวม Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-semibold">งานส่วนรวม (Open for All)</p>
                  <p className="text-xs text-muted-foreground">ไม่จำกัดโควตา — เช็กชื่อทุกรูป · บวกคะแนนจิตพิสัย +1</p>
                </div>
              </div>
              <Switch checked={isOpenForAll} onCheckedChange={setIsOpenForAll} />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              {!isOpenForAll && (
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
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อเจ้าภาพ / ชื่องาน</Label>
                <Input placeholder="ระบุชื่อเจ้าภาพหรือชื่องาน" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>สถานที่จัด</Label>
                <Select value={ceremonyLocation} onValueChange={(v) => setCeremonyLocation(v as CeremonyLocation)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ในวัด">🏛️ ในวัด</SelectItem>
                    <SelectItem value="นอกวัด">🏠 นอกวัด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันที่</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP', { locale: th }) : 'เลือกวันที่'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>เวลา</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Input placeholder="บ้าน, สถานที่, หมายเหตุ" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><MapPin className="h-4 w-4 text-accent" /> สถานที่</Label>
                <Input placeholder="ที่อยู่สถานที่จัดงาน" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ลิงก์ Google Maps</Label>
                <Input placeholder="https://maps.google.com/..." value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} />
              </div>
            </div>

            {!isOpenForAll && (
              <>
                {/* Chanting selection */}
                <div className="space-y-2">
                  <Button variant="outline" size="sm" onClick={() => setShowChants(!showChants)} className="gap-1">
                    📿 เลือกบทสวด ({selectedChantIds.size} บท)
                  </Button>
                  {showChants && (
                    <Card className="border-gold-subtle">
                      <CardContent className="pt-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {CHANT_CATEGORIES
                          .filter(cat => cat.type === 'ให้พร' || cat.type === ceremonyType)
                          .map(cat => (
                            <div key={cat.id} className="space-y-1">
                              <p className="text-xs font-semibold text-muted-foreground">{cat.name}</p>
                              <div className="grid grid-cols-2 gap-1 pl-2">
                                {cat.chants.map(ch => (
                                  <div key={ch.id} className="flex items-center gap-2">
                                    <Checkbox id={`adm-${ch.id}`} checked={selectedChantIds.has(ch.id)} onCheckedChange={() => toggleChant(ch.id)} />
                                    <Label htmlFor={`adm-${ch.id}`} className="text-xs cursor-pointer">{ch.name}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Specify monks */}
                <div className="space-y-2">
                  <Button variant="outline" size="sm" onClick={() => setShowMonkSelect(!showMonkSelect)} className="gap-1">
                    👤 เจาะจงพระ ({specifiedMonkIds.size} รูป)
                  </Button>
                  {showMonkSelect && (
                    <Card className="border-gold-subtle">
                      <CardContent className="pt-4 max-h-[300px] overflow-y-auto space-y-1">
                        {monks.map(m => (
                          <div key={m.id} className="flex items-center gap-2 p-1 rounded hover:bg-muted/50">
                            <Checkbox
                              id={`monk-${m.id}`}
                              checked={specifiedMonkIds.has(m.id)}
                              onCheckedChange={(checked) => {
                                setSpecifiedMonkIds(prev => {
                                  const next = new Set(prev);
                                  if (checked) next.add(m.id); else next.delete(m.id);
                                  return next;
                                });
                              }}
                            />
                            <Label htmlFor={`monk-${m.id}`} className="text-xs cursor-pointer">
                              {m.name} ({m.rank} · {m.building})
                            </Label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Suggested time & items */}
                <Card className="bg-muted/50 border-gold-subtle">
                  <CardContent className="pt-4 space-y-3">
                    <div>
                      <Label className="text-xs flex items-center gap-1"><Info className="h-3 w-3" /> แนะนำเรื่องเวลา</Label>
                      <Textarea placeholder={SUGGESTED_TIME[ceremonyType]} value={suggestedTime} onChange={(e) => setSuggestedTime(e.target.value)} rows={2} className="mt-1 text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1"><Package className="h-3 w-3" /> สิ่งที่ต้องเตรียม</Label>
                      <Textarea placeholder={SUGGESTED_ITEMS[ceremonyType]} value={suggestedItems} onChange={(e) => setSuggestedItems(e.target.value)} rows={3} className="mt-1 text-xs" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox id="admin-temple-prep" checked={needTemplePreparation} onCheckedChange={(c) => setNeedTemplePreparation(!!c)} />
                      <Label htmlFor="admin-temple-prep" className="text-xs cursor-pointer">ให้วัดเตรียมสังฆทาน (มีค่าใช้จ่ายเพิ่มเติม)</Label>
                    </div>
                    {needTemplePreparation && (
                      <Textarea placeholder="รายละเอียดสิ่งที่วัดต้องเตรียม..." value={templePreparationDetails} onChange={(e) => setTemplePreparationDetails(e.target.value)} rows={2} className="text-xs" />
                    )}
                  </CardContent>
                </Card>

                {/* Quota preview */}
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">โควตาสำหรับ {monkCount} รูป:</p>
                  <div className="flex flex-wrap gap-2">
                    {QUOTA_CONFIGS[monkCount] && (
                      <>
                        <Badge variant="gold">หัวนำสวด {QUOTA_CONFIGS[monkCount].lead}</Badge>
                        <Badge variant="maha">มหาเถระ {QUOTA_CONFIGS[monkCount].มหาเถระ}</Badge>
                        <Badge variant="thera">เถระ {QUOTA_CONFIGS[monkCount].เถระ}</Badge>
                        <Badge variant="majjhima">มัชฌิมะ {QUOTA_CONFIGS[monkCount].มัชฌิมะ}</Badge>
                        <Badge variant="navaka">นวกะ {QUOTA_CONFIGS[monkCount].นวกะ}</Badge>
                      </>
                    )}
                  </div>
                </div>

                <Button variant="gold" className="w-full gap-2" size="lg" onClick={handleGenerate}>
                  <Sparkles className="h-5 w-5" />
                  ให้ระบบจัดรายชื่อ
                </Button>
              </>
            )}

            {/* Open for All: direct create */}
            {isOpenForAll && (
              <Button variant="gold" className="w-full gap-2" size="lg" onClick={handleConfirmDraft}>
                <Globe className="h-5 w-5" />
                สร้างงานส่วนรวม (เช็กชื่อทั้งวัด)
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Draft Results (normal ceremony) */}
        {draftAssignments && !isOpenForAll && (
          <Card className="shadow-card border-gold-subtle animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                รายชื่อแบบร่าง — {ceremonyType} ({monkCount} รูป)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {draftAssignments.map((a, i) => (
                <div key={a.monk.id} className="flex items-center justify-between rounded-lg border bg-background p-3 animate-slide-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-sm">{i + 1}</span>
                    <div>
                      <p className="font-medium">{a.monk.name}</p>
                      <p className="text-xs text-muted-foreground">{a.monk.building} · พรรษา {a.monk.yearsOrdained} · คิว #{a.monk.queueScore}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rankBadgeVariant(a.monk.rank)}>{a.monk.rank}</Badge>
                    {a.role === 'หัวนำสวด' && <Badge variant="gold">🎵 หัวนำสวด</Badge>}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="gold" className="flex-1" onClick={handleConfirmDraft}>✅ ยืนยันและส่งให้หัวหน้าตึก</Button>
                <Button variant="outline" onClick={() => setDraftAssignments(null)}>ยกเลิก</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Ceremonies with Complete & History */}
        {ceremonies.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">📋 งานทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ceremonies.slice(0, 10).map(c => (
                <div key={c.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {c.isOpenForAll && <Globe className="h-4 w-4 text-accent" />}
                        {c.description || c.type} — {c.isOpenForAll ? 'ทั้งวัด' : `${c.monkCount} รูป`}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.requesterName} · {c.date}</p>
                    </div>
                    <Badge variant={
                      c.status === 'completed' ? 'default' :
                      c.status === 'confirmed' ? 'success' :
                      c.status === 'pending' ? 'warning' : 'outline'
                    }>
                      {c.status === 'completed' ? '✅ จบงาน' :
                       c.status === 'confirmed' ? 'ยืนยันแล้ว' :
                       c.status === 'pending' ? 'รออนุมัติ' : 'ร่าง'}
                    </Badge>
                  </div>
                  {/* Action buttons */}
                  {c.status !== 'completed' && (
                    <div className="flex gap-2">
                      {c.isOpenForAll && (
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => setManagingCeremony(c)}>
                          <UserCheck className="h-4 w-4" /> เช็กชื่อ
                        </Button>
                      )}
                      <Button variant="gold" size="sm" className="gap-1" onClick={() => handleCompleteCeremony(c)}>
                        <CheckCircle className="h-4 w-4" /> จบงาน & บันทึกประวัติ
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Monk List with History View */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              รายชื่อพระ — ดูประวัติการรับงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {monks.map(m => {
                const history = m.assignmentHistory || [];
                const attended = history.filter(h => h.status === 'attended').length;
                const rejected = history.filter(h => h.status !== 'attended').length;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setHistoryMonk(m)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant={rankBadgeVariant(m.rank)} className="text-[10px] shrink-0">{m.rank}</Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">{m.building} · คะแนนจิตพิสัย: {m.activityScore || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {history.length > 0 ? (
                        <>
                          <span className="text-xs text-success font-medium">✅ {attended}</span>
                          <span className="text-xs text-destructive font-medium">❌ {rejected}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">ยังไม่มีประวัติ</span>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Monk History Dialog */}
      <Dialog open={!!historyMonk} onOpenChange={() => setHistoryMonk(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-accent" />
              ประวัติการรับงาน — {historyMonk?.name}
            </DialogTitle>
          </DialogHeader>
          {historyMonk && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={rankBadgeVariant(historyMonk.rank)}>{historyMonk.rank}</Badge>
                <Badge variant="outline">พรรษา {historyMonk.yearsOrdained}</Badge>
                <Badge variant="outline">{historyMonk.building}</Badge>
                <Badge variant="outline">คะแนนจิตพิสัย: {historyMonk.activityScore || 0}</Badge>
              </div>
              {(historyMonk.assignmentHistory || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีประวัติการรับงาน</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">วันที่</TableHead>
                      <TableHead className="text-xs">ชื่องาน</TableHead>
                      <TableHead className="text-xs">หน้าที่</TableHead>
                      <TableHead className="text-xs text-center">สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(historyMonk.assignmentHistory || []).map((h, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{h.date}</TableCell>
                        <TableCell className="text-xs">{h.ceremonyName}</TableCell>
                        <TableCell className="text-xs">{h.role || '-'}</TableCell>
                        <TableCell className="text-center">
                          {h.status === 'attended' ? (
                            <Badge variant="success" className="text-[10px]">✅ ไปงาน</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">❌ เปลี่ยนตัว</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog for Communal Ceremony */}
      <Dialog open={!!managingCeremony} onOpenChange={() => setManagingCeremony(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-accent" />
              เช็กชื่องานส่วนรวม — {managingCeremony?.description || managingCeremony?.type}
            </DialogTitle>
          </DialogHeader>
          {managingCeremony && managingCeremony.checkInResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">เข้าร่วม: <strong className="text-success">{managingCeremony.checkInResults.filter(cr => cr.attended).length}</strong> / {managingCeremony.checkInResults.length} รูป</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const allChecked = managingCeremony.checkInResults!.every(cr => cr.attended);
                    const updatedCeremonies = ceremonies.map(c => {
                      if (c.id !== managingCeremony.id) return c;
                      return { ...c, checkInResults: c.checkInResults!.map(cr => ({ ...cr, attended: !allChecked })) };
                    });
                    setCeremonies(updatedCeremonies);
                    saveCeremonies(updatedCeremonies);
                    setManagingCeremony(updatedCeremonies.find(c => c.id === managingCeremony.id) || null);
                  }}>
                    {managingCeremony.checkInResults.every(cr => cr.attended) ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                {managingCeremony.checkInResults.map(cr => {
                  const monk = monks.find(m => m.id === cr.monkId);
                  if (!monk) return null;
                  return (
                    <div
                      key={cr.monkId}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none",
                        cr.attended ? "bg-success/10 border-success/30" : "bg-background hover:bg-muted/50"
                      )}
                      onClick={() => toggleCheckIn(managingCeremony.id, cr.monkId)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={rankBadgeVariant(monk.rank)} className="text-[10px]">{monk.rank}</Badge>
                        <div>
                          <p className="text-sm font-medium">{monk.name}</p>
                          <p className="text-[10px] text-muted-foreground">{monk.building}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-lg transition-all",
                        cr.attended ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {cr.attended ? '✅' : '❌'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="gold"
                className="w-full gap-2"
                size="lg"
                onClick={() => handleCompleteCeremony(managingCeremony)}
              >
                <CheckCircle className="h-5 w-5" />
                บันทึกจบงานส่วนรวม (+1 คะแนนจิตพิสัยผู้เข้าร่วม)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
