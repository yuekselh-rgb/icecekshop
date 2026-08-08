"use client";

import { useEffect } from "react";

export default function AutoPrint() {
  useEffect(() => {
    const printTimer = setTimeout(() => {
      window.print();
    }, 300);

    function handleAfterPrint() {
      window.close();
    }

    window.addEventListener("afterprint", handleAfterPrint);

    /*
     * afterprint doesn't fire reliably in every mobile browser's
     * print/share sheet, so fall back to closing after a generous
     * delay instead of racing the dialog with a short fixed timeout.
     */
    const fallbackTimer = setTimeout(() => {
      window.close();
    }, 60000);

    return () => {
      clearTimeout(printTimer);
      clearTimeout(fallbackTimer);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  return null;
}
