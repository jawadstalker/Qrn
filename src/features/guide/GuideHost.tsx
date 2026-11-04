import React, { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDirection } from "@/core/i18n/useDirection";
import { useLanguage } from "@/core/i18n/LanguageContext";
import { formatNumber } from "@/core/i18n/format";
import { normalizeRoute } from "@/core/navigation/routes";
import { useTheme } from "@/core/theme/ThemeContext";
import { AppText } from "@/shared/components/ui/AppText";
import { SoundPressable } from "@/shared/components/ui/SoundPressable";
import { GOLD } from "@/features/quran/components/QuranDecor";
import {
  BAR_HEIGHT,
  HIDDEN_ROUTES,
} from "@/features/quran/components/QuranTabBar";
import { fill } from "@/features/quran/utils/fill";
import {
  GUIDES,
  GUIDE_ROUTES,
  GUIDE_UI,
  type GuideId,
  type GuideItem,
} from "@/features/guide/guideContent";
import { useGuide } from "@/features/guide/GuideContext";

/** Wait a moment after a page opens so its own entrance animations can finish first. */
const SHOW_DELAY = 850;
const CARD_MAX_WIDTH = 400;
const CARD_MARGIN = 20;
const SPOTLIGHT_RADIUS = 24;
const DIM = "rgba(12, 10, 28, 0.6)";

/** The older /quran/* routes show the same screens as the root ones. */
function guideRoute(pathname: string): string {
  const route = normalizeRoute(pathname || "/");

  if (route === "/quran") {
    return "/";
  }

  return route.startsWith("/quran/") ? route.slice("/quran".length) : route;
}

/**
 * Bold the "Name:" part of a row such as "Library: pick a surah".
 *
 * AppText guesses the script from plain string children. A fragment hides the text from that
 * guess, so the script is passed explicitly; otherwise Persian would render in the Latin font.
 */
function ItemText({
  text,
  color,
  textAlign,
  persian,
}: {
  text: string;
  color: string;
  textAlign: "left" | "right";
  persian: boolean;
}) {
  const colon = text.indexOf(":");
  const hasLabel = colon > 0 && colon <= 40;

  return (
    <AppText
      variant="bodySmall"
      forcePersian={persian}
      forceEnglish={!persian}
      style={[styles.itemText, { color, textAlign }]}
    >
      {hasLabel ? (
        <>
          <Text style={styles.itemLabel}>{text.slice(0, colon + 1)}</Text>
          {text.slice(colon + 1)}
        </>
      ) : (
        text
      )}
    </AppText>
  );
}

