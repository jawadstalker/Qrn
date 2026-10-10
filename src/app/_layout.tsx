import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { LanguageProvider } from "@/core/i18n/LanguageContext";
import { ThemeProvider, useTheme } from "@/core/theme/ThemeContext";
import { SoundProvider } from "@/shared/audio/SoundContext";
import { QuranTabBar } from "@/features/quran/components/QuranTabBar";
import { QuranProgressProvider } from "@/features/quran/state/QuranProgressContext";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function Shell() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      </View>
      <QuranTabBar />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    EstedadMedium: require("../../assets/fonts/Estedad-Medium.ttf"),
    QCF_P001: require("../../assets/fonts/QCF_P001.ttf"),
    UthmanicHafs: require("../../assets/fonts/UthmanicHafs.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <SoundProvider>
              <QuranProgressProvider>
                <Shell />
              </QuranProgressProvider>
            </SoundProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
