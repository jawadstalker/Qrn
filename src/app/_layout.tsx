import React, { useEffect, useState } from "react";
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
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { LanguageProvider } from "@/core/i18n/LanguageContext";
import { ThemeProvider, useTheme } from "@/core/theme/ThemeContext";
import { SoundProvider } from "@/shared/audio/SoundContext";
import { DailyReminders } from "@/features/quran/components/DailyReminders";
import { MiniPlayer } from "@/features/quran/components/MiniPlayer";
import { QuranTabBar } from "@/features/quran/components/QuranTabBar";
import { BrandSplash } from "@/features/quran/components/BrandSplash";
import { SplashIntro } from "@/features/quran/components/SplashIntro";
import { GuideHost } from "@/features/guide/GuideHost";
import { GuideProvider } from "@/features/guide/GuideContext";
import { MemorizationPlanProvider } from "@/features/quran/state/MemorizationPlanContext";
import { QuranProgressProvider } from "@/features/quran/state/QuranProgressContext";
import { RecitationProvider } from "@/features/quran/state/RecitationContext";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Remounts the data providers when a sync replaced local data, so they read the new values. */
function DataGate({ children }: { children: React.ReactNode }) {
  const { dataEpoch } = useAuth();

  return <React.Fragment key={dataEpoch}>{children}</React.Fragment>;
}

function Shell({ guideEnabled }: { guideEnabled: boolean }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false, animation: "none" }} />
      </View>
      <DailyReminders />
      <MiniPlayer />
      <QuranTabBar />
      <GuideHost enabled={guideEnabled} />
    </View>
  );
}

export default function RootLayout() {
  const [splashStage, setSplashStage] = useState<"intro" | "brand" | "done">(
    "intro",
  );
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    EstedadMedium: require("../../assets/fonts/Estedad-Medium.ttf"),
    QCF_P001: require("../../assets/fonts/QCF_P001.ttf"),
    QCF_P582: require("../../assets/fonts/QCF_P582.ttf"),
    QCF_P583: require("../../assets/fonts/QCF_P583.ttf"),
    QCF_BSML: require("../../assets/fonts/QCF_BSML.ttf"),
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
              <GuideProvider>
                <AuthProvider>
                  <DataGate>
                    <QuranProgressProvider>
                      <MemorizationPlanProvider>
                        <RecitationProvider>
                          <Shell guideEnabled={splashStage === "done"} />
                        </RecitationProvider>
                      </MemorizationPlanProvider>
                    </QuranProgressProvider>
                  </DataGate>
                </AuthProvider>
              </GuideProvider>
              {splashStage === "done" ? null : (
                <>
                  <BrandSplash
                    active={splashStage === "brand"}
                    onDone={() => setSplashStage("done")}
                  />
                  {splashStage === "intro" ? (
                    <SplashIntro onDone={() => setSplashStage("brand")} />
                  ) : null}
                </>
              )}
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