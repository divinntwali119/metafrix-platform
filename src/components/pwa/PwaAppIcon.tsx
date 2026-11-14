interface PwaAppIconProps {
  size: number;
}

export function PwaAppIcon({ size }: PwaAppIconProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111315",
      }}
    >
      <div
        style={{
          width: "76%",
          height: "76%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: size * 0.2,
          backgroundColor: "#E94F16",
        }}
      >
        <span
          style={{
            color: "#111315",
            fontSize: size * 0.56,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>
    </div>
  );
}
