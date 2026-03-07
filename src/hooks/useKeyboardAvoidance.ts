/**
 * useKeyboardAvoidance
 *
 * A reusable hook that smoothly scrolls a ScrollView so the currently focused
 * TextInput sits just above the keyboard. Uses react-native-reanimated for
 * buttery-smooth 60fps animations (withTiming + Easing.out).
 *
 * Usage:
 *   const { scrollRef, scrollHandler, handleInputFocus, keyboardPadding } =
 *     useKeyboardAvoidance();
 *
 *   <Animated.ScrollView ref={scrollRef} onScroll={scrollHandler} ...>
 *     <TextInput onFocus={handleInputFocus} />
 *     ...
 *     <Animated.View style={keyboardPadding} />
 *   </Animated.ScrollView>
 */

import { useCallback, useRef, useEffect } from 'react';
import {
  Keyboard,
  Platform,
  UIManager,
  findNodeHandle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { animations } from '../theme/animations';
import { spacing } from '../theme/spacing';

const KEYBOARD_TIMING = {
  duration: animations.duration.normal, // 300ms
  easing: Easing.out(Easing.cubic),
};

const INPUT_KEYBOARD_GAP = spacing.xl; // 20px above keyboard

export function useKeyboardAvoidance() {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollY = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);
  /** Stores the numeric native node handle of the focused input */
  const focusedNodeHandle = useRef<number | null>(null);
  /** Tracks the keyboard's top Y so we can re-scroll on field switch */
  const keyboardTopY = useRef<number | null>(null);

  const scrollToFocusedInput = useCallback((kbTopY: number) => {
    const nodeHandle = focusedNodeHandle.current;
    if (nodeHandle == null || !scrollRef.current) return;

    UIManager.measureInWindow(nodeHandle, (x, y, width, height) => {
      if (y == null || height == null) return;

      const inputBottom = y + height + INPUT_KEYBOARD_GAP;

      if (inputBottom > kbTopY) {
        const scrollAmount = inputBottom - kbTopY;
        const targetOffset = scrollY.value + scrollAmount;
        (scrollRef.current as any)?.scrollTo?.({
          y: targetOffset,
          animated: true,
        });
      }
    });
  }, [scrollY]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (e) => {
      const kbHeight = e.endCoordinates.height;
      keyboardHeight.value = withTiming(kbHeight, KEYBOARD_TIMING);
      keyboardTopY.current = e.endCoordinates.screenY;

      // Small delay lets the focus event fire first so focusedNodeHandle is set
      setTimeout(() => {
        scrollToFocusedInput(e.endCoordinates.screenY);
      }, 50);
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      keyboardHeight.value = withTiming(0, KEYBOARD_TIMING);
      keyboardTopY.current = null;
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [keyboardHeight, scrollToFocusedInput]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  /**
   * Pass directly to TextInput's onFocus prop.
   * Captures the native node handle for UIManager.measureInWindow.
   * Also re-scrolls when switching fields while the keyboard is already up.
   */
  const handleInputFocus = useCallback((e: any) => {
    // e.target can be a component ref or a native node handle (number)
    const target = e?.target;
    if (target == null) return;

    const handle = typeof target === 'number' ? target : findNodeHandle(target);
    focusedNodeHandle.current = handle;

    // If keyboard is already visible, re-scroll to this new field
    if (keyboardTopY.current != null) {
      setTimeout(() => {
        scrollToFocusedInput(keyboardTopY.current!);
      }, 50);
    }
  }, [scrollToFocusedInput]);

  const keyboardPadding = useAnimatedStyle(() => ({
    height: keyboardHeight.value,
  }));

  return {
    scrollRef,
    scrollHandler,
    handleInputFocus,
    keyboardPadding,
  };
}
