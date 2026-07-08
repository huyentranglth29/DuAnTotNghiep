import React from 'react';
import Svg, {Circle, Line, Path, Rect} from 'react-native-svg';

type IconProps = {
  color: string;
};

type SizedIconProps = IconProps & {
  size: number;
  strokeWidth: number;
};

export function BackIcon() {
  return (
    <Svg width={31} height={31} viewBox="0 0 31 31" fill="none">
      <Path
        d="M19.5 6.5L10.5 15.5l9 9"
        stroke="#ffffff"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PlusIcon({color, size, strokeWidth}: SizedIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Line
        x1={16}
        y1={7}
        x2={16}
        y2={25}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1={7}
        y1={16}
        x2={25}
        y2={16}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function GiftIcon({color, size, strokeWidth}: SizedIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 92 92" fill="none">
      <Rect
        x={18}
        y={38}
        width={56}
        height={34}
        rx={3}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Rect
        x={15}
        y={28}
        width={62}
        height={15}
        rx={3}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Line
        x1={46}
        y1={28}
        x2={46}
        y2={72}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M45.8 28c-10 0-17-3.6-17-10.4 0-5.1 3.8-8.1 8.1-8.1 6.4 0 8.9 7.3 8.9 18.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Path
        d="M46.2 28c10 0 17-3.6 17-10.4 0-5.1-3.8-8.1-8.1-8.1-6.4 0-8.9 7.3-8.9 18.5z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <Line
        x1={20}
        y1={56}
        x2={72}
        y2={56}
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function HistoryIcon({color, size, strokeWidth}: SizedIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 42" fill="none">
      <Path
        d="M8 21a13 13 0 1 0 4-9.4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M8 11.5v9h9"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1={21}
        y1={13}
        x2={21}
        y2={22}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1={21}
        y1={22}
        x2={27}
        y2={25.5}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function QrIcon({color}: IconProps) {
  return (
    <Svg width={31} height={31} viewBox="0 0 31 31" fill="none">
      <Rect x={4} y={4} width={7} height={7} stroke={color} strokeWidth={2} />
      <Rect x={20} y={4} width={7} height={7} stroke={color} strokeWidth={2} />
      <Rect x={4} y={20} width={7} height={7} stroke={color} strokeWidth={2} />
      <Path
        d="M18 18h3v3h-3zM24 18h3v9h-3M17 24h4v3h-4"
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}

export function LockIcon({color}: IconProps) {
  return (
    <Svg width={31} height={31} viewBox="0 0 31 31" fill="none">
      <Rect
        x={7}
        y={14}
        width={17}
        height={13}
        rx={2}
        stroke={color}
        strokeWidth={2.8}
      />
      <Path
        d="M10.5 14v-3.5a5 5 0 0 1 10 0V14"
        stroke={color}
        strokeWidth={2.8}
        strokeLinecap="round"
      />
      <Line
        x1={15.5}
        y1={19}
        x2={15.5}
        y2={22}
        stroke={color}
        strokeWidth={2.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ListIcon({color}: IconProps) {
  return (
    <Svg width={23} height={23} viewBox="0 0 23 23" fill="none">
      <Line x1={8} y1={7} x2={19} y2={7} stroke={color} strokeWidth={2.4} />
      <Line x1={8} y1={12} x2={19} y2={12} stroke={color} strokeWidth={2.4} />
      <Line x1={8} y1={17} x2={19} y2={17} stroke={color} strokeWidth={2.4} />
      <Circle cx={4.5} cy={7} r={1.3} fill={color} />
      <Circle cx={4.5} cy={12} r={1.3} fill={color} />
      <Circle cx={4.5} cy={17} r={1.3} fill={color} />
    </Svg>
  );
}

export function CheckCircleIcon({
  color,
  size,
  strokeWidth,
  filled = false,
}: SizedIconProps & {filled?: boolean}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Circle
        cx={23}
        cy={23}
        r={18}
        fill={filled ? color : 'none'}
        stroke={filled ? 'none' : color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M14 23.5l6 6L33 17"
        stroke={filled ? '#ffffff' : color}
        strokeWidth={filled ? 5 : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ClockIcon({color, size, strokeWidth}: SizedIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 46 46" fill="none">
      <Circle
        cx={23}
        cy={23}
        r={17}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Line
        x1={23}
        y1={13}
        x2={23}
        y2={24}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Line
        x1={23}
        y1={24}
        x2={30}
        y2={29}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function RefreshIcon({color}: IconProps) {
  return (
    <Svg width={25} height={25} viewBox="0 0 25 25" fill="none">
      <Path
        d="M18.5 9.5a6 6 0 1 0 0 6.2"
        stroke={color}
        strokeWidth={2.8}
        strokeLinecap="round"
      />
      <Path
        d="M18.5 5.7v4.8h-4.8"
        stroke={color}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
