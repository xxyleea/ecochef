import { Stack } from 'expo-router';
import { useState } from 'react';
import { Switch, View } from 'react-native';

import { Button, Card, Chip, Screen, Txt } from '@/components/ui';
import { C, Spacing } from '@/constants/theme';
import { useT } from '@/lib/i18n';
import { useApp } from '@/lib/store';

export default function Settings() {
  const t = useT();
  const { lang, remindersOn, setLang, setReminders, clearAll } = useApp();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: t.settings }} />
      <Screen edges={['bottom']}>
        <Card style={{ gap: Spacing.md }}>
          <Txt variant="label">{t.language}</Txt>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Chip label="English" active={lang === 'en'} onPress={() => setLang('en')} />
            <Chip label="繁體中文" active={lang === 'zh'} onPress={() => setLang('zh')} />
          </View>
        </Card>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <View style={{ flex: 1 }}>
            <Txt variant="label">{t.reminders}</Txt>
            <Txt variant="caption">{t.remindersSub}</Txt>
          </View>
          <Switch value={remindersOn} onValueChange={setReminders} trackColor={{ true: C.brand }} />
        </Card>
        {confirming ? (
          <Card tint={C.dangerSoft} style={{ gap: Spacing.md }}>
            <Txt color={C.danger}>{t.clearConfirm}</Txt>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button
                label={t.delete}
                kind="danger"
                onPress={() => {
                  clearAll();
                  setConfirming(false);
                }}
              />
              <Button label={t.cancel} kind="ghost" onPress={() => setConfirming(false)} />
            </View>
          </Card>
        ) : (
          <Button label={t.clearData} kind="ghost" onPress={() => setConfirming(true)} />
        )}
      </Screen>
    </>
  );
}
