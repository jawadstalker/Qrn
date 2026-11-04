import React, { useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useGuide } from "@/features/guide/GuideContext";

/**
 * Marks an element a guide can point at.
 *
 *   <GuideTarget id="garden.plant"> ...the plant card... </GuideTarget>
 *
 * It is a plain View (collapsable={false} so the native view really exists and can be measured)
 * and it adds no styling. Ids are "<page>.<thing>" and must be unique in the app.
 */
export function GuideTarget({
  id,
  style,
  children,
}: {
  id: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { registerTarget } = useGuide();
  const ref = useRef<View>(null);

  useEffect(() => registerTarget(id, ref), [id, registerTarget]);

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}

/**
 * Lets a guide scroll the screen so a target comes into view. Spread the result on the screen's main
 * ScrollView or FlatList:
 *
 *   const guideScroll = useGuideScroll();
 *   <ScrollView {...guideScroll}> ... </ScrollView>
 *
 * If the screen already has its own ref or onScroll, pass them in: `useGuideScroll(ref)` reuses the
 * ref, and `guideScroll.onScroll(event)` can be called from the existing onScroll handler.
 */
export function useGuideScroll(existingRef?: React.RefObject<any>) {
  const ownRef = useRef<any>(null);
  const ref = existingRef ?? ownRef;
  const offset = useRef(0);
  const { registerScroller } = useGuide();

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.y;
    },
    [],
  );

  /* Only the screen that is focused counts; a screen kept under it in the stack must not. */
  useFocusEffect(
    useCallback(
      () =>
        registerScroller({
          getOffset: () => offset.current,
          scrollTo: (y: number) => {
            const node = ref.current;

            if (node?.scrollTo) {
              node.scrollTo({ y, animated: true });
            } else if (node?.scrollToOffset) {
              node.scrollToOffset({ offset: y, animated: true });
            }
          },
        }),
      [registerScroller, ref],
    ),
  );

  return { ref, onScroll, scrollEventThrottle: 16 } as const;
}
