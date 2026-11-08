"use client";

import { useCallback, useRef } from "react";

// A modal sheet on the native <dialog>: Escape closes it, the page behind is
// inert and held still (globals.css), and focus goes back to whatever opened it.
export function useSheet() {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ref.current?.showModal();
  }, []);
  const close = useCallback(() => ref.current?.close(), []);
  const props = {
    ref,
    onClose: () => opener.current?.focus(),
    // A click on the backdrop lands on the dialog itself.
    onClick: (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) event.currentTarget.close();
    },
  };
  return { open, close, props };
}
