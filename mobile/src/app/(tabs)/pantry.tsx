import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ItemRow } from '@/components/item-row';
import { Chip, Screen, Txt } from '@/components/ui';
import { C, Spacing } from '@/constants/theme';
import { useT } from '@/lib/i18n';
import { activeItems, useApp } from '@/lib/store';
import type { Storage } from '@/lib/types';

export default function Pantry() {
  const t = useT();
  const items = useApp((s) => s.items);
  const [filter, setFilter] = useState<Storage | 'all'>('all');
  const active = activeItems(items);
  const shown = filter === 'all' ? active : active.filter((i) => i.storage === filter);
  const count = (s: Storage) => active.filter((i) => i.storage === s).length;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Txt variant="title">{t.tabPantry}</Txt>
        <Pressable onPress={() => router.push('/add')} hitSlop={12} accessibilityLabel={t.addManual}>
          <Ionicons name="add-circle" size={32} color={C.brand} />
        </Pressable>
      </View>
      <ScrollView horizontal style={{ flexGrow: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
        <Chip label={`${t.all} ${active.length}`} active={filter === 'all'} onPress={() => setFilter('all')} />
        {(['fridge', 'freezer', 'pantry'] as Storage[]).map((s) => (
          <Chip key={s} label={`${t[s]} ${count(s)}`} active={filter === s} onPress={() => setFilter(s)} />
        ))}
      </ScrollView>
      <View style={{ gap: Spacing.sm }}>
        {shown.length === 0 ? (
          <Txt color={C.textMuted}>{t.emptyPantryBody}</Txt>
        ) : (
          shown.map((i) => <ItemRow key={i.id} item={i} />)
        )}
      </View>
    </Screen>
  );
}
