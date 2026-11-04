import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
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
  type GuideStep,
} from "@/features/guide/guideContent";
import {
  measureNode,
  needsScroll,
  padRect,
  placeCard,
  roundedRectPath,
  scrollDelta,
  unionRects,
  type Measurable,
  type Rect,
} from "@/features/guide/guideGeometry";
import { useGuide } from "@/features/guide/GuideContext";

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Wait a moment after a page opens so its own entrance animations can finish first. */
const SHOW_DELAY = 850;
const CARD_MAX_WIDTH = 340;
const CARD_MARGIN = 16;
const DEFAULT_PAD = 8;
const DEFAULT_RADIUS = 18;
const SCROLL_SETTLE = 520;
const DIM = "rgba(12, 10, 28, 0.68)";
/**
 * The spotlight glides from one target to the next with Reanimated animated props on an SVG path.
 * If that ever misbehaves on a device (screen stays dark with no highlighted area), set this to false:
 * the highlight is then drawn from plain JavaScript state, without the glide, and everything else
 * (scrolling, cards, arrows, buttons) works the same.
 */
const ANIMATE_SPOTLIGHT = true;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const toIds = (target: GuideStep["target"]): readonly string[] =>
  target === undefined ? [] : typeof target === "string" ? [target] : target;

/** The older /quran/* routes show the same screens as the root ones. */
function guideRoute(pathname: string): string {
  const route = normalizeRoute(pathname || "/");

  if (route === "/quran") {
    return "/";
  }

  return route.startsWith("/quran/") ? route.slice("/quran".length) : route;
}

