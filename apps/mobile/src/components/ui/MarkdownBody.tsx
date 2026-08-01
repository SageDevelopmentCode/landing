import { FontFamilies, Brand } from "@/constants/theme";
import { useState } from "react";
import { TouchableOpacity, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

const HTML_ENTITIES: Record<string, string> = {
  "&nbsp;": "",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
};

function decodeEntities(str: string): string {
  return str.replace(/&[a-z#0-9]+;/gi, (entity) => HTML_ENTITIES[entity] ?? entity);
}

const markdownStyles = {
  // body cascades as lowest-priority base — heading/strong/em overrides win
  body: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 10,
  },
  // text must be empty so cascaded heading fontSize / strong fontFamily aren't overridden
  text: {},
  strong: {
    fontFamily: FontFamilies.bodySemiBold,
    fontWeight: "normal" as const, // override library default 'bold' which breaks custom font lookup
  },
  em: {
    fontStyle: "italic" as const,
  },
  heading1: {
    fontFamily: FontFamilies.heading,
    fontSize: 20,
    color: "#1f2937",
    marginTop: 8,
    marginBottom: 4,
  },
  heading2: {
    fontFamily: FontFamilies.heading,
    fontSize: 17,
    color: "#1f2937",
    marginTop: 8,
    marginBottom: 4,
  },
  heading3: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 15,
    color: "#1f2937",
    marginTop: 6,
    marginBottom: 2,
  },
  bullet_list: {
    marginBottom: 4,
  },
  ordered_list: {
    marginBottom: 4,
  },
  list_item: {
    marginBottom: 2,
    fontFamily: FontFamilies.body,
    fontSize: 14,
    color: "#374151",
  },
  code_inline: {
    fontFamily: "Courier",
    fontSize: 13,
    backgroundColor: "#f3f4f6",
    color: "#374151",
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  fence: {
    fontFamily: "Courier",
    fontSize: 13,
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: Brand.sage700,
    paddingLeft: 10,
    marginVertical: 4,
    opacity: 0.85,
  },
};

interface Props {
  body: string;
  collapsible?: boolean;
  previewLength?: number;
}

export function MarkdownBody({ body, collapsible = false, previewLength = 280 }: Props) {
  const [expanded, setExpanded] = useState(false);
  const decoded = decodeEntities(body);
  const needsTruncation = collapsible && decoded.length > previewLength;
  const displayBody =
    needsTruncation && !expanded
      ? decoded.slice(0, previewLength).replace(/\s+\S*$/, "") + "…"
      : decoded;

  return (
    <View>
      <Markdown style={markdownStyles}>{displayBody}</Markdown>
      {needsTruncation && (
        <TouchableOpacity onPress={() => setExpanded((v) => !v)} activeOpacity={0.7}>
          <Text
            style={{
              fontFamily: FontFamilies.bodySemiBold,
              fontSize: 13,
              color: Brand.sage700,
              marginTop: 2,
            }}
          >
            {expanded ? "Show less" : "Read more"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
