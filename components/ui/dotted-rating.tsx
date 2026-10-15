import React from "react";

interface DottedRatingProps {
  progress: number; // 0–10
  leftLabel: string;
  width?: string;
  height?: string;
  style?: React.CSSProperties;
}

export default function DottedRating({
  progress,
  leftLabel,
  width = "100%",
  height = "16px",
  style,
}: DottedRatingProps) {
  // Clamp progress between 0–10
  const clampedProgress = Math.max(0, Math.min(progress, 10));
  const totalDots = 10;

  return (
    <div style={style}>
      {/* Labels */}
      <div
        style={{
          width,
          marginBottom: "6px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "6px",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          <span>{leftLabel}</span>
          {/* <span>{rightLabel}</span> */}
        </div>

        {/* Dots row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            gap: "4px",
          }}
        >
          {Array.from({ length: totalDots }).map((_, index) => {
            const isFilled = index < clampedProgress;
            return (
              <div
                key={index}
                style={{
                  width: height,
                  height: height,
                  borderRadius: "50%",
                  backgroundColor: isFilled ? "#DC3C05" : "#D8D7D7",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
