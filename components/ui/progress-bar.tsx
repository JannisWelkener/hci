interface ProgressBarProps {
    progress: number; // 0-100
    leftLabel: string;
    rightLabel: string;
    width?: string;
    height?: string;
    style?: React.CSSProperties;
  }
  
  export default function ProgressBar({ progress, leftLabel, rightLabel, width = "100%", height = "16px", style }: ProgressBarProps) {
    return (
      <div style={style}>
        <div style={{ width, marginBottom: "6px", fontFamily: "sans-serif" }}>
          {/* Labels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}>
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
  
          {/* Background bar */}
          <div style={{ width: "100%", height, backgroundColor: "#D8D7D7", borderRadius: "8px", overflow: "hidden" }}>
            {/* Filled portion */}
            <div style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#DC3C05",
              borderRadius: "8px 0 0 8px",
              //transition: "width 0.3s",
            }} />
          </div>
        </div>
        </div>
      );
  }
  