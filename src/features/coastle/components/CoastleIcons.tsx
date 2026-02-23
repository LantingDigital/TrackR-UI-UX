import React from 'react';
import Svg, { Path, G } from 'react-native-svg';

interface IconProps {
  size: number;
  color: string;
  fillOpacity?: number;
  strokeOpacity?: number;
}

/**
 * Bold geometric checkmark — adapted from SVGRepo checkmark.
 * viewBox 0 0 72 72, scales to `size`.
 */
export const CheckIcon: React.FC<IconProps> = ({
  size,
  color,
  fillOpacity = 0.15,
  strokeOpacity = 0.25,
}) => (
  <Svg width={size} height={size} viewBox="0 0 72 72">
    <Path
      d="M61.5 23.3l-8.013-8.013-25.71 25.71-9.26-9.26-8.013 8.013 17.42 17.44z"
      fill={color}
      fillOpacity={fillOpacity}
    />
    <Path
      d="M10.5 39.76l17.42 17.44 33.58-33.89-8.013-8.013-25.71 25.71-9.26-9.26z"
      fill="none"
      stroke={color}
      strokeOpacity={strokeOpacity}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Bold geometric X mark — two diagonal bars crossing, matching checkmark's weight.
 * Arms ~8 units wide to match checkmark arm thickness.
 */
export const CrossIcon: React.FC<IconProps> = ({
  size,
  color,
  fillOpacity = 0.15,
  strokeOpacity = 0.25,
}) => {
  // Single unified path — traces the X perimeter without self-intersection.
  // 12-point polygon: 4 arm tips + 4 intersection vertices at center.
  const xPath = 'M22 14L36 28 50 14 58 22 44 36 58 50 50 58 36 44 22 58 14 50 28 36 14 22Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Path d={xPath} fill={color} fillOpacity={fillOpacity} />
      <Path
        d={xPath}
        fill="none"
        stroke={color}
        strokeOpacity={strokeOpacity}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

/**
 * Bold geometric up arrow — arrowhead + thick stem, matching checkmark's weight.
 */
export const ArrowUpIcon: React.FC<IconProps> = ({
  size,
  color,
  fillOpacity = 0.15,
  strokeOpacity = 0.25,
}) => (
  <Svg width={size} height={size} viewBox="0 0 72 72">
    <Path
      d="M36 10L58 34 46 34 46 62 26 62 26 34 14 34z"
      fill={color}
      fillOpacity={fillOpacity}
    />
    <Path
      d="M36 10L58 34 46 34 46 62 26 62 26 34 14 34z"
      fill="none"
      stroke={color}
      strokeOpacity={strokeOpacity}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Bold geometric down arrow — flipped up arrow.
 */
export const ArrowDownIcon: React.FC<IconProps> = ({
  size,
  color,
  fillOpacity = 0.15,
  strokeOpacity = 0.25,
}) => (
  <Svg width={size} height={size} viewBox="0 0 72 72">
    <Path
      d="M36 62L58 38 46 38 46 10 26 10 26 38 14 38z"
      fill={color}
      fillOpacity={fillOpacity}
    />
    <Path
      d="M36 62L58 38 46 38 46 10 26 10 26 38 14 38z"
      fill="none"
      stroke={color}
      strokeOpacity={strokeOpacity}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
