import { StyleSheet, View } from 'react-native';

import { Card, Screen, SectionHeader, Txt } from '@/components/ui';
import { C, Radius, Spacing } from '@/constants/theme';
import { CATEGORY_EMOJI, useT } from '@/lib/i18n';
import { computeStats } from '@/lib/stats';
import { useApp } from '@/lib/store';

export default function Impact() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const items = useApp((s) => s.items);
  const s = computeStats(items);
  const closed = s.used + s.wasted;

  return (
    <Screen>
      <Txt variant="title">{t.impactTitle}</Txt>

      <Card tint={C.mint} style={{ gap: Spacing.sm }}>
        <Txt variant="caption" color={C.mintInk} style={{ fontWeight: '700' }}>
          {t.useRate}
        </Txt>
        <Txt style={{ fontSize: 44, lineHeight: 50, fontWeight: '800' }} color={C.mintInk}>
          {closed ? `${Math.round(s.useRate * 100)}%` : '—'}
        </Txt>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(s.useRate * 100)}%` }]} />
        </View>
      </Card>

      <View style={styles.grid}>
        <Stat label={t.itemsUsed} value={String(s.used)} />
        <Stat label={t.itemsTossed} value={String(s.wasted)} />
        <Stat label={t.moneySaved} value={`HK$${Math.round(s.valueUsed)}`} />
        <Stat label={t.co2} value={`${s.co2} kg`} />
      </View>
      <Txt variant="caption">{t.co2Note}</Txt>

      <SectionHeader title={t.recent} />
      {s.recent.length === 0 ? (
        <Txt color={C.textMuted}>{t.noHistory}</Txt>
      ) : (
        <View style={{ gap: Spacing.xs }}>
          {s.recent.map((i) => (
            <View key={i.id} style={styles.recentRow}>
              <Txt>{CATEGORY_EMOJI[i.category]}</Txt>
              <Txt style={{ flex: 1 }} numberOfLines={1}>
                {lang === 'zh' && i.nameZh ? i.nameZh : i.name}
              </Txt>
              <Txt variant="small" color={i.status === 'used' ? C.ok : C.danger} style={{ fontWeight: '700' }}>
                {i.status === 'used' ? t.used : t.tossed}
              </Txt>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <Txt variant="caption">{label}</Txt>
      <Txt variant="h2">{value}</Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: Radius.pill, backgroundColor: '#ffffff99', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: C.mintInk, borderRadius: Radius.pill },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  stat: { flexBasis: '46%', flexGrow: 1, gap: 4 },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
});
