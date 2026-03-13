import { Composition } from "remotion";
import { ProductDemo } from "./ProductDemo";

// This file will be overwritten by the agent with the generated composition.
// It serves as a placeholder so the template project is valid.

export const RemotionRoot = () => {
  return (
    <Composition
      id="ProductDemo"
      component={ProductDemo}
      durationInFrames={600}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
