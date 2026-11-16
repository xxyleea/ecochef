import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, Chip, Field, Screen, Txt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { addDays, isValidISODate, todayISO } from '@/lib/dates';
import { CATEGORY_LABEL, useT } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import { CATEGORIES, type Category, type Storage } from '@/lib/types';

/** Rough default shelf life (days) when the user doesn't know the date. */
const DEFAULT_DAYS: Record<Category, number> = {
  produce: 4,
  meat: 2,
  seafood: 1,
  dairy: 7,
  eggs: 21,
  tofu: 4,
  bakery: 4,
  grains: 180,
  condiments: 180,
  snacks: 60,
  drinks: 30,
  frozen: 90,
  other: 7,
};

export default function AddItem() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const addItem = useApp((s) => s.addItem);
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState<Category>('produce');
  const [storage, setStorage] = useState<Storage>('fridge');
  const [expiry, setExpiry] = useState('');

  const effectiveExpiry = expiry || addDays(todayISO(), DEFAULT_DAYS[category]);
  const valid = name.trim().length > 0 && isValidISODate(effectiveExpiry);

  const save = () => {
    addItem({
      name: name.trim(),
      category,
      quantity: Number(qty) > 0 ? Number(qty) : 1,
      unit: unit || 'pcs',
      storage,
      expiresAt: effectiveExpiry,
      expirySource: expiry ? 'manual' : 'estimate',
    });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t.addManual }} />
      <Screen edges={['bottom']}>
        <Field label={t.name} value={name} onChangeText={setName} autoFocus placeholder="e.g. Broccoli / 西蘭花" />
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <Field label={t.quantity} value={qty} onChangeText={setQty} keyboardType="decimal-pad" />
          <Field label={t.unit} value={unit} onChangeText={setUnit} />
        </View>
        <Txt variant="caption">{t.category}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={CATEGORY_LABEL[lang][c]} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
        <Txt variant="caption">{t.storage}</Txt>
        <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: Spacing.sm }}>
          {(['fridge', 'freezer', 'pantry'] as Storage[]).map((s) => (
            <Chip key={s} label={t[s]} active={storage === s} onPress={() => setStorage(s)} />
          ))}
        </ScrollView>
        <Field
          label={`${t.expires} (YYYY-MM-DD)`}
          value={expiry}
          onChangeText={setExpiry}
          placeholder={effectiveExpiry}
        />
        <Button label={t.save} onPress={save} disabled={!valid} />
      </Screen>
    </>
  );
}
