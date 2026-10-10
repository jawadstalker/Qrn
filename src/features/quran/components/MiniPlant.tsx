import React from "react";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";

export type MiniPlantState = "seed" | "sprout" | "leafy" | "flower";

const LEAF = "M0 0 C 4 -7 14 -9 20 -3 C 16 4 6 6 0 0 Z";
const PETAL_ANGLES = [0, 72, 144, 216, 288];

function MiniLeaf({
  x,
  y,
  side,
  color,
}: {
  x: number;
  y: number;
  side: 1 | -1;
  color: string;
}) {
  return (
    <G x={x} y={y} scaleX={side} rotation={-24 * side}>
      <Path d={LEAF} fill={color} />
    </G>
  );
}

export function MiniPlant({
  state,
  size = 44,
}: {
  state: MiniPlantState;
  size?: number;
}) {
  const stemTop = state === "sprout" ? 26 : 14;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Ellipse cx={24} cy={38} rx={14} ry={4} fill="#5E4230" />
      {state === "seed" ? (
        <Ellipse cx={24} cy={34} rx={4} ry={3} fill="#8A6A4A" />
      ) : null}
      {state !== "seed" ? (
        <Path
          d={`M24 38 V${stemTop}`}
          stroke="#2F6B4F"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ) : null}
      {state === "sprout" ? (
        <>
          <MiniLeaf x={24} y={28} side={1} color="#5DAA7F" />
          <MiniLeaf x={24} y={28} side={-1} color="#3F8A63" />
        </>
      ) : null}
      {state === "leafy" || state === "flower" ? (
        <>
          <MiniLeaf x={24} y={32} side={1} color="#5DAA7F" />
          <MiniLeaf x={24} y={25} side={-1} color="#3F8A63" />
        </>
      ) : null}
      {state === "leafy" ? (
        <>
          <MiniLeaf x={24} y={19} side={1} color="#6DB88D" />
          <MiniLeaf x={24} y={14} side={-1} color="#2F6B4F" />
        </>
      ) : null}
      {state === "flower" ? (
        <>
          {PETAL_ANGLES.map((angle) => (
            <G key={angle} x={24} y={12} rotation={angle}>
              <Ellipse cx={0} cy={-5} rx={3} ry={5.5} fill="#F2A7B8" />
            </G>
          ))}
          <Circle cx={24} cy={12} r={3} fill="#E8B96A" />
        </>
      ) : null}
    </Svg>
  );
}
