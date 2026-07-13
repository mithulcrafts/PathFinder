import { Tabs } from 'expo-router';
import { L } from '../../constants/colors';
import { View, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
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

      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 20, height: 3, borderRadius: 1.5,
                  backgroundColor: L.teal,
                  position: 'absolute', top: -8,
                }} />
              )}
              <Feather name="search" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 20, height: 3, borderRadius: 1.5,
                  backgroundColor: L.teal,
                  position: 'absolute', top: -8,
                }} />
              )}
              <Feather name="map" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 20, height: 3, borderRadius: 1.5,
                  backgroundColor: L.teal,
                  position: 'absolute', top: -8,
                }} />
              )}
              <Feather name="users" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 20, height: 3, borderRadius: 1.5,
                  backgroundColor: L.teal,
                  position: 'absolute', top: -8,
                }} />
              )}
              <Feather name="user" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
