import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Txt } from '@/components/ui';
import { C, Radius, Spacing } from '@/constants/theme';
import { checkFreshness, type FreshnessVerdictResponse } from '@/lib/api';
import { addDays, todayISO } from '@/lib/dates';
import { useT } from '@/lib/i18n';
import { useApp } from '@/lib/store';
import type { Condition } from '@/lib/freshness';

const MAX_PHOTOS = 5;

interface Shot {
  uri: string;
  base64: string;
  mediaType: string;
}

const CONDITION_COLOR: Record<Condition, { bg: string; fg: string; icon: 'checkmark-circle' | 'time' | 'trash' | 'help-circle' }> = {
  fresh: { bg: C.okSoft, fg: C.ok, icon: 'checkmark-circle' },
  use_soon: { bg: C.warnSoft, fg: C.warn, icon: 'time' },
  discard: { bg: C.dangerSoft, fg: C.danger, icon: 'trash' },
  unsure: { bg: C.surface, fg: C.textMuted, icon: 'help-circle' },
};

export default function FreshnessCheckScreen() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useApp((s) => s.items.find((i) => i.id === id));
  const [shots, setShots] = useState<Shot[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FreshnessVerdictResponse | null>(null);
  const [saved, setSaved] = useState(false);

  if (!item)
    return (
      <Screen>
        <Txt>—</Txt>
      </Screen>
    );

  async function addFrom(source: 'camera' | 'library') {
    setError(null);
    const remaining = MAX_PHOTOS - shots.length;
    if (remaining <= 0) return;
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      base64: true,
      quality: 0.5,
      allowsMultipleSelection: source === 'library',
      selectionLimit: remaining,
    };
    let res: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      res = await ImagePicker.launchCameraAsync(opts);
    } else {
      res = await ImagePicker.launchImageLibraryAsync(opts);
    }
    if (res.canceled || !res.assets?.length) return;
    const next: Shot[] = [];
    for (const a of res.assets.slice(0, remaining)) {
      let b64 = a.base64 ?? null;
      if (!b64 && a.uri.startsWith('data:')) b64 = a.uri.split(',')[1] ?? null;
      if (b64) next.push({ uri: a.uri, base64: b64, mediaType: a.mimeType ?? 'image/jpeg' });
    }
    if (next.length === 0) setError(t.error);
    setShots((s) => [...s, ...next].slice(0, MAX_PHOTOS));
    setResult(null);
  }

  async function run() {
    if (shots.length === 0) {
      setError(t.freshNoPhotos);
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      setResult(await checkFreshness(item!, shots));
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  const confidenceNumber = (c: string) => (c === 'high' ? 0.9 : c === 'medium' ? 0.6 : 0.3);

  function save() {
    if (!result) return;
    const { updateItem, toss } = useApp.getState();
    const at = new Date().toISOString();
    const checks = [
      ...(item!.checks ?? []),
      { at, condition: result.condition, daysLeftMin: result.daysLeftMin, daysLeftMax: result.daysLeftMax },
    ];
    if (result.condition === 'discard') {
      updateItem(item!.id, { checks });
      toss(item!.id);
    } else {
      updateItem(item!.id, {
        checks,
        expiresAt: addDays(todayISO(), result.daysLeftMin),
        expirySource: 'estimate',
        confidence: confidenceNumber(result.confidence),
      });
    }
    setSaved(true);
  }

  const title = lang === 'zh' && item.nameZh ? item.nameZh : item.name;
  const colors = result ? CONDITION_COLOR[result.condition] : null;

  return (
    <>
      <Stack.Screen options={{ title: t.freshTitle }} />
      <Screen edges={['bottom']}>
        <Txt variant="h3">{title}</Txt>

        {!result && (
          <>
            <Txt color={C.textMuted}>{t.freshIntro}</Txt>

            {shots.length > 0 && (
              <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ gap: Spacing.sm }}>
                {shots.map((s, i) => (
                  <View key={i} style={styles.thumbWrap}>
                    <Image source={{ uri: s.uri }} style={styles.thumb} />
                    <Pressable
                      onPress={() => setShots((arr) => arr.filter((_, j) => j !== i))}
                      style={styles.thumbX}
                      accessibilityLabel={t.freshRemove}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={{ gap: Spacing.sm }}>
              {Platform.OS !== 'web' && shots.length < MAX_PHOTOS && (
                <Button
                  label={shots.length === 0 ? t.freshAddPhoto : t.freshMore}
                  icon={<Ionicons name="camera" size={18} color="#fff" />}
                  onPress={() => addFrom('camera')}
                />
              )}
              {shots.length < MAX_PHOTOS && (
                <Button
                  label={t.freshChoose}
                  kind="secondary"
                  icon={<Ionicons name="images" size={18} color={C.brand} />}
                  onPress={() => addFrom('library')}
                />
              )}
            </View>

            {error && (
              <Card tint={C.dangerSoft}>
                <Txt color={C.danger}>{error}</Txt>
              </Card>
            )}

            {busy ? (
              <View style={{ alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg }}>
                <ActivityIndicator size="large" color={C.brand} />
                <Txt color={C.textMuted}>{t.freshChecking}</Txt>
              </View>
            ) : (
              <Button label={t.freshCheck} onPress={run} disabled={shots.length === 0} />
            )}
          </>
        )}

        {result && colors && (
          <>
            <Card tint={colors.bg} style={{ gap: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Ionicons name={colors.icon} size={28} color={colors.fg} />
                <Txt variant="h2" color={colors.fg} style={{ flex: 1 }}>
                  {t.freshCondition[result.condition]}
                </Txt>
              </View>
              <Txt variant="h3" color={colors.fg}>
                {t.freshLeft(result.daysLeftMin, result.daysLeftMax)}
              </Txt>
              <Txt variant="small" color={colors.fg}>
                {t.freshConfidence(result.confidence)}
              </Txt>
            </Card>

            {result.safetyNote ? (
              <Card tint={C.warnSoft}>
                <Txt variant="small" color={C.warn}>
                  {result.safetyNote}
                </Txt>
              </Card>
            ) : null}

            <Card style={{ gap: Spacing.xs }}>
              <Txt variant="label">{t.freshSigns}</Txt>
              {result.visibleSigns.length === 0 ? (
                <Txt color={C.textMuted}>{t.freshNone}</Txt>
              ) : (
                result.visibleSigns.map((s, i) => (
                  <Txt key={i} variant="small">
                    • {s}
                  </Txt>
                ))
              )}
              <Txt variant="small" style={{ marginTop: Spacing.sm }}>
                {result.advice}
              </Txt>
            </Card>

            <Txt variant="caption">{t.freshDisclaimer}</Txt>

            {saved ? (
              <Card tint={C.okSoft}>
                <Txt color={C.ok} style={{ fontWeight: '700' }}>
                  {t.freshSaved}
                </Txt>
              </Card>
            ) : (
              <Button label={t.freshSave} onPress={save} />
            )}
            <Button
              label={t.freshAgain}
              kind="secondary"
              onPress={() => {
                setResult(null);
                setSaved(false);
              }}
            />
            {saved && <Button label={t.freshDone} kind="ghost" onPress={() => router.back()} />}
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  thumbWrap: { width: 88, height: 88, borderRadius: Radius.sm, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%', backgroundColor: C.border },
  thumbX: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
