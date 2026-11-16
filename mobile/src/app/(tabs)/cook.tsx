import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Button, Card, Screen, Txt } from '@/components/ui';
import { C, Radius, Spacing } from '@/constants/theme';
import { fetchRecipes } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { activeItems, useApp } from '@/lib/store';
import type { Recipe } from '@/lib/types';

export default function Cook() {
  const t = useT();
  const lang = useApp((s) => s.lang);
  const items = useApp((s) => s.items);
  const markUsedByNames = useApp((s) => s.markUsedByNames);
  const active = activeItems(items);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(0);
  const [cooked, setCooked] = useState<Set<number>>(new Set());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRecipes(await fetchRecipes(active));
      setOpen(0);
      setCooked(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Txt variant="title">{t.recipesTitle}</Txt>
      <Txt color={C.textMuted}>{t.recipesSub}</Txt>

      <Pressable
        onPress={() => router.push('/chat')}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
            backgroundColor: C.brandSoft,
            borderRadius: Radius.md,
            padding: Spacing.lg,
          },
          pressed && { opacity: 0.8 },
        ]}>
        <Ionicons name="chatbubbles" size={22} color={C.brand} />
        <View style={{ flex: 1 }}>
          <Txt variant="label" color={C.brand}>
            {t.askTitle}
          </Txt>
          <Txt variant="caption">{t.askPlaceholder}</Txt>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.brand} />
      </Pressable>

      <Button
        label={recipes ? t.refresh : t.getRecipes}
        icon={<Ionicons name="sparkles" size={18} color="#fff" />}
        onPress={load}
        loading={loading}
        disabled={active.length === 0}
      />
      {active.length === 0 && <Txt color={C.textMuted}>{t.emptyPantryBody}</Txt>}
      {error && (
        <Card tint={C.dangerSoft}>
          <Txt color={C.danger}>{error}</Txt>
        </Card>
      )}
      {loading && !recipes && <ActivityIndicator color={C.brand} />}

      {recipes?.map((r, idx) => {
        const isOpen = open === idx;
        return (
          <Card key={`${r.title}-${idx}`} style={{ gap: Spacing.sm }}>
            <Pressable onPress={() => setOpen(isOpen ? null : idx)} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Txt variant="h3" style={{ flex: 1 }}>
                  {lang === 'zh' ? r.titleZh : r.title}
                </Txt>
                <Txt variant="caption">{t.minutes(r.minutes)}</Txt>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
              </View>
              <Txt variant="small" color={C.textMuted}>
                {lang === 'zh' ? r.title : r.titleZh}
              </Txt>
              <Txt variant="small" color={C.brand}>
                ♻️ {r.why}
              </Txt>
            </Pressable>
            {isOpen && (
              <View style={{ gap: Spacing.sm }}>
                <Txt variant="small">
                  <Txt variant="small" style={{ fontWeight: '700' }}>{`${t.uses}: `}</Txt>
                  {r.uses.join(', ')}
                </Txt>
                {r.missing.length > 0 && (
                  <Txt variant="small">
                    <Txt variant="small" style={{ fontWeight: '700' }}>{`${t.missing}: `}</Txt>
                    {r.missing.join(', ')}
                  </Txt>
                )}
                {r.steps.map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <Txt variant="small" color={C.brand} style={{ fontWeight: '700', width: 18 }}>
                      {i + 1}
                    </Txt>
                    <Txt variant="small" style={{ flex: 1 }}>
                      {s}
                    </Txt>
                  </View>
                ))}
                <Button
                  label={t.cookedIt}
                  kind="secondary"
                  disabled={cooked.has(idx)}
                  icon={<Ionicons name="checkmark-circle" size={18} color={C.brand} />}
                  onPress={() => {
                    markUsedByNames(r.uses);
                    setCooked(new Set(cooked).add(idx));
                  }}
                />
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}
