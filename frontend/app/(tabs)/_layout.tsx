import { Link, Tabs } from 'expo-router';
import { L } from '../../constants/colors';
import { Image, Pressable, Text, View, Platform } from 'react-native';
import { useDesktopLayout } from '../../utils/useDesktopLayout';
import { Feather } from '@expo/vector-icons';

const TAB_ITEMS = [
  { name: 'ask', title: 'Ask', icon: 'search' },
  { name: 'journey', title: 'Journey', icon: 'map' },
  { name: 'community', title: 'Community', icon: 'users' },
  { name: 'profile', title: 'Profile', icon: 'user' },
] as const;

export default function TabLayout() {
  const desktop = useDesktopLayout();
  return (
    <Tabs
      tabBar={desktop ? ({ state }) => (
        <View style={{ backgroundColor: '#0A0F1D', alignItems: 'center' }}>
          <View style={{ height: 76, width: '100%', maxWidth: 1440, paddingHorizontal: '5%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/ask" asChild>
              <Pressable accessibilityLabel="PathFinder home" style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Image source={require('../../assets/logo-dark.png')} resizeMode="contain" style={{ width: 28, height: 40 }} />
                <Image source={require('../../assets/title-dark.png')} resizeMode="contain" style={{ width: 148, height: 20 }} />
              </Pressable>
            </Link>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TAB_ITEMS.map(item => {
                const selected = state.routes[state.index].name === item.name;
                const color = selected ? '#E9F5EE' : '#C4C9D1';
                return <Link key={item.name} href={`/${item.name}`} asChild>
                  <Pressable accessibilityState={{ selected }} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 9, backgroundColor: selected ? '#24343A' : 'transparent' }}>
                    <Feather name={item.icon} size={16} color={color} />
                    <Text style={{ color, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>{item.title}</Text>
                  </Pressable>
                </Link>;
              })}
            </View>
          </View>
        </View>
      ) : undefined}
      screenOptions={{
        tabBarPosition: desktop ? 'top' : 'bottom',
        sceneStyle: desktop ? { width: '100%', maxWidth: 1152, alignSelf: 'center' } : undefined,
        headerShown: false,
        tabBarActiveTintColor: L.teal,
        tabBarInactiveTintColor: L.navySoft,
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 10,
          fontFamily: 'Manrope_600SemiBold',
          letterSpacing: 0.3,
        },
        tabBarStyle: {
          backgroundColor: Platform.OS === 'web'
            ? 'rgba(250, 249, 246, 0.90)'
            : L.background,
          borderTopWidth: 1,
          borderTopColor: L.border,
          height: 80,
          paddingBottom: 12,
          paddingTop: 12,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } as any : {}),
        },
      }}
    >

      {TAB_ITEMS.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            ...(desktop && name !== 'ask' ? { sceneStyle: { width: '100%', alignSelf: 'center' } as const } : {}),
            tabBarIcon: ({ color, focused }) => (
              <View style={{ alignItems: 'center' }}>
                {focused && (
                  <View style={{
                    width: 20, height: 3, borderRadius: 1.5,
                    backgroundColor: L.teal,
                    position: 'absolute', top: -8,
                  }} />
                )}
                <Feather name={icon} size={22} color={color} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
