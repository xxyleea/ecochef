import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Field, Screen, Txt } from '@/components/ui';
import { C, Radius, Spacing } from '@/constants/theme';
import { isValidISODate } from '@/lib/dates';
import { useDrafts } from '@/lib/draft-store';
import { CATEGORY_EMOJI, useT } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import type { DraftItem, Storage } from '@/lib/types';

export default function Review() {
  const t = useT();
  const { drafts, notes, update, clear } = useDrafts();
  const addDrafts = useApp((s) => s.addDrafts);
  const [open, setOpen] = useState<string | null>(null);
  const included = drafts.filter((d) => d.include);
  const invalid = included.some((d) => !isValidISODate(d.expiresAt));

  const save = () => {
    addDrafts(drafts);
    clear();
    router.dismissAll();
    router.navigate('/pantry');
  };

  return (
    <>
      <Stack.Screen options={{ title: t.review }} />
      <Screen edges={['bottom']}>
        <Txt color={C.textMuted}>{t.reviewHint}</Txt>
        {notes ? (
          <Card tint={C.warnSoft}>
            <Txt variant="small" color={C.warn}>
              <Txt variant="small" color={C.warn} style={{ fontWeight: '700' }}>{`${t.notes}: `}</Txt>
              {notes}
            </Txt>
          </Card>
        ) : null}
        {drafts.length === 0 && <Txt>{t.nothingFound}</Txt>}
        <View style={{ gap: Spacing.sm }}>
          {drafts.map((d) => (
            <DraftCard key={d.key} d={d} open={open === d.key} onToggle={() => setOpen(open === d.key ? null : d.key)} onChange={(p) => update(d.key, p)} />
          ))}
        </View>
        <Button label={t.saveN(included.length)} onPress={save} disabled={included.length === 0 || invalid} />
      </Screen>
    </>
  );
}

function DraftCard({
  d,
  open,
  onToggle,
  onChange,
}: {
  d: DraftItem;
  open: boolean;
  onToggle: () => void;
  onChange: (p: Partial<DraftItem>) => void;
}) {
  const t = useT();
  const badDate = !isValidISODate(d.expiresAt);
  return (
    <View style={[styles.card, !d.include && { opacity: 0.45 }]}>
      <View style={styles.row}>
        <Pressable onPress={() => onChange({ include: !d.include })} hitSlop={10} accessibilityRole="checkbox" accessibilityState={{ checked: d.include }}>
          <Ionicons name={d.include ? 'checkbox' : 'square-outline'} size={24} color={C.brand} />
        </Pressable>
        <Txt style={{ fontSize: 22 }}>{CATEGORY_EMOJI[d.category]}</Txt>
        <Pressable style={{ flex: 1 }} onPress={onToggle}>
          <Txt variant="label" numberOfLines={1}>
            {d.name}
            {d.nameZh ? <Txt variant="small" color={C.textMuted}>{`  ${d.nameZh}`}</Txt> : null}
          </Txt>
          <Txt variant="caption" color={badDate ? C.danger : C.textMuted}>
            {d.quantity} {d.unit} · {t[d.storage]} · {t.expires} {d.expiresAt} ·{' '}
            {d.expirySource === 'label' ? t.fromLabel : `${t.estimated}${d.confidence !== undefined ? ` ${Math.round(d.confidence * 100)}%` : ''}`}
            {d.priceHKD !== undefined ? ` · $${d.priceHKD}` : ''}
          </Txt>
        </Pressable>
        <Pressable onPress={onToggle} hitSlop={10}>
          <Ionicons name={open ? 'chevron-up' : 'create-outline'} size={20} color={C.textMuted} />
        </Pressable>
      </View>
      {open && (
        <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
          <View style={styles.fields}>
            <Field label={t.name} value={d.name} onChangeText={(v) => onChange({ name: v })} />
            <Field label={t.nameZh} value={d.nameZh ?? ''} onChangeText={(v) => onChange({ nameZh: v })} />
          </View>
          <View style={styles.fields}>
            <Field label={t.quantity} value={String(d.quantity)} keyboardType="decimal-pad" onChangeText={(v) => onChange({ quantity: Number(v) || 0 })} />
            <Field label={t.unit} value={d.unit} onChangeText={(v) => onChange({ unit: v })} />
            <Field
              label={`${t.expires} (YYYY-MM-DD)`}
              value={d.expiresAt}
              onChangeText={(v) => onChange({ expiresAt: v, expirySource: 'manual' })}
              style={badDate ? { borderColor: C.danger } : undefined}
            />
          </View>
          <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
            {(['fridge', 'freezer', 'pantry'] as Storage[]).map((s) => (
              <Chip key={s} label={t[s]} active={d.storage === s} onPress={() => onChange({ storage: s })} />
            ))}
          </ScrollView>
          {d.storageTip ? <Txt variant="small" color={C.textMuted}>💡 {d.storageTip}</Txt> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: C.border, padding: Spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  fields: { flexDirection: 'row', gap: Spacing.sm },
});
