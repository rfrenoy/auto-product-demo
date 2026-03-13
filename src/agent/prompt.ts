import * as fs from "fs";
import * as path from "path";

// When compiled, __dirname is dist/agent/ — skills are at project root
const SKILLS_DIR = path.resolve(__dirname, "../../skills/remotion-best-practices");

/**
 * Load all Remotion skill files and concatenate them into a single
 * reference document the agent can use.
 */
function loadSkills(): string {
  const rulesDir = path.join(SKILLS_DIR, "rules");
  const skillMd = fs.readFileSync(path.join(SKILLS_DIR, "SKILL.md"), "utf-8");

  const ruleFiles = fs
    .readdirSync(rulesDir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const rules = ruleFiles.map((file) => {
    const content = fs.readFileSync(path.join(rulesDir, file), "utf-8");
    return `### Rule: ${file}\n\n${content}`;
  });

  // Also load the .tsx asset examples
  const assetsDir = path.join(rulesDir, "assets");
  let assetExamples = "";
  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".tsx"));
    assetExamples = assetFiles
      .map((file) => {
        const content = fs.readFileSync(path.join(assetsDir, file), "utf-8");
        return `### Example: ${file}\n\n\`\`\`tsx\n${content}\n\`\`\``;
      })
      .join("\n\n");
  }

  return `# Remotion Best Practices Reference\n\n${skillMd}\n\n---\n\n${rules.join("\n\n---\n\n")}\n\n---\n\n# Code Examples\n\n${assetExamples}`;
}

export function buildSystemPrompt(): string {
  const skills = loadSkills();

  return `You are an expert video producer and React/Remotion developer. Your job is to generate a complete Remotion composition that creates a professional product demo video.

You will receive:
- Screenshots of a product (as images)
- The product name
- A tagline (value proposition sentence)

Your task is to generate React/Remotion code that creates an animated product demo video. The video should:
1. Be exactly 600 frames at 30fps (20 seconds)
2. Resolution: 1920x1080 (landscape)
3. Show 1-2 main features of the product through animated UI mockups
4. End with the tagline displayed prominently

## CRITICAL RULES

### About the animated mockups
- Look at the screenshots carefully to understand the product's UI: colors, layout, typography, key features
- Create STYLIZED, ANIMATED mockups inspired by the screenshots — NOT pixel-perfect recreations
- Use the product's color palette extracted from the screenshots
- Animate UI elements appearing: sidebars sliding in, cards fading in, buttons appearing, text being typed
- The mockup should feel like a polished, simplified version of the real product

### Video structure (20 seconds total)
- **Intro (0-3s)**: Product name appears with an elegant animation
- **Feature showcase (3-15s)**: Animated mockup showing the product's main features. Elements should animate in sequentially, simulating user interaction
- **Tagline (15-20s)**: Clean transition to the tagline text, centered, with a subtle animation

### Technical requirements
- Use only \`useCurrentFrame()\` and \`useVideoConfig()\` for animations — NO CSS transitions or animations
- Use \`interpolate()\` and \`spring()\` for all motion
- Use \`<AbsoluteFill>\` for layout
- Use \`<Sequence>\` with \`premountFor\` for timing
- Use \`<TransitionSeries>\` with \`fade()\` or \`slide()\` for scene transitions
- Use Google Fonts via \`@remotion/google-fonts\` (Inter is a safe default)
- All colors should be defined as constants at the top of the file
- Keep the code in a SINGLE file (ProductDemo.tsx) that exports \`ProductDemo\` as the main component

### What NOT to do
- Do NOT use CSS \`transition\`, \`animation\`, or \`@keyframes\`
- Do NOT use Tailwind animation/transition classes
- Do NOT try to embed or display the actual screenshot images
- Do NOT use external assets or URLs
- Do NOT create overly complex components — keep it clean and maintainable
- Do NOT use \`<img>\` tags — use \`<Img>\` from remotion if needed

## OUTPUT FORMAT

You must respond with ONLY the content of the ProductDemo.tsx file. No explanation, no markdown fences, no other files. Just the raw TypeScript/React code that exports a \`ProductDemo\` component.

The file must:
- Import from "remotion", "@remotion/transitions", "@remotion/transitions/fade", "@remotion/google-fonts/Inter"
- Export a component named \`ProductDemo\`
- Be fully self-contained (no imports from local files)

---

## Remotion Reference Documentation

${skills}`;
}

export function buildUserMessage(
  productName: string,
  tagline: string,
  screenshotCount: number
): string {
  return `Create a product demo video for "${productName}".

Tagline: "${tagline}"

I'm providing ${screenshotCount} screenshot(s) of the product. Analyze them to understand:
- The product's color scheme and visual identity
- The main UI layout and key features
- What the product does

Then generate the ProductDemo.tsx file that creates an animated demo video showcasing this product.

Remember: output ONLY the raw TypeScript code, no markdown fences, no explanation.`;
}
