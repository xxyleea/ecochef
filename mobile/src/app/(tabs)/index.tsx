import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ItemRow } from '@/components/item-row';
import { Button, Card, Screen, SectionHeader, Txt } from '@/components/ui';
import { C, Radius, Spacing } from '@/constants/theme';
import { daysUntil } from '@/lib/dates';
import { useDrafts } from '@/lib/draft-store';
import { useT } from '@/lib/i18n';
import { sampleDrafts } from '@/lib/seed';
import { activeItems, useApp } from '@/lib/store';

export default function Home() {
  const t = useT();
  const items = useApp((s) => s.items);
  const active = activeItems(items);
  const soon = active.filter((i) => daysUntil(i.expiresAt) <= 3);

  const loadSample = () => {
    useDrafts.getState().set('sample', sampleDrafts(), null);
    router.push('/review');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color={C.brand} style={{ fontWeight: '700', letterSpacing: 1 }}>
            ECOCHEF
          </Txt>
          <Txt variant="title">{t.greeting}</Txt>
        </View>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12} accessibilityLabel={t.settings}>
          <Ionicons name="settings-outline" size={24} color={C.text} />
        </Pressable>
      </View>

      <Pressable onPress={() => router.push('/chat')} style={({ pressed }) => [styles.ask, pressed && { opacity: 0.8 }]}>
        <Ionicons name="sparkles" size={18} color={C.brand} />
        <Txt color={C.textMuted} style={{ flex: 1 }}>
          {t.askPlaceholder}
        </Txt>
      </Pressable>

      <View style={styles.grid}>
        <FeatureCard tint={C.pink} ink={C.pinkInk} emoji="🧾" title={t.scanReceipt} sub={t.scanReceiptSub} onPress={() => router.push({ pathname: '/scan', params: { mode: 'receipt' } })} />
        <FeatureCard tint={C.sky} ink={C.skyInk} emoji="🥬" title={t.tabPantry} sub={`${active.length}`} onPress={() => router.push('/pantry')} />
        <FeatureCard tint={C.butter} ink={C.butterInk} emoji="🍳" title={t.tabCook} sub={t.recipesSub} onPress={() => router.push('/cook')} />
        <FeatureCard tint={C.mint} ink={C.mintInk} emoji="🌱" title={t.tabImpact} sub={t.impactTitle} onPress={() => router.push('/impact')} />
      </View>

      {active.length === 0 ? (
        <Card style={{ gap: Spacing.md, alignItems: 'flex-start' }}>
          <Txt variant="h3">{t.emptyPantryTitle}</Txt>
          <Txt color={C.textMuted}>{t.emptyPantryBody}</Txt>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
            <Button label={t.tabScan} onPress={() => router.push('/scan')} />
            <Button label={t.loadSample} kind="secondary" onPress={loadSample} />
          </View>
        </Card>
      ) : (
        <View style={{ gap: Spacing.sm }}>
          <SectionHeader
            title={`${t.useSoon} (${soon.length})`}
            action={
              <Pressable onPress={() => router.push('/pantry')} hitSlop={8}>
                <Txt variant="small" color={C.brand} style={{ fontWeight: '700' }}>
                  {t.seeAll}
                </Txt>
              </Pressable>
            }
          />
          {soon.length === 0 ? (
            <Txt color={C.textMuted}>{t.nothingExpiring}</Txt>
          ) : (
            soon.slice(0, 6).map((i) => <ItemRow key={i.id} item={i} />)
          )}
        </View>
      )}
    </Screen>
  );
}

function FeatureCard({
  tint,
  ink,
  emoji,
  title,
  sub,
  onPress,
}: {
  tint: string;
  ink: string;
  emoji: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.feature, { backgroundColor: tint }, pressed && { opacity: 0.8 }]}>
      <Txt variant="h3" color={ink}>
        {title}
      </Txt>
      <Txt variant="caption" color={ink} numberOfLines={2}>
        {sub}
      </Txt>
      <Txt style={styles.featureEmoji}>{emoji}</Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 13,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  feature: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 130,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: 4,
    overflow: 'hidden',
  },
  featureEmoji: { fontSize: 48, lineHeight: 56, position: 'absolute', right: 12, bottom: 6 },
});
