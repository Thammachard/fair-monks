import { useState, useEffect } from 'react';
import { Monk, RANK_ORDER } from '@/lib/types';
import { loadMonks } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Snowflake } from 'lucide-react';

const rankBadgeVariant = (rank: string) => {
  switch (rank) {
    case 'มหาเถระ': return 'maha' as const;
    case 'เถระ': return 'thera' as const;
    case 'มัชฌิมะ': return 'majjhima' as const;
    case 'นวกะ': return 'navaka' as const;
    default: return 'default' as const;
  }
};

export default function QueuePage() {
  const navigate = useNavigate();
  const [monks, setMonks] = useState<Monk[]>([]);
  const [filterRank, setFilterRank] = useState<string>('all');

  useEffect(() => {
    setMonks(loadMonks());
  }, []);

  const sorted = [...monks]
    .filter(m => filterRank === 'all' || m.rank === filterRank)
    .sort((a, b) => a.queueScore - b.queueScore);

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-maroon px-4 py-6 shadow-lg">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-cream">ลำดับคิวพระ</h1>
              <p className="text-sm text-cream/70">เรียงตามลำดับความยุติธรรม</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-4">
        <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {RANK_ORDER.map(rank => {
            const count = monks.filter(m => m.rank === rank).length;
            return (
              <Card key={rank} className="shadow-card text-center cursor-pointer hover:shadow-gold transition-shadow"
                onClick={() => setFilterRank(filterRank === rank ? 'all' : rank)}>
                <CardContent className="py-3 px-2">
                  <p className="text-2xl font-bold">{count}</p>
                  <Badge variant={rankBadgeVariant(rank)} className="text-xs mt-1">{rank}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Queue List */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>คิว {filterRank !== 'all' ? filterRank : 'ทั้งหมด'} ({sorted.length} รูป)</span>
              {filterRank !== 'all' && (
                <Button variant="ghost" size="sm" onClick={() => setFilterRank('all')}>ดูทั้งหมด</Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {sorted.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm animate-slide-in ${
                  m.isFrozen ? 'bg-muted border-ring/30' : 'bg-background'
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-mono text-muted-foreground">{i + 1}</span>
                  <span className="font-medium">{m.name}</span>
                  {m.isFrozen && <Snowflake className="h-3 w-3 text-blue-500" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">งาน {m.totalAssignments}</span>
                  <Badge variant={rankBadgeVariant(m.rank)} className="text-xs">{m.rank}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">#{m.queueScore}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
