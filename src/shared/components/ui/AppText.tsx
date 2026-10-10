import React from "react";

import {
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from "react-native";

import { Fonts } from "@/core/theme/tokens";

export type AppTextVariant =
  "display" | "h1" | "h2" | "h3" | "body" | "bodySmall" | "caption" | "button";

interface AppTextProps extends RNTextProps {
  children?: React.ReactNode;

  variant?: AppTextVariant;

  style?: StyleProp<TextStyle>;

  forceEnglish?: boolean;

  forcePersian?: boolean;
}

function containsPersian(value: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(value);
}

function extractText(children: React.ReactNode): string {
  if (children === null || children === undefined) {
    return "";
  }

  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => extractText(child)).join("");
  }

  return "";
}

const variantStyles: Record<AppTextVariant, TextStyle> = {
  display: {
    fontFamily: Fonts.persian,
    fontSize: 32,
    lineHeight: 42,
  },

  h1: {
    fontFamily: Fonts.persian,
    fontSize: 28,
    lineHeight: 38,
  },

  h2: {
    fontFamily: Fonts.persian,
    fontSize: 24,
    lineHeight: 34,
  },

  h3: {
    fontFamily: Fonts.persian,
    fontSize: 20,
    lineHeight: 30,
  },

  body: {
    fontFamily: Fonts.persian,
    fontSize: 16,
    lineHeight: 27,
  },

  bodySmall: {
    fontFamily: Fonts.persian,
    fontSize: 14,
    lineHeight: 23,
  },

  caption: {
    fontFamily: Fonts.persian,
    fontSize: 12,
    lineHeight: 20,
  },

  button: {
    fontFamily: Fonts.persian,
    fontSize: 15,
    lineHeight: 24,
  },
};

export function AppText({
  children,

  variant = "body",

  style,

  forceEnglish = false,

  forcePersian = false,

  ...props
}: AppTextProps) {
  const text = extractText(children);

  const hasPersian = containsPersian(text);

  const isPersian = forcePersian || (!forceEnglish && hasPersian);

  const fontFamily = isPersian ? Fonts.persian : Fonts.regular;

  const direction = isPersian ? "rtl" : "ltr";

  return (
    <RNText
      {...props}
      style={[
        variantStyles[variant],

        {
          fontFamily,

          writingDirection: direction,

          textAlign: isPersian ? "right" : undefined,

          fontWeight: undefined,
        },

        styles.base,

        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function PersianText(props: Omit<AppTextProps, "forcePersian">) {
  return <AppText {...props} forcePersian />;
}

export function EnglishText(props: Omit<AppTextProps, "forceEnglish">) {
  return <AppText {...props} forceEnglish />;
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,

    fontWeight: undefined,
  },
});

export default AppText;
