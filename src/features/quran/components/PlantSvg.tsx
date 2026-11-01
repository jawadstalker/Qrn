import React, { useEffect, useMemo } from "react";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Ellipse, G, Path, Rect } from "react-native-svg";

const VIEW_WIDTH = 240;
const VIEW_HEIGHT = 310;
const STEM_PATH = "M120 242 C 114 205, 128 170, 121 132 S 116 70, 124 34";
const LEAF_PATH = "M0 0 C 10 -16 34 -20 50 -6 C 40 10 14 14 0 0 Z";
const LEAF_COLORS = ["#3F8A63", "#5DAA7F", "#2F6B4F", "#6DB88D"];
const NEW_LEAF_COLOR = "#8FD1A8";
const LEAF_POSITIONS = [0.1, 0.42, 0.74];
/** Blossoms in the order they open: bottom, middle (short stalks), then the top tip. */
const BLOSSOM_SLOTS = [
  { at: 0.3, dx: 36, dy: -12, size: 0.62 },
  { at: 0.6, dx: -38, dy: -14, size: 0.74 },
] as const;
const TOP_BLOSSOM = { x: 124, y: 32, size: 1 } as const;
/** When something new was added, the pot drops in first and the rest waits for it. */
const ENTRY_MS = 700;
const POP_SPRING = { damping: 9, stiffness: 150, mass: 0.7 };

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Point {
  x: number;
  y: number;
}

function cubic(
  p0: Point,
  c1: Point,
  c2: Point,
  p1: Point,
  steps: number,
): Point[] {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const u = 1 - t;

    return {
      x:
        u * u * u * p0.x +
        3 * u * u * t * c1.x +
        3 * u * t * t * c2.x +
        t * t * t * p1.x,
      y:
        u * u * u * p0.y +
        3 * u * u * t * c1.y +
        3 * u * t * t * c2.y +
        t * t * t * p1.y,
    };
  });
}

const STEM_POINTS: Point[] = [
  ...cubic(
    { x: 120, y: 242 },
    { x: 114, y: 205 },
    { x: 128, y: 170 },
    { x: 121, y: 132 },
    40,
  ),
  ...cubic(
    { x: 121, y: 132 },
    { x: 114, y: 94 },
    { x: 116, y: 70 },
    { x: 124, y: 34 },
    40,
  ).slice(1),
];

const STEM_LENGTH =
  STEM_POINTS.reduce(
    (total, point, index) =>
      index === 0
        ? 0
        : total +
          Math.hypot(
            point.x - STEM_POINTS[index - 1]!.x,
            point.y - STEM_POINTS[index - 1]!.y,
          ),
    0,
  ) * 1.03;

function pointAt(fraction: number): Point {
  const index = Math.min(
    Math.floor(fraction * (STEM_POINTS.length - 1)),
    STEM_POINTS.length - 1,
  );

  return STEM_POINTS[index]!;
}

function Leaf({
  index,
  position,
  isNew,
  reduced,
  lead,
}: {
  index: number;
  position: Point;
  isNew: boolean;
  reduced: boolean;
  lead: number;
}) {
  const progress = useSharedValue(reduced ? 1 : 0);
  const side = index % 2 === 0 ? 1 : -1;
  const size = 1.05 - 0.05 * index;

  useEffect(() => {
    if (!reduced) {
      progress.value = withDelay(
        lead + 500 + index * 160,
        withSpring(1, POP_SPRING),
      );
    }
  }, [index, lead, progress, reduced]);

  const animatedProps = useAnimatedProps(() => ({
    scale: Math.max(progress.value, 0.001),
  }));

  return (
    <G
      x={position.x}
      y={position.y}
      scaleX={side * size}
      scaleY={size}
      rotation={-24 * side}
    >
      <AnimatedG animatedProps={animatedProps}>
        <Path
          d={LEAF_PATH}
          fill={
            isNew ? NEW_LEAF_COLOR : LEAF_COLORS[index % LEAF_COLORS.length]
          }
        />
      </AnimatedG>
    </G>
  );
}

