import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { QuranTabBar } from '@/features/quran/components/QuranTabBar';
import { QuranProgressProvider } from '@/features/quran/state/QuranProgressContext';

export default function QuranLayout() {
  return (
    <QuranProgressProvider>
      <View style={styles.container}>
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
        </View>
        <QuranTabBar />
      </View>
    </QuranProgressProvider>
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
