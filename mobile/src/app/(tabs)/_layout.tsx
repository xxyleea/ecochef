import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View, type ColorValue } from 'react-native';

import { C } from '@/constants/theme';
import { useT } from '@/lib/i18n';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName, focusedName: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? focusedName : name} size={24} color={color as string} />;
  };
}

export default function TabsLayout() {
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          height: Platform.OS === 'web' ? 64 : undefined,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ title: t.tabHome, tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="pantry" options={{ title: t.tabPantry, tabBarIcon: icon('file-tray-stacked-outline', 'file-tray-stacked') }} />
      <Tabs.Screen
        name="scan"
        options={{
          title: t.tabScan,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.scanBtn, focused && { backgroundColor: C.text }]}>
              <Ionicons name="scan" size={24} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen name="cook" options={{ title: t.tabCook, tabBarIcon: icon('restaurant-outline', 'restaurant') }} />
      <Tabs.Screen name="impact" options={{ title: t.tabImpact, tabBarIcon: icon('leaf-outline', 'leaf') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
  },
});
