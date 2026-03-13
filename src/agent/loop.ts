import Anthropic from "@anthropic-ai/sdk";
import { EncodedScreenshot } from "../utils/screenshots.js";
import { buildSystemPrompt, buildUserMessage } from "./prompt.js";

const MAX_ITERATIONS = 5;
const MODEL = "claude-sonnet-4-6";

export type AgentResult = {
  code: string;
  iterations: number;
};

/**
 * Run the agent loop:
 * 1. Send screenshots + prompt to Claude
 * 2. Get generated Remotion code
 * 3. If compilation/render fails, feed error back and retry
 */
export async function runAgentLoop(params: {
  productName: string;
  tagline: string;
  screenshots: EncodedScreenshot[];
  apiKey: string;
  onRenderAttempt: (code: string, iteration: number) => Promise<string | null>;
  onLog: (message: string) => void;
}): Promise<AgentResult> {
  const { productName, tagline, screenshots, apiKey, onRenderAttempt, onLog } =
    params;

  const client = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt();

  // Build the initial message with screenshots
  const imageContent: Anthropic.Messages.ImageBlockParam[] = screenshots.map(
    (s) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: s.mediaType,
        data: s.base64,
      },
    })
  );

  const userText = buildUserMessage(
    productName,
    tagline,
    screenshots.length
  );

  const messages: Anthropic.Messages.MessageParam[] = [
    {
      role: "user",
      content: [
        ...imageContent,
        { type: "text", text: userText },
      ],
    },
  ];

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    onLog(`\n🎬 Iteration ${iteration}/${MAX_ITERATIONS}: Generating code...`);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: systemPrompt,
      messages,
    });

    // Extract text from response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    let code = textBlock.text.trim();

    // Strip markdown fences if the model wraps them despite instructions
    if (code.startsWith("```")) {
      code = code.replace(/^```(?:tsx?|javascript|jsx)?\n?/, "").replace(/\n?```$/, "");
    }

    onLog(`   ✅ Code generated (${code.length} chars)`);

    // Try to render
    onLog(`   🔨 Attempting render...`);
    const error = await onRenderAttempt(code, iteration);

    if (error === null) {
      onLog(`   🎉 Render successful!`);
      return { code, iterations: iteration };
    }

    onLog(`   ❌ Render failed. Feeding error back to agent...`);

    // Add assistant response and error feedback to conversation
    messages.push({
      role: "assistant",
      content: textBlock.text,
    });

    messages.push({
      role: "user",
      content: `The code you generated failed to compile/render. Here is the error:\n\n${error}\n\nPlease fix the code and output the COMPLETE corrected ProductDemo.tsx file. Output ONLY the raw TypeScript code, no markdown fences, no explanation.`,
    });
  }

  throw new Error(
    `Failed to generate a working video after ${MAX_ITERATIONS} iterations. The agent could not produce compilable Remotion code.`
  );
}
