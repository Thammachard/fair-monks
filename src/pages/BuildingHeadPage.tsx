import { useState, useEffect } from 'react';
import { Ceremony, Assignment, Monk } from '@/lib/types';
import { processApproval, findSubstitute } from '@/lib/queueEngine';
import { loadMonks, saveMonks, loadCeremonies, saveCeremonies } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle, XCircle, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

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

  useEffect(() => {
    setCeremonies(loadCeremonies());
    setMonks(loadMonks());
  }, []);

  const pendingCeremonies = ceremonies.filter(c => c.status === 'pending');

  const handleAction = (ceremonyId: string, monkId: string, action: 'approve' | 'sick' | 'skip') => {
    let updatedMonks = processApproval(monks, monkId, action);
    
    const updatedCeremonies = ceremonies.map(c => {
      if (c.id !== ceremonyId) return c;
      
      const updatedAssignments = c.assignments.map(a => {
        if (a.monk.id !== monkId) return a;
        
        if (action === 'approve') {
          return { ...a, status: 'approved' as const };
        }
        
        // Find substitute
        const excludeIds = new Set(c.assignments.map(x => x.monk.id));
        const sub = findSubstitute(updatedMonks, c.type, excludeIds, a.monk.rank);
        
        if (action === 'sick') {
          return {
            ...a,
            status: 'rejected_sick' as const,
            rejectReason: 'อาพาธ/ติดสอบ',
            substitute: sub || undefined,
          };
        }
        
        // skip
        return {
          ...a,
          status: 'rejected_skip' as const,
          rejectReason: 'สละสิทธิ์',
          substitute: sub || undefined,
        };
      });
      
      // Check if all resolved
      const allResolved = updatedAssignments.every(
        a => a.status === 'approved' || a.status === 'rejected_sick' || a.status === 'rejected_skip'
      );
      
      return {
        ...c,
        assignments: updatedAssignments,
        status: allResolved ? 'confirmed' as const : c.status,
      };
    });

    setMonks(updatedMonks);
    saveMonks(updatedMonks);
    setCeremonies(updatedCeremonies);
    saveCeremonies(updatedCeremonies);
    
    // Update selected ceremony
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
          <ArrowLeft className="h-4 w-4" /> กลับหน้าแอดมิน
        </Button>

        {!selectedCeremony ? (
          <>
            <h2 className="text-lg font-semibold">งานรออนุมัติ ({pendingCeremonies.length})</h2>
            {pendingCeremonies.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p className="text-lg">ไม่มีงานรออนุมัติ</p>
                  <p className="text-sm mt-1">กรุณาสร้างงานจากหน้าแอดมินก่อน</p>
                </CardContent>
              </Card>
            ) : (
              pendingCeremonies.map(c => (
                <Card
                  key={c.id}
                  className="shadow-card cursor-pointer hover:shadow-gold transition-shadow border-gold-subtle"
                  onClick={() => setSelectedCeremony(c)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{c.type} — {c.monkCount} รูป</p>
                      <p className="text-sm text-muted-foreground">{c.requesterName} · {c.date}</p>
                    </div>
                    <Badge variant="warning">รออนุมัติ</Badge>
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
                <CardTitle className="text-lg">
                  {selectedCeremony.type} — {selectedCeremony.monkCount} รูป
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedCeremony.requesterName} · {selectedCeremony.description}
                </p>
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
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-bold">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-medium">{a.monk.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.monk.building} · พรรษา {a.monk.yearsOrdained}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={rankBadgeVariant(a.monk.rank)}>{a.monk.rank}</Badge>
                        {a.role === 'หัวนำสวด' && <Badge variant="gold">🎵</Badge>}
                      </div>
                    </div>

                    {a.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="success"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => handleAction(selectedCeremony.id, a.monk.id, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4" /> อนุมัติ
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleAction(selectedCeremony.id, a.monk.id, 'sick')}
                        >
                          🏥 อาพาธ/ติดสอบ
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleAction(selectedCeremony.id, a.monk.id, 'skip')}
                        >
                          <XCircle className="h-4 w-4" /> สละสิทธิ์
                        </Button>
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
                            <Badge variant={rankBadgeVariant(a.substitute.rank)} className="text-xs">
                              {a.substitute.rank}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {a.status === 'approved' && (
                      <p className="text-sm text-success mt-1 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> อนุมัติแล้ว
                      </p>
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
