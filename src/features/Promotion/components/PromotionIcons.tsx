import React from 'react';
import Svg, {Circle, Line, Path} from 'react-native-svg';

export function BackIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Path
        d="M17.5 5.5L9 14l8.5 8.5"
        stroke="#ffffff"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShareIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Circle cx={8} cy={15} r={3.2} fill="#ffffff" />
      <Circle cx={22} cy={8} r={3.2} fill="#ffffff" />
      <Circle cx={22} cy={22} r={3.2} fill="#ffffff" />
      <Line
        x1={10.8}
        y1={13.6}
        x2={19.3}
        y2={9.5}
        stroke="#ffffff"
        strokeWidth={3}
      />
      <Line
        x1={10.8}
        y1={16.4}
        x2={19.3}
        y2={20.5}
        stroke="#ffffff"
        strokeWidth={3}
      />
    </Svg>
  );
}
