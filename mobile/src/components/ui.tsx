import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { daysUntil, freshness } from '@/lib/dates';
import { useT } from '@/lib/i18n';

type TxtVariant = 'title' | 'h2' | 'h3' | 'body' | 'small' | 'caption' | 'label';

export function Txt({
  variant = 'body',
  color,
  style,
  ...rest
}: TextProps & { variant?: TxtVariant; color?: string }) {
  return <Text style={[styles.base, styles[variant], color ? { color } : null, style]} {...rest} />;
}

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const inner = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView edges={edges} style={styles.screen}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function Card({
  children,
  style,
  onPress,
  tint,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tint?: string;
}) {
  const s = [styles.card, tint ? { backgroundColor: tint, borderColor: 'transparent' } : null, style];
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  return <View style={s}>{children}</View>;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  loading,
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    kind === 'primary' ? C.brand : kind === 'secondary' ? C.brandSoft : kind === 'danger' ? C.dangerSoft : 'transparent';
  const fg = kind === 'primary' ? '#fff' : kind === 'danger' ? C.danger : C.brand;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        (disabled || loading) && { opacity: 0.5 },
        pressed && styles.pressed,
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : icon}
      <Txt variant="label" color={fg}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}>
      <Txt variant="small" color={active ? '#fff' : C.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Field({ label, style, ...rest }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 4, flex: 1 }}>
      <Txt variant="caption">{label}</Txt>
      <TextInput placeholderTextColor={C.textMuted} style={[styles.input, style]} {...rest} />
    </View>
  );
}

export function FreshnessBadge({ expiresAt }: { expiresAt: string }) {
  const t = useT();
  const f = freshness(expiresAt);
  const n = daysUntil(expiresAt);
  const [bg, fg] =
    f === 'expired' ? [C.dangerSoft, C.danger] : f === 'today' || f === 'soon' ? [C.warnSoft, C.warn] : [C.okSoft, C.ok];
  const label = f === 'expired' ? t.expired : f === 'today' ? t.today : t.daysLeft(n);
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Txt variant="caption" color={fg} style={{ fontWeight: '700' }}>
        {label}
      </Txt>
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Txt variant="h3">{title}</Txt>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { color: C.text, fontFamily: Fonts.sans },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13, lineHeight: 18 },
  caption: { fontSize: 12, lineHeight: 16, color: C.textMuted },
  label: { fontSize: 15, fontWeight: '700' },
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingBottom: Spacing.xxl * 2 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: Spacing.lg,
  },
  pressed: { opacity: 0.75 },
  button: {
    minHeight: 48,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.brand, borderColor: C.brand },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Radius.sm,
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
