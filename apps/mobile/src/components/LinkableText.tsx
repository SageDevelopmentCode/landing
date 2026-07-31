import { Linking, Text, TextStyle } from "react-native";
import { parseLinks } from "@/utils/linkUtils";

type Props = {
  children: string;
  style?: TextStyle | TextStyle[];
  linkStyle?: TextStyle | TextStyle[];
  numberOfLines?: number;
};

export function LinkableText({ children, style, linkStyle, numberOfLines }: Props) {
  const segments = parseLinks(children);

  if (segments.length === 1 && segments[0].type === "text") {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {children}
      </Text>
    );
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((seg, i) =>
        seg.type === "url" ? (
          <Text key={i} style={linkStyle} onPress={() => Linking.openURL(seg.value)}>
            {seg.value}
          </Text>
        ) : (
          <Text key={i}>{seg.value}</Text>
        )
      )}
    </Text>
  );
}
