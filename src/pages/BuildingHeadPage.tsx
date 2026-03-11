import { useState, useEffect } from 'react';
import { Ceremony, Assignment, Monk, REJECTION_REASONS } from '@/lib/types';
import { processApproval, findSubstitute } from '@/lib/queueEngine';
import { loadMonks, saveMonks, loadCeremonies, saveCeremonies } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, AlertTriangle, MapPin, BookOpen } from 'lucide-react';

const rankBadgeVariant = (rank: string) => {
  switch (rank) {
    case 'มหาเถระ': return 'maha' as const;
    case 'เถระ': return 'thera' as const;
    case 'มัชฌิมะ': return 'majjhima' as const;
    case 'นวกะ': return 'navaka' as const;
    default: return 'default' as const;
  }
};

export default function BuildingHeadPage() {
  const navigate = useNavigate();
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [monks, setMonks] = useState<Monk[]>([]);
  const [selectedCeremony, setSelectedCeremony] = useState<Ceremony | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [customReasons, setCustomReasons] = useState<Record<string, string>>({});
  const [sermonTopics, setSermonTopics] = useState<Record<string, string>>({});

  useEffect(() => {
    setCeremonies(loadCeremonies());
    setMonks(loadMonks());
  }, []);

  const pendingCeremonies = ceremonies.filter(c => c.status === 'pending');

  const handleAction = (ceremonyId: string, monkId: string, action: 'approve' | 'sick' | 'skip') => {
    let updatedMonks = processApproval(monks, monkId, action);

    const reason = action === 'approve' ? undefined :
      (rejectReasons[monkId] === 'อื่นๆ' ? customReasons[monkId] : rejectReasons[monkId]) || (action === 'sick' ? 'อาพาธ/ติดสอบ' : 'สละสิทธิ์');

    const updatedCeremonies = ceremonies.map(c => {
      if (c.id !== ceremonyId) return c;

      const updatedAssignments = c.assignments.map(a => {
        if (a.monk.id !== monkId) return a;

        if (action === 'approve') {
          const sermon = sermonTopics[monkId];
          return { ...a, status: 'approved' as const, sermonTopic: sermon || undefined };
        }

        const excludeIds = new Set(c.assignments.map(x => x.monk.id));
        const sub = findSubstitute(updatedMonks, c.type, excludeIds, a.monk.rank);

        if (action === 'sick') {
          return { ...a, status: 'rejected_sick' as const, rejectReason: reason, substitute: sub || undefined };
        }

        return { ...a, status: 'rejected_skip' as const, rejectReason: reason, substitute: sub || undefined };
      });

      const allResolved = updatedAssignments.every(
        a => a.status === 'approved' || a.status === 'rejected_sick' || a.status === 'rejected_skip'
      );

      return { ...c, assignments: updatedAssignments, status: allResolved ? 'confirmed' as const : c.status };
    });

    setMonks(updatedMonks);
    saveMonks(updatedMonks);
    setCeremonies(updatedCeremonies);
    saveCeremonies(updatedCeremonies);

    const updated = updatedCeremonies.find(c => c.id === ceremonyId);
    if (updated) setSelectedCeremony(updated);

    const msgs = {
      approve: '✅ อนุมัติเรียบร้อย — ย้ายไปท้ายคิว',
      sick: '🏥 เปลี่ยนตัว (อาพาธ) — แช่แข็งที่หัวคิว',
      skip: '⚠️ สละสิทธิ์ — ลงโทษย้ายไปท้ายคิว',
    };
    toast.success(msgs[action]);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-maroon px-4 py-6 shadow-lg">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <span className="text-xl">🏛️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-cream">หัวหน้าตึก</h1>
              <p className="text-sm text-cream/70">ตรวจสอบและอนุมัติรายชื่อ</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Button>

        {!selectedCeremony ? (
          <>
            <h2 className="text-lg font-semibold">งานรออนุมัติ ({pendingCeremonies.length})</h2>
            {pendingCeremonies.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p className="text-lg">ไม่มีงานรออนุมัติ</p>
                  <p className="text-sm mt-1">กรุณาสร้างงานจากหน้า Admin ก่อน</p>
                </CardContent>
              </Card>
            ) : (
              pendingCeremonies.map(c => (
                <Card key={c.id} className="shadow-card cursor-pointer hover:shadow-gold transition-shadow border-gold-subtle" onClick={() => setSelectedCeremony(c)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{c.type} — {c.monkCount} รูป</p>
                        <p className="text-sm text-muted-foreground">{c.requesterName} · {c.date} {c.time && `· ${c.time}`}</p>
                        {c.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {c.location}
                            {c.locationUrl && (
                              <a href={c.locationUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline ml-1" onClick={(e) => e.stopPropagation()}>
                                ดูแผนที่
                              </a>
                            )}
                          </p>
                        )}
                      </div>
                      <Badge variant="warning">รออนุมัติ</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCeremony(null)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> กลับ
              </Button>
              <Badge variant={selectedCeremony.status === 'confirmed' ? 'success' : 'warning'}>
                {selectedCeremony.status === 'confirmed' ? '✅ ยืนยันครบแล้ว' : '⏳ รออนุมัติ'}
              </Badge>
            </div>

            <Card className="shadow-card border-gold-subtle">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{selectedCeremony.type} — {selectedCeremony.monkCount} รูป</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedCeremony.requesterName} · {selectedCeremony.description}
                  {selectedCeremony.time && ` · ${selectedCeremony.time}`}
                </p>
                {selectedCeremony.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {selectedCeremony.location}
                    {selectedCeremony.locationUrl && (
                      <a href={selectedCeremony.locationUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">ดูแผนที่</a>
                    )}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedCeremony.assignments.map((a, i) => (
                  <div
                    key={a.monk.id}
                    className={`rounded-lg border p-4 animate-fade-in ${
                      a.status === 'approved' ? 'bg-success/5 border-success/30' :
                      a.status === 'rejected_sick' ? 'bg-warning/5 border-warning/30' :
                      a.status === 'rejected_skip' ? 'bg-destructive/5 border-destructive/30' :
                      'bg-background'
                    }`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-bold">{i + 1}</span>
                        <div>
                          <p className="font-medium">{a.monk.name}</p>
                          <p className="text-xs text-muted-foreground">{a.monk.building} · พรรษา {a.monk.yearsOrdained}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={rankBadgeVariant(a.monk.rank)}>{a.monk.rank}</Badge>
                        {a.role === 'หัวนำสวด' && <Badge variant="gold">🎵</Badge>}
                      </div>
                    </div>

                    {/* Sermon topic for lead chanter */}
                    {a.role === 'หัวนำสวด' && a.status === 'pending' && (
                      <div className="mb-3 space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> เทศน์บทอะไร
                        </Label>
                        <Input
                          placeholder="ระบุบทเทศน์..."
                          value={sermonTopics[a.monk.id] || ''}
                          onChange={(e) => setSermonTopics(prev => ({ ...prev, [a.monk.id]: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                    )}

                    {a.status === 'pending' && (
                      <div className="space-y-2 mt-3">
                        {/* Rejection reason dropdown */}
                        <div className="flex gap-2">
                          <Select
                            value={rejectReasons[a.monk.id] || ''}
                            onValueChange={(v) => setRejectReasons(prev => ({ ...prev, [a.monk.id]: v }))}
                          >
                            <SelectTrigger className="flex-1 text-xs h-8">
                              <SelectValue placeholder="เลือกเหตุผล (กรณีเปลี่ยนตัว)" />
                            </SelectTrigger>
                            <SelectContent>
                              {REJECTION_REASONS.map(r => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {rejectReasons[a.monk.id] === 'อื่นๆ' && (
                          <Input
                            placeholder="ระบุเหตุผล..."
                            value={customReasons[a.monk.id] || ''}
                            onChange={(e) => setCustomReasons(prev => ({ ...prev, [a.monk.id]: e.target.value }))}
                            className="text-xs h-8"
                          />
                        )}

                        <div className="flex gap-2">
                          <Button variant="success" size="sm" className="flex-1 gap-1" onClick={() => handleAction(selectedCeremony.id, a.monk.id, 'approve')}>
                            <CheckCircle className="h-4 w-4" /> อนุมัติ
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleAction(selectedCeremony.id, a.monk.id, 'sick')}>
                            🏥 อาพาธ/ติดสอบ
                          </Button>
                          <Button variant="destructive" size="sm" className="gap-1" onClick={() => handleAction(selectedCeremony.id, a.monk.id, 'skip')}>
                            <XCircle className="h-4 w-4" /> สละสิทธิ์
                          </Button>
                        </div>
                      </div>
                    )}

                    {(a.status === 'rejected_sick' || a.status === 'rejected_skip') && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-1 text-sm">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <span className="text-muted-foreground">เหตุผล: {a.rejectReason}</span>
                        </div>
                        {a.substitute && (
                          <div className="flex items-center gap-2 rounded bg-muted p-2">
                            <RefreshCw className="h-4 w-4 text-accent" />
                            <span className="text-sm font-medium">ตัวแทน: {a.substitute.name}</span>
                            <Badge variant={rankBadgeVariant(a.substitute.rank)} className="text-xs">{a.substitute.rank}</Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {a.status === 'approved' && (
                      <div className="mt-1">
                        <p className="text-sm text-success flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" /> อนุมัติแล้ว
                        </p>
                        {a.sermonTopic && (
                          <p className="text-xs text-muted-foreground mt-1">📖 เทศน์: {a.sermonTopic}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