interface OverlayBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function GuideHost({ enabled }: { enabled: boolean }) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const { row, textAlign, isRTL } = useDirection();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const route = guideRoute(pathname);
  const {
    ready,
    active,
    hasSeen,
    pagesAllowed,
    start,
    finish,
    getTarget,
    getScroller,
  } = useGuide();

  const overlayRef = useRef<View>(null);
  const [overlay, setOverlay] = useState<OverlayBox | null>(null);
  const [progress, setProgress] = useState<{
    id: GuideId | null;
    index: number;
  }>({ id: null, index: 0 });
  const [placed, setPlaced] = useState<{ key: string; spot: Rect | null }>({
    key: "",
    spot: null,
  });
  const [cardHeight, setCardHeight] = useState(0);

  /* Spotlight geometry, animated on the UI thread. */
  const overlayW = useSharedValue(0);
  const overlayH = useSharedValue(0);
  const holeX = useSharedValue(0);
  const holeY = useSharedValue(0);
  const holeW = useSharedValue(0);
  const holeH = useSharedValue(0);
  const holeR = useSharedValue(DEFAULT_RADIUS);
  const ring = useSharedValue(0);
  const pulse = useSharedValue(0);
  const cardIn = useSharedValue(0);

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

  /* Steps whose target is not on screen (and are optional) are left out; counted once per opening. */
  const steps = useMemo<readonly GuideStep[]>(
    () =>
      active
        ? GUIDES[active].steps.filter(
            (step) =>
              !step.optional ||
              toIds(step.target).some((id) => getTarget(id) !== null),
          )
        : [],
    [active, getTarget],
  );

  const index = progress.id === active ? progress.index : 0;
  const step = steps[Math.min(index, steps.length - 1)];
  const total = steps.length;
  const isLast = index >= total - 1;
  const key = `${active}:${index}`;

  /* Nothing to point at and nothing to say: close silently. */
  useEffect(() => {
    if (active && steps.length === 0) {
      finish(active);
    }
  }, [active, steps, finish]);

  const skip = useCallback(() => {
    if (!active) {
      return;
    }

    /* Skipping the intro also skips the first page guide, which sits on the same page. */
    finish(active, active === "tour" ? { alsoSeen: ["garden"] } : undefined);
  }, [active, finish]);

  const go = useCallback(
    (to: number) => {
      void Haptics.selectionAsync();
      setProgress({ id: active, index: to });
    },
    [active],
  );

  /* Android back button: one step back, and skips the guide from the first step. */
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
          skip();
        }

        return true;
      },
    );

    return () => subscription.remove();
  }, [active, index, go, skip]);

  /* The overlay's own position in the window; targets are measured in window coordinates. */
  const onLayout = useCallback((_event: LayoutChangeEvent) => {
    overlayRef.current?.measureInWindow((x, y, w, h) => {
      if (w > 0 && h > 0) {
        setOverlay((previous) =>
          previous &&
          previous.x === x &&
          previous.y === y &&
          previous.w === w &&
          previous.h === h
            ? previous
            : { x, y, w, h },
        );
      }
    });
  }, []);

  /* A fresh opening starts with the spotlight collapsed in the middle, so the first target grows out of it. */
  useEffect(() => {
    if (!overlay) {
      return;
    }

    overlayW.value = overlay.w;
    overlayH.value = overlay.h;
  }, [overlay, overlayW, overlayH]);

  useEffect(() => {
    if (!active || !overlay) {
      return;
    }

    holeX.value = overlay.w / 2;
    holeY.value = overlay.h / 2;
    holeW.value = 0;
    holeH.value = 0;
    ring.value = 0;
    cardIn.value = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, overlay === null]);

  useEffect(() => {
    if (!active || reduced) {
      pulse.value = 0;

      return undefined;
    }

    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );

    return () => {
      pulse.value = 0;
    };
  }, [active, reduced, pulse]);

  const moveSpotlight = useCallback(
    (spot: Rect | null, radius: number, showCard: boolean) => {
      const duration = reduced ? 0 : 340;
      const easing = Easing.out(Easing.cubic);

      if (spot) {
        holeX.value = withTiming(spot.x, { duration, easing });
        holeY.value = withTiming(spot.y, { duration, easing });
        holeW.value = withTiming(spot.w, { duration, easing });
        holeH.value = withTiming(spot.h, { duration, easing });
        holeR.value = withTiming(radius, { duration, easing });
        ring.value = withTiming(1, { duration });
      } else {
        holeW.value = withTiming(0, { duration, easing });
        holeH.value = withTiming(0, { duration, easing });
        ring.value = withTiming(0, { duration });
      }

      if (showCard) {
        cardIn.value = withDelay(
          reduced ? 0 : spot ? 240 : 100,
          withTiming(1, { duration: reduced ? 0 : 220 }),
        );
      }
    },
    [reduced, holeX, holeY, holeW, holeH, holeR, ring, cardIn],
  );

  const tabBarShown = !HIDDEN_ROUTES.includes(route);
  const barHeight = BAR_HEIGHT + insets.bottom;
  const reserved = tabBarShown ? barHeight : insets.bottom;

  /* Resolve the current step: find the target, scroll it into view, then light it up. */
  useEffect(() => {
    if (!active || !overlay || !step) {
      return undefined;
    }

    let cancelled = false;
    const bounds = { w: overlay.w, h: overlay.h };
    const ids = toIds(step.target);
    const pad = step.pad ?? DEFAULT_PAD;
    const radius = step.radius ?? DEFAULT_RADIUS;

    cardIn.value = withTiming(0, { duration: reduced ? 0 : 120 });

    const measureAll = async (): Promise<Rect | null> => {
      const rects = await Promise.all(
        ids.map((id) => measureNode(getTarget(id) as unknown as Measurable)),
      );

      return unionRects(rects.filter((rect): rect is Rect => rect !== null));
    };

    const toLocal = (rect: Rect): Rect => ({
      x: rect.x - overlay.x,
      y: rect.y - overlay.y,
      w: rect.w,
      h: rect.h,
    });

    const run = async () => {
      let spot: Rect | null = null;

      if (ids.length > 0) {
        let raw = await measureAll();

        if (cancelled) {
          return;
        }

        if (!raw) {
          /* The screen may still be settling; look once more before giving up. */
          await sleep(250);

          if (cancelled) {
            return;
          }

          raw = await measureAll();

          if (cancelled) {
            return;
          }
        }

        if (raw) {
          const scroller = step.fixed ? null : getScroller();

          if (scroller) {
            const area = {
              top: insets.top + 12,
              bottom: overlay.h - reserved - 12,
            };
            const local = toLocal(raw);

            if (needsScroll(local, area)) {
              const delta = scrollDelta(local, area);

              if (Math.abs(delta) > 6) {
                scroller.scrollTo(Math.max(0, scroller.getOffset() + delta));
                await sleep(reduced ? 60 : SCROLL_SETTLE);

                if (cancelled) {
                  return;
                }

                raw = (await measureAll()) ?? raw;

                if (cancelled) {
                  return;
                }
              }
            }
          }

          spot = padRect(toLocal(raw), pad, bounds);
        }
      }

      setPlaced({ key, spot });
      moveSpotlight(spot, radius, true);

      /* Entrance animations of the screen can still move things; look again once they are done. */
      if (spot) {
        await sleep(450);

        if (cancelled) {
          return;
        }

        const again = await measureAll();

        if (cancelled || !again) {
          return;
        }

        const next = padRect(toLocal(again), pad, bounds);
        const moved =
          Math.abs(next.x - spot.x) +
          Math.abs(next.y - spot.y) +
          Math.abs(next.w - spot.w) +
          Math.abs(next.h - spot.h);

        if (moved > 3) {
          setPlaced({ key, spot: next });
          moveSpotlight(next, radius, false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index, overlay, step, key]);

  const dimProps = useAnimatedProps(() => ({
    d:
      `M0 0H${overlayW.value}V${overlayH.value}H0Z` +
      roundedRectPath(
        holeX.value,
        holeY.value,
        holeW.value,
        holeH.value,
        holeR.value,
      ),
  }));

  const ringProps = useAnimatedProps(() => ({
    d: roundedRectPath(
      holeX.value,
      holeY.value,
      holeW.value,
      holeH.value,
      holeR.value,
    ),
    strokeOpacity: ring.value * (0.55 + 0.45 * pulse.value),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardIn.value,
    transform: [{ translateY: (1 - cardIn.value) * 10 }],
  }));

  if (!active || !enabled || !step) {
    return null;
  }

  const ui = GUIDE_UI[language];
  const Icon = step.icon;
  const Forward = isRTL ? ChevronLeft : ChevronRight;
  const Back = isRTL ? ChevronRight : ChevronLeft;
  const number = (value: number) => formatNumber(value, language);
  const doneLabel = step.doneLabel?.[language] ?? ui.done;
  const title = step.title[language];
  const body = step.body[language];

  const settled = placed.key === key;
  const staticSpot = settled ? placed.spot : null;
  const cardWidth = overlay
    ? Math.min(CARD_MAX_WIDTH, overlay.w - CARD_MARGIN * 2)
    : CARD_MAX_WIDTH;
  const placement = overlay
    ? placeCard(
        settled ? placed.spot : null,
        { w: cardWidth, h: cardHeight },
        { top: insets.top + 12, bottom: overlay.h - reserved - 12 },
        { w: overlay.w },
      )
    : null;

  return (
    <View
      ref={overlayRef}
      collapsable={false}
      style={[StyleSheet.absoluteFill, styles.overlay]}
      onLayout={onLayout}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      {overlay ? (
        <Svg
          width={overlay.w}
          height={overlay.h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          {ANIMATE_SPOTLIGHT ? (
            <>
              <AnimatedPath
                animatedProps={dimProps}
                fill={DIM}
                fillRule="evenodd"
              />
              <AnimatedPath
                animatedProps={ringProps}
                fill="none"
                stroke={GOLD}
                strokeWidth={2.5}
              />
            </>
          ) : (
            <>
              <Path
                d={
                  `M0 0H${overlay.w}V${overlay.h}H0Z` +
                  (staticSpot
                    ? roundedRectPath(
                        staticSpot.x,
                        staticSpot.y,
                        staticSpot.w,
                        staticSpot.h,
                        step.radius ?? DEFAULT_RADIUS,
                      )
                    : "")
                }
                fill={DIM}
                fillRule="evenodd"
              />
              {staticSpot ? (
                <Path
                  d={roundedRectPath(
                    staticSpot.x,
                    staticSpot.y,
                    staticSpot.w,
                    staticSpot.h,
                    step.radius ?? DEFAULT_RADIUS,
                  )}
                  fill="none"
                  stroke={GOLD}
                  strokeWidth={2.5}
                  strokeOpacity={0.9}
                />
              ) : null}
            </>
          )}
        </Svg>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: DIM }]} />
      )}

      {overlay && placement ? (
        <Animated.View
          pointerEvents={settled ? "auto" : "none"}
          accessibilityLiveRegion="polite"
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.height);

            setCardHeight((previous) => (previous === next ? previous : next));
          }}
          style={[
            styles.card,
            {
              top: placement.top,
              left: placement.left,
              width: cardWidth,
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.primary,
            },
            cardStyle,
          ]}
        >
          {placement.arrowX !== null && placement.side !== "center" ? (
            <View
              style={[
                styles.arrow,
                {
                  left: placement.arrowX,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                placement.side === "below" ? styles.arrowUp : styles.arrowDown,
              ]}
            />
          ) : null}

          <View style={[styles.header, { flexDirection: row }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tint }]}>
              <Icon size={20} color={colors.onTint} strokeWidth={2.1} />
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
          </View>

          <AppText
            variant="bodySmall"
            style={{ color: colors.text, textAlign, lineHeight: 23 }}
          >
            {body}
          </AppText>

          {step.offerDisable ? (
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
            <View style={[styles.side, { flexDirection: row }]}>
              {!isLast ? (
                <SoundPressable
                  accessibilityRole="button"
                  accessibilityLabel={ui.skip}
                  hitSlop={8}
                  onPress={skip}
                  style={styles.skip}
                >
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.textSecondary, fontWeight: "700" }}
                  >
                    {ui.skip}
                  </AppText>
                </SoundPressable>
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

            <View style={[styles.side, { flexDirection: row }]}>
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
                {isLast ? null : <Forward size={18} color={colors.onPrimary} />}
              </SoundPressable>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
    /* The tab bar and the mini player use elevation on Android; stay above them. */
    elevation: Platform.OS === "android" ? 60 : 0,
  },
  card: {
    position: "absolute",
    borderRadius: 22,
    borderWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 24,
  },
  arrow: {
    position: "absolute",
    width: 14,
    height: 14,
    transform: [{ rotate: "45deg" }],
  },
  arrowUp: {
    top: -8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  arrowDown: {
    bottom: -8,
    borderBottomWidth: 1,
    borderRightWidth: 1,
  },
  header: {
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
  },
  disableLink: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  footer: {
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 2,
  },
  side: {
    alignItems: "center",
    gap: 10,
  },
  skip: {
    minHeight: 40,
    justifyContent: "center",
  },
  prev: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  next: {
    minHeight: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