export function GuideHost({ enabled }: { enabled: boolean }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const route = guideRoute(pathname);
  const { ready, active, hasSeen, pagesAllowed, start, finish } = useGuide();
  const [progress, setProgress] = useState<{
    id: GuideId | null;
    index: number;
  }>({ id: null, index: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });

  /* Open a guide on its own: the intro on the home page, then each page the first time it opens. */
  useEffect(() => {
    if (!enabled || !ready || active) {
      return undefined;
    }

    let next: GuideId | null = null;

    if (route === "/" && !hasSeen("tour")) {
      next = "tour";
    } else if (pagesAllowed()) {
      const pageGuide = GUIDE_ROUTES[route];

      next = pageGuide && !hasSeen(pageGuide) ? pageGuide : null;
    }

    if (!next) {
      return undefined;
    }

    const id = next;
    const timer = setTimeout(() => start(id), SHOW_DELAY);

    return () => clearTimeout(timer);
  }, [enabled, ready, active, route, hasSeen, pagesAllowed, start]);

  const index = progress.id === active ? progress.index : 0;

  const go = useCallback(
    (to: number) => {
      void Haptics.selectionAsync();
      setProgress({ id: active, index: to });
    },
    [active],
  );

  /* Android back button: one step back, and closes the guide from the first step. */
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (index > 0) {
          go(index - 1);
        } else {
          finish(active);
        }

        return true;
      },
    );

    return () => subscription.remove();
  }, [active, index, go, finish]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setSize((previous) =>
      previous.width === width && previous.height === height
        ? previous
        : { width, height },
    );
  }, []);

  if (!active || !enabled) {
    return null;
  }

  const guide = GUIDES[active];
  const total = guide.steps.length;
  const current = guide.steps[Math.min(index, total - 1)]!;
  const isLast = index >= total - 1;
  const ui = GUIDE_UI[language];
  const number = (value: number) => formatNumber(value, language);

  const Icon = current.icon;
  const Forward = isRTL ? ChevronLeft : ChevronRight;
  const Back = isRTL ? ChevronRight : ChevronLeft;

  const spotlight = current.spotlight === "tabBar";
  const barHeight = BAR_HEIGHT + insets.bottom;
  const tabBarShown = !HIDDEN_ROUTES.includes(route);
  const bottomSpace = spotlight || tabBarShown ? barHeight : insets.bottom;
  const cardWidth = Math.min(CARD_MAX_WIDTH, size.width - CARD_MARGIN * 2);
  const maxCardHeight = Math.max(
    size.height - insets.top - bottomSpace - 40,
    200,
  );

  const outer = `M0 0H${size.width}V${size.height}H0Z`;
  const barTop = size.height - barHeight;
  const hole =
    `M0 ${size.height}V${barTop + SPOTLIGHT_RADIUS}` +
    `Q0 ${barTop} ${SPOTLIGHT_RADIUS} ${barTop}` +
    `H${size.width - SPOTLIGHT_RADIUS}` +
    `Q${size.width} ${barTop} ${size.width} ${barTop + SPOTLIGHT_RADIUS}` +
    `V${size.height}Z`;
  const ring =
    `M0 ${barTop + SPOTLIGHT_RADIUS}Q0 ${barTop} ${SPOTLIGHT_RADIUS} ${barTop}` +
    `H${size.width - SPOTLIGHT_RADIUS}` +
    `Q${size.width} ${barTop} ${size.width} ${barTop + SPOTLIGHT_RADIUS}`;

  const title = current.title[language];
  const body = current.body[language];
  const doneLabel = current.doneLabel?.[language] ?? ui.done;

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.overlay]}
      onLayout={onLayout}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      {size.width > 0 ? (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Path
            d={spotlight ? `${outer}${hole}` : outer}
            fill={DIM}
            fillRule="evenodd"
          />
          {spotlight ? (
            <Path d={ring} fill="none" stroke={GOLD} strokeWidth={2.5} />
          ) : null}
        </Svg>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: DIM }]} />
      )}

      <View
        style={[
          styles.holder,
          spotlight
            ? { justifyContent: "flex-end", paddingBottom: barHeight + 14 }
            : {
                justifyContent: "center",
                paddingTop: insets.top + 12,
                paddingBottom: bottomSpace + 12,
              },
        ]}
        pointerEvents="box-none"
      >
        {size.width > 0 ? (
          <Animated.View
            entering={FadeInDown.duration(260)}
            accessibilityLiveRegion="polite"
            style={[
              styles.card,
              {
                width: cardWidth,
                maxHeight: maxCardHeight,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Animated.View
              key={`${active}-${index}`}
              entering={FadeIn.duration(180)}
              style={styles.content}
            >
              <View style={[styles.header, { flexDirection: row }]}>
                <View
                  style={[styles.iconCircle, { backgroundColor: colors.tint }]}
                >
                  <Icon size={24} color={colors.onTint} strokeWidth={2.1} />
                </View>
                <AppText
                  variant="body"
                  accessibilityRole="header"
                  style={[
                    styles.title,
                    { color: colors.text, textAlign, fontWeight: "800" },
                  ]}
                >
                  {title}
                </AppText>
                <SoundPressable
                  accessibilityRole="button"
                  accessibilityLabel={ui.skip}
                  hitSlop={10}
                  onPress={() => finish(active)}
                  style={styles.close}
                >
                  <X size={20} color={colors.textSecondary} />
                </SoundPressable>
              </View>

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <AppText
                  variant="bodySmall"
                  style={{ color: colors.text, textAlign, lineHeight: 25 }}
                >
                  {body}
                </AppText>
                {current.items?.map((item: GuideItem) => {
                  const ItemIcon = item.icon;

                  return (
                    <View
                      key={item.text.en}
                      style={[styles.itemRow, { flexDirection: row }]}
                    >
                      <View
                        style={[
                          styles.itemIcon,
                          { backgroundColor: colors.tintSoft },
                        ]}
                      >
                        <ItemIcon size={18} color={colors.onTint} />
                      </View>
                      <ItemText
                        text={item.text[language]}
                        color={colors.textSecondary}
                        textAlign={textAlign}
                        persian={isRTL}
                      />
                    </View>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {isLast && current.offerDisable ? (
              <SoundPressable
                accessibilityRole="button"
                onPress={() => finish(active, { disablePages: true })}
                hitSlop={6}
                style={styles.disableLink}
              >
                <AppText
                  variant="caption"
                  style={{
                    color: colors.textSecondary,
                    textDecorationLine: "underline",
                  }}
                >
                  {ui.disablePages}
                </AppText>
              </SoundPressable>
            ) : null}

            <View style={[styles.footer, { flexDirection: row }]}>
              <View style={[styles.progress, { flexDirection: row }]}>
                {total > 1 ? (
                  <View style={[styles.dots, { flexDirection: row }]}>
                    {guide.steps.map((step, position) => (
                      <View
                        key={step.title.en}
                        style={[
                          styles.dot,
                          position === index && styles.dotActive,
                          {
                            backgroundColor:
                              position === index
                                ? colors.primary
                                : colors.track,
                          },
                        ]}
                      />
                    ))}
                  </View>
                ) : null}
                {total > 1 ? (
                  <AppText
                    variant="caption"
                    style={{ color: colors.textSecondary }}
                  >
                    {fill(ui.stepOf, {
                      n: number(index + 1),
                      total: number(total),
                    })}
                  </AppText>
                ) : null}
              </View>

              <View style={[styles.actions, { flexDirection: row }]}>
                {index > 0 ? (
                  <SoundPressable
                    accessibilityRole="button"
                    accessibilityLabel={ui.prev}
                    onPress={() => go(index - 1)}
                    style={[styles.prev, { backgroundColor: colors.tintSoft }]}
                  >
                    <Back size={20} color={colors.onTint} />
                  </SoundPressable>
                ) : null}
                <SoundPressable
                  accessibilityRole="button"
                  accessibilityLabel={isLast ? doneLabel : ui.next}
                  onPress={() => (isLast ? finish(active) : go(index + 1))}
                  style={[
                    styles.next,
                    { backgroundColor: colors.primary, flexDirection: row },
                  ]}
                >
                  <AppText
                    variant="button"
                    style={{ color: colors.onPrimary, fontWeight: "800" }}
                  >
                    {isLast ? doneLabel : ui.next}
                  </AppText>
                  {isLast ? null : (
                    <Forward size={18} color={colors.onPrimary} />
                  )}
                </SoundPressable>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
    /* The tab bar and the mini player use elevation on Android; stay above them. */
    elevation: Platform.OS === "android" ? 60 : 0,
  },
  holder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 24,
  },
  content: {
    flexShrink: 1,
    gap: 10,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 2,
  },
  itemRow: {
    alignItems: "center",
    gap: 10,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    flex: 1,
    lineHeight: 21,
  },
  itemLabel: {
    fontWeight: "800",
  },
  disableLink: {
    alignSelf: "center",
    paddingVertical: 4,
  },
  footer: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  progress: {
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  dots: {
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
  },
  actions: {
    alignItems: "center",
    gap: 8,
  },
  prev: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  next: {
    minHeight: 44,
    paddingHorizontal: 22,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
