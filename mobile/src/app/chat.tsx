import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, Txt } from '@/components/ui';
import { C, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { askChef } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { activeItems, useApp } from '@/lib/store';
import type { ChatMessage } from '@/lib/types';

export default function Chat() {
  const t = useT();
  const items = useApp((s) => s.items);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: ChatMessage[] = [...messages, { role: 'user', text: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    setError(null);
    try {
      const reply = await askChef(next, activeItems(items));
      setMessages([...next, { role: 'assistant', text: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
      setMessages(messages); // roll back so the user can resend
      setInput(q);
    } finally {
      setBusy(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t.askTitle }} />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: C.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
            {messages.length === 0 && (
              <View style={{ gap: Spacing.md }}>
                <Txt variant="h2">🧑‍🍳 {t.askTitle}</Txt>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                  {t.askSuggestions.map((s) => (
                    <Chip key={s} label={s} onPress={() => send(s)} />
                  ))}
                </View>
              </View>
            )}
            {messages.map((m, i) => (
              <View key={i} style={[styles.bubble, m.role === 'user' ? styles.user : styles.bot]}>
                <Txt color={m.role === 'user' ? '#fff' : C.text}>{m.text}</Txt>
              </View>
            ))}
            {busy && <ActivityIndicator color={C.brand} style={{ alignSelf: 'flex-start' }} />}
            {error && <Txt color={C.danger}>{error}</Txt>}
          </ScrollView>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t.askPlaceholder}
              placeholderTextColor={C.textMuted}
              style={styles.input}
              multiline
              onSubmitEditing={() => send(input)}
              blurOnSubmit
              returnKeyType="send"
            />
            <Pressable
              onPress={() => send(input)}
              disabled={!input.trim() || busy}
              style={[styles.send, (!input.trim() || busy) && { opacity: 0.4 }]}
              accessibilityLabel={t.send}>
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  bubble: { maxWidth: '85%', borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  user: { alignSelf: 'flex-end', backgroundColor: C.brand },
  bot: { alignSelf: 'flex-start', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderRadius: Radius.md,
    backgroundColor: C.bg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: C.text,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
