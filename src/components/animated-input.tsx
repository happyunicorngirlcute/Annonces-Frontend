import { forwardRef, useCallback } from "react";
import { Platform, StyleSheet, TextInput, type TextInputProps } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/use-theme";

const ANIM = { duration: 220, easing: Easing.bezier(0.16, 1, 0.3, 1) };

export type AnimatedInputProps = TextInputProps & {
  containerStyle?: any;
};

export const AnimatedInput = forwardRef<TextInput, AnimatedInputProps>(
  function AnimatedInput({ style, containerStyle, onFocus, onBlur, ...props }, ref) {
    const theme = useTheme();
    const focus = useSharedValue(0);

    const handleFocus = useCallback(
      (e: any) => {
        focus.value = withTiming(1, ANIM);
        onFocus?.(e);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (e: any) => {
        focus.value = withTiming(0, ANIM);
        onBlur?.(e);
      },
      [onBlur],
    );

    const borderStyle = useAnimatedStyle(() => ({
      borderColor: interpolateColor(
        focus.value,
        [0, 1],
        [theme.accentDim, theme.accent],
      ) as string,
      borderWidth: interpolate(focus.value, [0, 1], [1, 1.5]),
      backgroundColor: interpolateColor(
        focus.value,
        [0, 1],
        [theme.backgroundElement, theme.backgroundSelected],
      ) as string,
      ...(Platform.OS === "web"
        ? {
            boxShadow:
              focus.value > 0
                ? `0 0 ${interpolate(focus.value, [0, 1], [0, 14])}px ${interpolate(focus.value, [0, 1], [0, 6])}px ${theme.accent}33`
                : "none",
          }
        : {}),
    }));

    return (
      <Animated.View style={[styles.container, borderStyle, containerStyle]}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            { color: theme.text },
            Platform.OS === "web" && ({ outline: "none" } as any),
            style,
          ]}
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.accent}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "400",
  },
});
