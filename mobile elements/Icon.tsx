// Draws one icon from the list in icons.ts.
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { ICONS } from "./icons";

type IconProps = {
  name: string; // for example "home", "star", "wifi"
  color: string;
  size?: number;
  filled?: boolean;
};

export function Icon({ name, color, size = 22, filled = false }: IconProps) {
  const shapes = ICONS[name] || [];

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes.map(([type, props], index) => {
        const p: any = { ...props };
        if (p.fill === "bg") p.fill = "none";
        if (type === "path") return <Path key={index} {...p} />;
        if (type === "circle") return <Circle key={index} {...p} />;
        return <Rect key={index} {...p} />;
      })}
    </Svg>
  );
}
