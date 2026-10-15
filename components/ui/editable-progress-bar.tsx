import { useState, useEffect } from "react";

interface EditableProgressBarProps {
  progress: number;
  leftLabel: string;
  rightLabel: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
  onChange?: (newProgress: number) => void;
}

export default function EditableProgressBar({
  progress: controlledProgress,
  leftLabel,
  rightLabel,
  width = "100%",
  height = "16px",
  style,
  onChange,
}: EditableProgressBarProps) {
  const [progress, setProgress] = useState(controlledProgress);

  // 🔥 Sync internal state whenever parent updates the prop
  useEffect(() => {
    setProgress(controlledProgress);
  }, [controlledProgress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setProgress(newValue);
    if (onChange) onChange(newValue);
  };

  return (
    <div style={style}>
      <div style={{ width, marginBottom: "6px", fontFamily: "sans-serif" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>

        <div
          style={{
            width: "100%",
            height,
            backgroundColor: "#D8D7D7",
            borderRadius: "8px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#DC3C05",
              borderRadius: "8px 0 0 8px",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `${progress}%`,
              transform: "translate(-50%, -50%)",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              border: "3px solid #DC3C05",
            }}
          />

          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={handleChange}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </div>
      </div>
    </div>
  );
}
