import { useEffect, useState } from "react";

type SaveToastProps = {
  message?: string;
  open: boolean;
  duration?: number; // ms
  onClose?: () => void;
};

export default function SaveToast({
  message = "Saved",
  open,
  duration = 3000,
  onClose,
}: SaveToastProps) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  return (
    // pointer-events-none so it doesn't block clicks; screen readers will still announce
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[60] pointer-events-none"
    >
      <div
        // animate in/out with Tailwind transitions
        className={`transform transition-all duration-200 ease-out scale-100 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div
          className="max-w-xs w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg px-4 py-2 flex items-center gap-3 text-sm pointer-events-none"
          // pointer-events-none intentionally kept so it never interferes
        >
          <svg
            className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="leading-tight text-gray-900 dark:text-gray-100">
            <div className="font-medium">{message}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Changes saved</div>
          </div>
        </div>
      </div>
    </div>
  );
}
