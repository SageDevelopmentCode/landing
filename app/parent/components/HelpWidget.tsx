"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type HelpWidgetClient from "./HelpWidgetClient";

const HelpWidget = dynamic(() => import("./HelpWidgetClient"), { ssr: false });

export default HelpWidget;
export type HelpWidgetProps = ComponentProps<typeof HelpWidgetClient>;
