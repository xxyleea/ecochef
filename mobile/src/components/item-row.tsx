import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { C, Radius, Spacing } from '@/constants/theme';
import { CATEGORY_EMOJI, useT } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import type { Item } from '@/lib/types';

import { FreshnessBadge, Txt } from './ui';

export function ItemRow({ item }: { item: Item }) {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const primary = lang === 'zh' && item.nameZh ? item.nameZh : item.name;
  const secondary = lang === 'zh' ? item.name : item.nameZh;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={styles.emoji}>
        <Txt style={{ fontSize: 22 }}>{CATEGORY_EMOJI[item.category] ?? '🍽️'}</Txt>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="label" numberOfLines={1}>
          {primary}
          {secondary ? <Txt variant="small" color={C.textMuted}>{`  ${secondary}`}</Txt> : null}
        </Txt>
        <Txt variant="caption" numberOfLines={1}>
          {item.quantity} {item.unit} · {t[item.storage]}
          {item.expirySource === 'estimate' ? ` · ${t.estimated}` : ''}
        </Txt>
      </View>
      <FreshnessBadge expiresAt={item.expiresAt} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: C.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  emoji: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
