import { useState } from 'react';
import { CeremonyType, Ceremony, Assignment, QUOTA_CONFIGS } from '@/lib/types';
import { generateAssignments } from '@/lib/queueEngine';
import { loadMonks, saveMonks, loadCeremonies, saveCeremonies } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Calendar, Sparkles, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

export default function AdminPage() {
  const navigate = useNavigate();
  const [ceremonyType, setCeremonyType] = useState<CeremonyType>('มงคล');
  const [monkCount, setMonkCount] = useState<number>(5);
  const [requesterName, setRequesterName] = useState('');
  const [description, setDescription] = useState('');
  const [draftAssignments, setDraftAssignments] = useState<Assignment[] | null>(null);
  const [ceremonies, setCeremonies] = useState(() => loadCeremonies());

  const handleGenerate = () => {
    const monks = loadMonks();
    try {
      const assignments = generateAssignments(monks, ceremonyType, monkCount);
      setDraftAssignments(assignments);
      toast.success('จัดรายชื่อสำเร็จ!');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleConfirmDraft = () => {
    if (!draftAssignments) return;
    const newCeremony: Ceremony = {
      id: `c${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: ceremonyType,
      monkCount,
      requesterName: requesterName || 'ไม่ระบุ',
      description: description || '-',
      assignments: draftAssignments.map(a => ({ ...a, status: 'pending' })),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    const updated = [newCeremony, ...ceremonies];
    setCeremonies(updated);
    saveCeremonies(updated);
    setDraftAssignments(null);
    setRequesterName('');
    setDescription('');
    toast.success('ส่งรายชื่อไปยังหัวหน้าตึกเรียบร้อย');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
        <div className="flex gap-2">
          <Button variant="gold" size="sm" className="gap-1">
            <FileText className="h-4 w-4" /> แอดมิน
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/building-head')}>
            หัวหน้าตึก <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/queue')}>
            <Users className="h-4 w-4" /> ดูคิว
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/history')}>
            <Clock className="h-4 w-4" /> ประวัติงาน
          </Button>
        </div>

        {/* Create Ceremony Form */}
        <Card className="shadow-card border-gold-subtle animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-accent" />
              สร้างงานกิจนิมนต์ใหม่
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ประเภทงาน</Label>
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
                <Label>จำนวนพระ</Label>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อเจ้าภาพ</Label>
                <Input
                  placeholder="ระบุชื่อเจ้าภาพ"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>รายละเอียด</Label>
                <Input
                  placeholder="บ้าน, สถานที่, เวลา"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

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
          </CardContent>
        </Card>

        {/* Draft Results */}
        {draftAssignments && (
          <Card className="shadow-card border-gold-subtle animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                รายชื่อแบบร่าง — {ceremonyType} ({monkCount} รูป)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {draftAssignments.map((a, i) => (
                <div
                  key={a.monk.id}
                  className="flex items-center justify-between rounded-lg border bg-background p-3 animate-slide-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-sm">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium">{a.monk.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.monk.building} · พรรษา {a.monk.yearsOrdained} · คิว #{a.monk.queueScore}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rankBadgeVariant(a.monk.rank)}>{a.monk.rank}</Badge>
                    {a.role === 'หัวนำสวด' && <Badge variant="gold">🎵 หัวนำสวด</Badge>}
                  </div>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <Button variant="gold" className="flex-1" onClick={handleConfirmDraft}>
                  ✅ ยืนยันและส่งให้หัวหน้าตึก
                </Button>
                <Button variant="outline" onClick={() => setDraftAssignments(null)}>
                  ยกเลิก
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Ceremonies */}
        {ceremonies.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">📋 งานล่าสุด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ceremonies.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{c.type} — {c.monkCount} รูป</p>
                    <p className="text-xs text-muted-foreground">
                      {c.requesterName} · {c.date}
                    </p>
                  </div>
                  <Badge variant={c.status === 'confirmed' ? 'success' : c.status === 'pending' ? 'warning' : 'outline'}>
                    {c.status === 'confirmed' ? 'ยืนยันแล้ว' : c.status === 'pending' ? 'รออนุมัติ' : 'ร่าง'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
