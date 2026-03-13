import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// When compiled, __dirname is dist/remotion/ — template is at src/remotion/template
const TEMPLATE_DIR = path.resolve(__dirname, "../../src/remotion/template");

/**
 * Write the generated ProductDemo.tsx code into the template project
 * and attempt to render the video.
 *
 * @returns null if successful, or an error string if it failed
 */
export async function attemptRender(
  code: string,
  outputPath: string
): Promise<string | null> {
  const productDemoPath = path.join(TEMPLATE_DIR, "src", "ProductDemo.tsx");

  // Write the generated code
  fs.writeFileSync(productDemoPath, code, "utf-8");

  try {
    // Run the remotion render command
    const result = execSync(
      `npx remotion render ProductDemo "${outputPath}" --timeout=60000`,
      {
        cwd: TEMPLATE_DIR,
        timeout: 120_000, // 2 minute timeout for the whole process
        stdio: "pipe",
        env: {
          ...process.env,
          // Suppress Remotion's interactive prompts
          CI: "true",
        },
      }
    );

    // Verify the output file exists
    if (!fs.existsSync(outputPath)) {
      return "Render command completed but no output file was created.";
    }

    return null; // Success
  } catch (err: any) {
    // Extract useful error information
    const stderr = err.stderr?.toString() || "";
    const stdout = err.stdout?.toString() || "";
    const combined = `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;

    // Trim to avoid sending too much to the API
    const maxLen = 3000;
    const trimmed =
      combined.length > maxLen
        ? combined.slice(combined.length - maxLen)
        : combined;

    return trimmed;
  }
}

/**
 * Clean up the template project by restoring the placeholder ProductDemo.tsx.
 */
export function cleanupTemplate(): void {
  const productDemoPath = path.join(TEMPLATE_DIR, "src", "ProductDemo.tsx");
  const placeholder = `import { AbsoluteFill } from "remotion";

export const ProductDemo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#fff", fontSize: 48 }}>Product Demo Placeholder</div>
    </AbsoluteFill>
  );
};
`;
  fs.writeFileSync(productDemoPath, placeholder, "utf-8");
}
