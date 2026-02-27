import { useRef, useCallback } from 'react';

const MAX_HISTORY = 100;

export default function useHistory() {
  const stack = useRef([]);   // array of snapshots
  const pointer = useRef(-1); // index into stack

  const push = useCallback((snapshot) => {
    // If we're not at the tip, truncate the future
    stack.current = stack.current.slice(0, pointer.current + 1);
    stack.current.push(JSON.parse(JSON.stringify(snapshot)));
    if (stack.current.length > MAX_HISTORY) {
      stack.current.shift();
    } else {
      pointer.current += 1;
    }
  }, []);

  const canUndo = useCallback(() => pointer.current > 0, []);
  const canRedo = useCallback(() => pointer.current < stack.current.length - 1, []);

  const undo = useCallback(() => {
    if (pointer.current > 0) {
      pointer.current -= 1;
      return JSON.parse(JSON.stringify(stack.current[pointer.current]));
    }
    return null;
  }, []);

  const redo = useCallback(() => {
    if (pointer.current < stack.current.length - 1) {
      pointer.current += 1;
      return JSON.parse(JSON.stringify(stack.current[pointer.current]));
    }
    return null;
  }, []);

  return { push, undo, redo, canUndo, canRedo };
}
