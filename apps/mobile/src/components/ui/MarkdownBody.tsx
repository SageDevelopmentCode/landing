import { FontFamilies, Brand } from "@/constants/theme";
import { splitFeedBodyLead } from "@/lib/feedBodyLead";
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

// Garden (parent redesign) typography: Nunito + warm ink. Opt in with `garden`.
const G = {
  body: "Nunito_400Regular",
  semi: "Nunito_700Bold",
  heavy: "Nunito_800ExtraBold",
  display: "BricolageGrotesque_800ExtraBold",
  ink: "#2b2a26",
  soft: "#5b5850",
  sage: "#4a6354",
};
const gardenMarkdownStyles = {
  ...markdownStyles,
  body: { ...markdownStyles.body, fontFamily: G.body, fontSize: 15, color: G.soft, lineHeight: 23 },
  strong: { ...markdownStyles.strong, fontFamily: G.heavy },
  heading1: { ...markdownStyles.heading1, fontFamily: G.display, color: G.ink },
  heading2: { ...markdownStyles.heading2, fontFamily: G.display, color: G.ink },
  heading3: { ...markdownStyles.heading3, fontFamily: G.heavy, color: G.ink },
  list_item: { ...markdownStyles.list_item, fontFamily: G.body, fontSize: 15, color: G.soft },
  link: { color: G.sage, fontFamily: G.semi, textDecorationLine: "underline" as const },
  blockquote: { ...markdownStyles.blockquote, borderLeftColor: "#6b9474" },
};

interface Props {
  body: string;
  collapsible?: boolean;
  previewLength?: number;
  leadBold?: boolean;
  /** Use Garden fonts/colours (parent redesign). */
  garden?: boolean;
}

export function MarkdownBody({
  body,
  collapsible = false,
  previewLength = 280,
  leadBold = false,
  garden = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const decoded = decodeEntities(body);
  const { lead, rest } = leadBold ? splitFeedBodyLead(decoded) : { lead: null, rest: decoded };
  const mainBody = lead ? rest : decoded;
  const needsTruncation = collapsible && mainBody.length > previewLength;
  const displayBody =
    needsTruncation && !expanded
      ? mainBody.slice(0, previewLength).replace(/\s+\S*$/, "") + "…"
      : mainBody;

  return (
    <View>
      {lead && (
        <Text
          style={
            garden
              ? { fontFamily: G.heavy, fontSize: 16, color: G.ink, lineHeight: 23, marginBottom: 6 }
              : {
                  fontFamily: FontFamilies.bodySemiBold,
                  fontSize: 15,
                  color: "#1f2937",
                  lineHeight: 23,
                  marginBottom: 6,
                }
          }
        >
          {lead}
        </Text>
      )}
      {displayBody.length > 0 && <Markdown style={garden ? gardenMarkdownStyles : markdownStyles}>{displayBody}</Markdown>}
      {needsTruncation && (
        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          activeOpacity={0.7}
          hitSlop={garden ? 12 : undefined}
          accessibilityRole="button"
        >
          <Text
            style={
              garden
                ? { fontFamily: G.heavy, fontSize: 14, color: G.sage, marginTop: 2 }
                : {
                    fontFamily: FontFamilies.bodySemiBold,
                    fontSize: 13,
                    color: Brand.sage700,
                    marginTop: 2,
                  }
            }
          >
            {expanded ? "Show less" : "Read more"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
