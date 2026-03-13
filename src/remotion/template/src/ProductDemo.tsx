import { AbsoluteFill } from "remotion";

// Placeholder component — will be overwritten by the agent.
export const ProductDemo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#fff", fontSize: 48 }}>Product Demo Placeholder</div>
    </AbsoluteFill>
  );
};
