import { useCallback, useMemo, useState } from "react";

export type MatchDirection = "left" | "right";

type HistoryEntry = {
  index: number;
  direction: MatchDirection;
};

type DeckState<T> = {
  items: T[];
  index: number;
  history: HistoryEntry[];
  isAnimating: boolean;
  direction: MatchDirection | null;
};

const initialState = <T,>(): DeckState<T> => ({
  items: [],
  index: 0,
  history: [],
  isAnimating: false,
  direction: null,
});

/**
 * Controla o estado do deck de match (pilha de sugestões).
 * Mantém histórico para rollback em caso de erro.
 */
export const useMatchDeck = <T,>() => {
  const [state, setState] = useState<DeckState<T>>(initialState);

  const replaceItems = useCallback((items: T[]) => {
    setState(() => ({
      ...initialState<T>(),
      items,
    }));
  }, []);

  const current = useMemo(
    () => (state.index < state.items.length ? state.items[state.index] : null),
    [state.index, state.items],
  );

  const nextItems = useMemo(
    () =>
      state.index < state.items.length
        ? state.items.slice(state.index + 1, state.index + 3)
        : [],
    [state.index, state.items],
  );

  const advance = useCallback(
    (direction: MatchDirection) => {
      setState((prev) => {
        if (prev.index >= prev.items.length) {
          return prev;
        }
        return {
          ...prev,
          index: Math.min(prev.index + 1, prev.items.length),
          history: [...prev.history, { index: prev.index, direction }],
          direction,
        };
      });
    },
    [],
  );

  const restore = useCallback(() => {
    setState((prev) => {
      if (prev.history.length === 0) {
        return prev;
      }
      const history = prev.history.slice(0, -1);
      const last = prev.history[prev.history.length - 1];
      return {
        ...prev,
        index: last.index,
        history,
        direction: null,
      };
    });
  }, []);

  const setAnimating = useCallback((value: boolean) => {
    setState((prev) => ({
      ...prev,
      isAnimating: value,
    }));
  }, []);

  const resetDirection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      direction: null,
    }));
  }, []);

  return {
    items: state.items,
    current,
    nextItems,
    index: state.index,
    total: state.items.length,
    direction: state.direction,
    isAnimating: state.isAnimating,
    replaceItems,
    advance,
    restore,
    setAnimating,
    resetDirection,
  };
};

export type MatchDeckController<T> = ReturnType<typeof useMatchDeck<T>>;
