interface BulletTextProps {
  text: string;
}

export default function BulletText({ text }: BulletTextProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
      <span
        style={{
          width: "0.4em",
          height: "0.4em",
          backgroundColor: "#DC3C05",
          borderRadius: "50%",
          flexShrink: 0,
          alignSelf: "center", // aligns dot with text center
        }}
      />
      <span style={{ lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
