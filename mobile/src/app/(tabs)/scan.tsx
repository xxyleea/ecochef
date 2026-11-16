import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Txt } from '@/components/ui';
import { C, Radius, Spacing } from '@/constants/theme';
import { scanPhoto } from '@/lib/api';
import { useDrafts } from '@/lib/draft-store';
import { useT } from '@/lib/i18n';
import type { ScanMode } from '@/lib/types';

export default function Scan() {
  const t = useT();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [picked, setMode] = useState<ScanMode | null>(null);
  const fromParam = params.mode === 'receipt' || params.mode === 'haul' || params.mode === 'label' ? params.mode : null;
  const mode: ScanMode = picked ?? fromParam ?? 'receipt';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modes: { key: ScanMode; emoji: string; title: string; sub: string; tint: string }[] = [
    { key: 'receipt', emoji: '🧾', title: t.scanReceipt, sub: t.scanReceiptSub, tint: C.pink },
    { key: 'haul', emoji: '🛍️', title: t.scanHaul, sub: t.scanHaulSub, tint: C.sky },
    { key: 'label', emoji: '🏷️', title: t.scanLabel, sub: t.scanLabelSub, tint: C.butter },
  ];

  async function capture(source: 'camera' | 'library') {
    setError(null);
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.5 };
    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync(opts);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(opts);
    }
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    let b64 = asset.base64 ?? null;
    // On web, base64 may only be available via the data URI.
    if (!b64 && asset.uri.startsWith('data:')) b64 = asset.uri.split(',')[1] ?? null;
    if (!b64) {
      setError(t.error);
      return;
    }
    setBusy(true);
    try {
      const { drafts, notes } = await scanPhoto(mode, b64, asset.mimeType ?? 'image/jpeg');
      useDrafts.getState().set(mode, drafts, notes);
      router.push('/review');
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  if (busy)
    return (
      <Screen scroll={false} contentStyle={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.brand} />
        <Txt variant="h3">{t.reading}</Txt>
        <Txt color={C.textMuted} style={{ textAlign: 'center' }}>
          {t.readingSub}
        </Txt>
      </Screen>
    );

  return (
    <Screen>
      <Txt variant="title">{t.tabScan}</Txt>
      <View style={{ gap: Spacing.md }}>
        {modes.map((m) => {
          const selected = m.key === mode;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMode(m.key)}
              style={[styles.mode, { backgroundColor: m.tint }, selected && styles.modeSelected]}>
              <Txt style={{ fontSize: 34 }}>{m.emoji}</Txt>
              <View style={{ flex: 1 }}>
                <Txt variant="h3">{m.title}</Txt>
                <Txt variant="small" color={C.textMuted}>
                  {m.sub}
                </Txt>
              </View>
              <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? C.brand : C.textMuted} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: Spacing.sm }}>
        {Platform.OS !== 'web' && (
          <Button label={t.takePhoto} icon={<Ionicons name="camera" size={18} color="#fff" />} onPress={() => capture('camera')} />
        )}
        <Button
          label={t.chooseLibrary}
          kind={Platform.OS === 'web' ? 'primary' : 'secondary'}
          icon={<Ionicons name="images" size={18} color={Platform.OS === 'web' ? '#fff' : C.brand} />}
          onPress={() => capture('library')}
        />
      </View>

      {error && (
        <Card tint={C.dangerSoft}>
          <Txt color={C.danger}>{error}</Txt>
        </Card>
      )}

      <Card onPress={() => router.push('/add')} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <Ionicons name="create-outline" size={22} color={C.brand} />
        <View style={{ flex: 1 }}>
          <Txt variant="label">{t.addManual}</Txt>
          <Txt variant="caption">{t.addManualSub}</Txt>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeSelected: { borderColor: C.brand },
});
