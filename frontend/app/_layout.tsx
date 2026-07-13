import "react-native-reanimated";
import "../global.css";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { View, Platform, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useFonts, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from "@expo-google-fonts/manrope";
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif";
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Updates from "expo-updates";

// Prevent splash from auto-hiding until fonts are ready
SplashScreen.preventAutoHideAsync().catch(console.warn);

// Token cache implementation for secure storage of session tokens
const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log("No values stored under key: " + key);
      }
      return item;
    } catch (error) {
      console.warn("SecureStore get item error: ", error);
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (e) { }
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

console.log("Using Clerk key:", publishableKey);

if (!publishableKey) {
  throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is undefined");
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });


  console.log("Update ID:", Updates.updateId);
  console.log("Channel:", Updates.channel);
  console.log("Runtime:", Updates.runtimeVersion);
  console.log("PK:", process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF6900" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
        <ClerkLoaded>
          <View className="flex-1 bg-[#FAF9F6] items-center">
            <View
              className="flex-1 w-full web:max-w-[480px] web:border-x web:border-[#EAE7E0]"
              style={Platform.OS === 'web' ? { shadowColor: '#152238', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.06, shadowRadius: 20 } : {}}
            >
              <Slot />
            </View>
            {Platform.OS === 'web' && (
              <View nativeID="clerk-captcha" />
            )}
          </View>
        </ClerkLoaded>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

// Global Error Boundary to catch unexpected React rendering errors
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FAF9F6', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ backgroundColor: '#FFFFFF', padding: 24, borderRadius: 24, alignItems: 'center', width: '100%', maxWidth: 400, borderWidth: 1, borderColor: '#EAE7E0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
        <Text style={{ fontFamily: 'InstrumentSerif_400Regular', fontSize: 32, color: '#0F172A', marginBottom: 12, textAlign: 'center' }}>
          Oops! Something broke.
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#4A5568', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
          {error.message || "An unexpected error occurred while processing the AI data or rendering the screen."}
        </Text>
        <TouchableOpacity style={{ width: '100%', height: 48, backgroundColor: '#FF6900', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }} onPress={retry}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#FFFFFF' }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
