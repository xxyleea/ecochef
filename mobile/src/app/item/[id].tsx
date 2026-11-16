import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Button, Card, Chip, Field, FreshnessBadge, Screen, Txt } from '@/components/ui';
import { C, Spacing } from '@/constants/theme';
import { isValidISODate } from '@/lib/dates';
import { CATEGORY_EMOJI, CATEGORY_LABEL, useT } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import type { Storage } from '@/lib/types';

export default function ItemDetail() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const lang = useApp((s) => s.lang);
  const item = useApp((s) => s.items.find((i) => i.id === id));
  const { consume, toss, moveTo, updateItem, remove } = useApp.getState();
  const [some, setSome] = useState('');
  const [expiry, setExpiry] = useState(item?.expiresAt ?? '');

  if (!item)
    return (
      <Screen>
        <Txt>—</Txt>
      </Screen>
    );
  const close = () => router.back();
  const title = lang === 'zh' && item.nameZh ? item.nameZh : item.name;
  const sub = lang === 'zh' ? item.name : item.nameZh;

  return (
    <>
      <Stack.Screen options={{ title }} />
      <Screen edges={['bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <Txt style={{ fontSize: 44, lineHeight: 52 }}>{CATEGORY_EMOJI[item.category]}</Txt>
          <View style={{ flex: 1 }}>
            <Txt variant="h2">{title}</Txt>
            {sub ? <Txt color={C.textMuted}>{sub}</Txt> : null}
            <Txt variant="caption">
              {CATEGORY_LABEL[lang][item.category]} · {item.quantity} {item.unit}
              {item.priceHKD !== undefined ? ` · HK$${item.priceHKD}` : ''}
            </Txt>
          </View>
          <FreshnessBadge expiresAt={item.expiresAt} />
        </View>

        {item.status === 'active' && (
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Button
              style={{ flex: 1 }}
              label={t.used}
              onPress={() => {
                consume(item.id);
                close();
              }}
            />
            <Button
              style={{ flex: 1 }}
              label={t.tossed}
              kind="danger"
              onPress={() => {
                toss(item.id);
                close();
              }}
            />
          </View>
        )}

        {item.status === 'active' && item.quantity > 1 && (
          <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' }}>
            <Field
              label={`${t.usedSome} (${item.unit})`}
              value={some}
              onChangeText={setSome}
              keyboardType="decimal-pad"
              placeholder="1"
            />
            <Button
              label={t.usedSome}
              kind="secondary"
              disabled={!(Number(some) > 0)}
              onPress={() => {
                consume(item.id, Number(some));
                setSome('');
              }}
            />
          </View>
        )}

        {item.storageTip ? (
          <Card tint={C.brandSoft}>
            <Txt variant="caption" color={C.brand} style={{ fontWeight: '700' }}>
              {t.tip}
            </Txt>
            <Txt>{item.storageTip}</Txt>
          </Card>
        ) : null}

        <Card style={{ gap: Spacing.md }}>
          <Txt variant="caption">
            {t.expires}: {item.expiresAt} ·{' '}
            {item.expirySource === 'label' ? t.fromLabel : item.expirySource === 'manual' ? t.manual : t.estimated}
          </Txt>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' }}>
            <Field label={`${t.expires} (YYYY-MM-DD)`} value={expiry} onChangeText={setExpiry} />
            <Button
              label={t.save}
              kind="secondary"
              disabled={!isValidISODate(expiry) || expiry === item.expiresAt}
              onPress={() => updateItem(item.id, { expiresAt: expiry, expirySource: 'manual' })}
            />
          </View>
          <Txt variant="caption">{t.storage}</Txt>
          <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: Spacing.sm }}>
            {(['fridge', 'freezer', 'pantry'] as Storage[]).map((s) => (
              <Chip
                key={s}
                label={t[s]}
                active={item.storage === s}
                onPress={() => {
                  moveTo(item.id, s);
                  const next = useApp.getState().items.find((i) => i.id === item.id)?.expiresAt;
                  if (next) setExpiry(next);
                }}
              />
            ))}
          </ScrollView>
        </Card>

        {item.status === 'active' && (
          <Button
            label={t.freshTitle}
            kind="secondary"
            onPress={() => router.push({ pathname: '/check/[id]', params: { id: item.id } })}
          />
        )}

        <Button
          label={t.delete}
          kind="ghost"
          onPress={() => {
            remove(item.id);
            close();
          }}
        />
      </Screen>
    </>
  );
}
