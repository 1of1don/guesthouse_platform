// A simple drawn picture of a house, used until you have real photos.
// To use real photos later, replace <Art /> with <Image source={{ uri: "..." }} />.
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Path } from "react-native-svg";
import type { Stay } from "./data";

export function Art({ stay }: { stay: Stay }) {
  const [skyTop, skyBottom, ground, roof] = stay.sky;
  const gradientId = "sky" + stay.id;
  const sunX = 60 + ((stay.id * 53) % 190); // moves the sun so each stay looks different

  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={skyTop} />
          <Stop offset="1" stopColor={skyBottom} />
        </LinearGradient>
      </Defs>
      <Rect width="300" height="200" fill={`url(#${gradientId})`} />
      <Circle cx={sunX} cy={50} r="22" fill="#fff" opacity={0.75} />
      <Path d="M0 150Q80 112 150 140T300 125V200H0z" fill={ground} />
      <Path d="M110 152v-30l40-26 40 26v30z" fill="#fff" opacity={0.93} />
      <Path d="M103 123l47-31 47 31" stroke={roof} strokeWidth="9" fill="none" strokeLinejoin="round" />
      <Rect x="143" y="134" width="15" height="18" fill={roof} />
      <Rect x="118" y="128" width="12" height="10" fill={skyBottom} />
    </Svg>
  );
}
