"use client";

import { useState, useEffect } from "react";

let toastSubscriber = null;

export function showToast(message, type = "success") {
  if (toastSubscriber) {
    toastSubscriber({ id: Date.now(), message, type });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastSubscriber = (toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3200);
    };

    return () => {
      toastSubscriber = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-bubble toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "info" ? "ℹ" : "★"}
          </span>
          <span className="toast-text">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
