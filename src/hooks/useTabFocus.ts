/**
 * useTabFocus Hook
 *
 * Wraps React Navigation's useFocusEffect to provide focus/blur callbacks.
 * The tabName parameter is kept for API compatibility but not used —
 * the hook automatically fires for whichever screen it's rendered in.
 */

import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useTabFocus(
  _tabName: string,
  onFocus?: () => void,
  onBlur?: () => void,
): void {
  useFocusEffect(
    useCallback(() => {
      onFocus?.();
      return () => { onBlur?.(); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );
}
