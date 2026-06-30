import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type MenuIconName =
  | 'voucher'
  | 'member'
  | 'notification'
  | 'career'
  | 'setting';

type MenuIconProps = {
  name: MenuIconName;
  color: string;
};

function MenuIcon({ name, color }: MenuIconProps) {
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34" fill="none">
      {name === 'voucher' && (
        <>
          <Path
            d="M6 10h22v4.4a3.1 3.1 0 0 0 0 5.2V24H6v-4.4a3.1 3.1 0 0 0 0-5.2V10z"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Line
            x1={16}
            y1={11}
            x2={16}
            y2={23}
            stroke={color}
            strokeWidth={2.4}
            strokeDasharray="2 3"
          />
          <TextIcon x={20.3} y={14.2} color={color} />
        </>
      )}

      {name === 'member' && (
        <>
          <Circle cx={17} cy={12} r={5} stroke={color} strokeWidth={3} />
          <Path
            d="M7.5 27c1.9-5 5.2-7.5 9.5-7.5s7.6 2.5 9.5 7.5"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </>
      )}

      {name === 'notification' && (
        <>
          <Path
            d="M10 24h14l-1.8-3.2V15a5.2 5.2 0 0 0-10.4 0v5.8L10 24z"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path
            d="M14.7 27.5a3 3 0 0 0 4.6 0"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </>
      )}

      {name === 'career' && (
        <>
          <Path
            d="M10 6h10l5 5v17H10V6z"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path
            d="M20 6v6h6"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Line
            x1={14}
            y1={17}
            x2={22}
            y2={17}
            stroke={color}
            strokeWidth={3}
          />
          <Line
            x1={14}
            y1={22}
            x2={21}
            y2={22}
            stroke={color}
            strokeWidth={3}
          />
        </>
      )}

      {name === 'setting' && (
        <>
          <Path
            d="M18.8 5.5l1 3.1 2.9 1.2 3-1.4 2.2 3.8-2.6 1.9v3.4l2.6 1.9-2.2 3.8-3-1.4-2.9 1.2-1 3.1h-4.4l-1-3.1-2.9-1.2-3 1.4-2.2-3.8 2.6-1.9v-3.4l-2.6-1.9 2.2-3.8 3 1.4 2.9-1.2 1-3.1h4.4z"
            fill={color}
          />
          <Circle cx={17} cy={17} r={4} fill="#ffffff" />
        </>
      )}
    </Svg>
  );
}

function TextIcon({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <>
      <Rect x={x} y={y - 4.2} width={6.6} height={4.6} rx={0.8} fill={color} />
      <Line
        x1={x + 1.2}
        y1={y - 1.9}
        x2={x + 5.4}
        y2={y - 1.9}
        stroke="#fff"
        strokeWidth={0.7}
      />
    </>
  );
}

export default MenuIcon;