function Flower({
  x,
  y,
  size,
  delay,
  reduced,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  reduced: boolean;
}) {
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) {
      progress.value = withDelay(
        delay,
        withSpring(1, { damping: 8, stiffness: 90, mass: 0.9 }),
      );
    }
  }, [delay, progress, reduced]);

  const animatedProps = useAnimatedProps(() => ({
    scale: Math.max(progress.value, 0.001),
    rotation: (1 - progress.value) * -70,
  }));
  const petals = useMemo(() => [0, 60, 120, 180, 240, 300], []);

  return (
    <G x={x} y={y} scale={size}>
      <AnimatedG animatedProps={animatedProps}>
        {petals.map((angle) => (
          <Ellipse
            key={angle}
            cx={0}
            cy={-13}
            rx={7.5}
            ry={13}
            fill="#F2A7B8"
            rotation={angle}
          />
        ))}
        <Ellipse cx={0} cy={0} rx={7} ry={7} fill="#E8B96A" />
      </AnimatedG>
    </G>
  );
}

interface PlantSvgProps {
  width: number;
  leaves: number;
  flowers: number;
  hasNewLeaf?: boolean;
  newBlossom?: boolean;
}

export function PlantSvg({
  width,
  leaves,
  flowers,
  hasNewLeaf = false,
  newBlossom = false,
}: PlantSvgProps) {
  const reduced = useReducedMotion();
  const lead = !reduced && (hasNewLeaf || newBlossom) ? ENTRY_MS : 0;
  const draw = useSharedValue(reduced ? 0 : STEM_LENGTH);
  const sway = useSharedValue(0);
  const potDrop = useSharedValue(lead > 0 ? -90 : 0);
  const height = (width * VIEW_HEIGHT) / VIEW_WIDTH;
  const count = Math.min(leaves, LEAF_POSITIONS.length);

  useEffect(() => {
    if (reduced) {
      return;
    }

    if (lead > 0) {
      potDrop.value = withSpring(0, { damping: 9, stiffness: 120, mass: 0.8 });
    }

    draw.value = withDelay(
      lead + 200,
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) }),
    );
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [draw, lead, potDrop, reduced, sway]);

  const potProps = useAnimatedProps(() => ({ y: potDrop.value }));
  const stemProps = useAnimatedProps(() => ({ strokeDashoffset: draw.value }));
  const swayStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sway.value * 1.6}deg` }],
  }));
  const sideCount = Math.min(Math.max(flowers, 0), BLOSSOM_SLOTS.length);
  const sideSlots = BLOSSOM_SLOTS.slice(0, sideCount);
  const showTop = flowers >= BLOSSOM_SLOTS.length + 1;

  return (
    <Animated.View style={[{ width, height }, swayStyle]}>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      >
        <AnimatedG animatedProps={potProps}>
          <Path
            d="M72 252 L168 252 L158 296 Q157 300 153 300 L87 300 Q83 300 82 296 Z"
            fill="#C98B5E"
          />
          <Rect x={64} y={238} width={112} height={18} rx={7} fill="#B97A4F" />
          <Ellipse cx={120} cy={241} rx={50} ry={6} fill="#5E4230" />
        </AnimatedG>
        <AnimatedPath
          d={STEM_PATH}
          stroke="#2F6B4F"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={[STEM_LENGTH, STEM_LENGTH]}
          animatedProps={stemProps}
          fill="none"
        />
        {sideSlots.map((slot, index) => {
          const start = pointAt(slot.at);

          return (
            <Path
              key={`stalk-${index}`}
              d={`M${start.x} ${start.y} C ${start.x + slot.dx * 0.4} ${start.y + slot.dy * 0.1}, ${start.x + slot.dx * 0.75} ${start.y + slot.dy * 0.7}, ${start.x + slot.dx} ${start.y + slot.dy}`}
              stroke="#2F6B4F"
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
        {Array.from({ length: count }, (_, index) => (
          <Leaf
            key={index}
            index={index}
            position={pointAt(LEAF_POSITIONS[index]!)}
            isNew={hasNewLeaf && index === count - 1}
            reduced={reduced}
            lead={lead}
          />
        ))}
        {sideSlots.map((slot, index) => {
          const start = pointAt(slot.at);

          return (
            <Flower
              key={`blossom-${index}`}
              x={start.x + slot.dx}
              y={start.y + slot.dy}
              size={slot.size}
              delay={lead + 1500 + index * 350}
              reduced={reduced}
            />
          );
        })}
        {showTop ? (
          <Flower
            x={TOP_BLOSSOM.x}
            y={TOP_BLOSSOM.y}
            size={TOP_BLOSSOM.size}
            delay={lead + 1500 + BLOSSOM_SLOTS.length * 350}
            reduced={reduced}
          />
        ) : null}
      </Svg>
    </Animated.View>
  );
}
