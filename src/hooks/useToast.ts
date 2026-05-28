"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Module-level singleton — works across all components without a Provider
let _toasts: Toast[] = [];
const _listeners = new Set<(t: Toast[]) => void>();

function _notify() {
  _listeners.forEach(l => l([..._toasts]));
}

export function addToast(message: string, type: ToastType = "info", duration = 3000) {
  const id = Math.random().toString(36).slice(2);
  _toasts = [..._toasts, { id, message, type }];
  _notify();
  setTimeout(() => {
    _toasts = _toasts.filter(t => t.id !== id);
    _notify();
  }, duration);
}

export function useToasts(): Toast[] {
  const [toasts, setToasts] = useState<Toast[]>(_toasts);
  useEffect(() => {
    _listeners.add(setToasts);
    return () => { _listeners.delete(setToasts); };
  }, []);
  return toasts;
}
