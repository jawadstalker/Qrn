import React from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import {
  BOOK_ASPECT,
  BOOK_COLORS as C,
  BOOK_H,
  BOOK_W,
  CARTOUCHE,
  FRAME_INSET,
  LEFT_PAGE,
  LEFT_TEXT,
  RIGHT_PAGE,
  RIGHT_TEXT,
  SPINE,
  SPINE_BANDS_Y,
  type TextLayout,
} from "@/features/quran/utils/bookMark";

/** The mark is built in layers so the splash can bring them in one by one (3D -> flat). */
export type BookLayer = "cover" | "pages" | "frame" | "text";

export const BOOK_LAYERS: readonly BookLayer[] = [
  "cover",
  "pages",
  "frame",
  "text",
];

interface QuranBookMarkProps {
  /** Width of the open book in px. The height is width / BOOK_ASPECT. */
  width: number;
  /** Draw only these layers (all by default). */
  layers?: readonly BookLayer[];
}

/**
 * Leather border, spine and bands. The border is a frame with the two pages cut out, so this
 * layer never covers the pages: it can fade in over the 3D book without hiding anything.
 */
function Cover() {
  const hole = (page: { x: number; y: number; width: number; height: number }) =>
    `M${page.x} ${page.y}h${page.width}v${page.height}h${-page.width}Z`;

  return (
    <>
      <Path
        d={`M0 0H${BOOK_W}V${BOOK_H}H0Z${hole(LEFT_PAGE)}${hole(RIGHT_PAGE)}`}
        fillRule="evenodd"
        fill="url(#book-cover)"
      />
      <Rect
        x={SPINE.x}
        y={0}
        width={SPINE.width}
        height={BOOK_H}
        fill="url(#book-spine)"
      />
      {SPINE_BANDS_Y.map((y) => (
        <Rect
          key={y}
          x={SPINE.x - 0.4}
          y={y - 1.75}
          width={SPINE.width + 0.8}
          height={3.5}
          fill={C.gold}
        />
      ))}
    </>
  );
}

function Pages() {
  return (
    <>
      {[LEFT_PAGE, RIGHT_PAGE].map((page) => (
        <Rect
          key={page.x}
          x={page.x}
          y={page.y}
          width={page.width}
          height={page.height}
          fill="url(#book-paper)"
        />
      ))}
      {/* The spine sits on top of the left page's inner edge, like in 3D. */}
      <Rect
        x={SPINE.x}
        y={0}
        width={SPINE.width}
        height={BOOK_H}
        fill="url(#book-spine)"
      />
      {SPINE_BANDS_Y.map((y) => (
        <Rect
          key={y}
          x={SPINE.x - 0.4}
          y={y - 1.75}
          width={SPINE.width + 0.8}
          height={3.5}
          fill={C.gold}
        />
      ))}
    </>
  );
}

function Frame() {
  return (
    <>
      {[LEFT_PAGE, RIGHT_PAGE].map((page) => (
        <React.Fragment key={page.x}>
          <Rect
            x={page.x + FRAME_INSET.outer}
            y={page.y + FRAME_INSET.outer}
            width={page.width - FRAME_INSET.outer * 2}
            height={page.height - FRAME_INSET.outer * 2}
            fill="none"
            stroke={C.goldDark}
            strokeWidth={0.8}
          />
          <Rect
            x={page.x + FRAME_INSET.inner}
            y={page.y + FRAME_INSET.inner}
            width={page.width - FRAME_INSET.inner * 2}
            height={page.height - FRAME_INSET.inner * 2}
            fill="none"
            stroke={C.gold}
            strokeWidth={0.45}
          />
        </React.Fragment>
      ))}
      <Rect
        x={CARTOUCHE.x}
        y={CARTOUCHE.y}
        width={CARTOUCHE.width}
        height={CARTOUCHE.height}
        rx={CARTOUCHE.radius}
        fill="#F1E3B8"
        stroke={C.goldDark}
        strokeWidth={0.8}
      />
      <Circle
        cx={CARTOUCHE.x + 5.5}
        cy={CARTOUCHE.y + CARTOUCHE.height / 2}
        r={3}
        fill={C.green}
        stroke={C.gold}
        strokeWidth={0.6}
      />
      <Circle
        cx={CARTOUCHE.x + CARTOUCHE.width - 5.5}
        cy={CARTOUCHE.y + CARTOUCHE.height / 2}
        r={3}
        fill={C.green}
        stroke={C.gold}
        strokeWidth={0.6}
      />
    </>
  );
}

function Ink({ text }: { text: TextLayout }) {
  return (
    <>
      <Path
        d={text.words}
        stroke={C.ink}
        strokeOpacity={0.62}
        strokeWidth={1.15}
        strokeLinecap="round"
        fill="none"
      />
      {text.markers.map(([x, y]) => (
        <Circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={1.5}
          fill={C.cream}
          stroke={C.goldDark}
          strokeWidth={0.55}
        />
      ))}
    </>
  );
}

function Text() {
  return (
    <>
      <Ink text={LEFT_TEXT} />
      <Ink text={RIGHT_TEXT} />
      {/* Surah name in the title cartouche */}
      <Path
        d={`M${CARTOUCHE.x + 22} ${CARTOUCHE.y + CARTOUCHE.height / 2}h28`}
        stroke={C.ink}
        strokeOpacity={0.8}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </>
  );
}

const PARTS: Record<BookLayer, () => React.JSX.Element> = {
  cover: Cover,
  pages: Pages,
  frame: Frame,
  text: Text,
};

export function QuranBookMark({
  width,
  layers = BOOK_LAYERS,
}: QuranBookMarkProps) {
  return (
    <Svg
      width={width}
      height={width / BOOK_ASPECT}
      viewBox={`0 0 ${BOOK_W} ${BOOK_H}`}
    >
      <Defs>
        <LinearGradient id="book-cover" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.greenLight} />
          <Stop offset="1" stopColor={C.greenDark} />
        </LinearGradient>
        {/* Flat light: the 3D spine, unlit, is the plain green. */}
        <LinearGradient id="book-spine" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={C.green} />
          <Stop offset="1" stopColor={C.green} />
        </LinearGradient>
        <RadialGradient id="book-paper" cx="50%" cy="50%" r="75%">
          <Stop offset="0" stopColor={C.cream} />
          <Stop offset="0.55" stopColor="#F3E7C2" />
          <Stop offset="1" stopColor={C.paperShade} />
        </RadialGradient>
      </Defs>
      {layers.map((layer) => {
        const Part = PARTS[layer];

        return <Part key={layer} />;
      })}
    </Svg>
  );
}
