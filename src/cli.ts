#!/usr/bin/env node

import { Command } from "commander";
import * as path from "path";
import { validateAndEncodeScreenshots } from "./utils/screenshots.js";
import { runAgentLoop } from "./agent/loop.js";
import { attemptRender, cleanupTemplate } from "./remotion/renderer.js";

const program = new Command();

program
  .name("auto-product-demo")
  .description(
    "Generate a product demo video from screenshots using AI and Remotion"
  )
  .version("1.0.0")
  .requiredOption(
    "-s, --screenshots <paths...>",
    "Paths to product screenshot images (ordered by importance)"
  )
  .requiredOption(
    "-t, --tagline <text>",
    'Value proposition tagline (e.g. "Ship 10x faster with AI")'
  )
  .requiredOption(
    "-n, --product-name <name>",
    'Product name (e.g. "Acme AI")'
  )
  .option(
    "-o, --output <path>",
    "Output video file path",
    "demo.mp4"
  )
  .action(async (options) => {
    const {
      screenshots: screenshotPaths,
      tagline,
      productName,
      output,
    } = options;

    // Validate API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error(
        "❌ Error: ANTHROPIC_API_KEY environment variable is required.\n" +
          "   Set it with: export ANTHROPIC_API_KEY=your-key-here"
      );
      process.exit(1);
    }

    // Resolve output path
    const outputPath = path.resolve(output);

    console.log("🎬 Auto Product Demo Generator");
    console.log("================================");
    console.log(`   Product:     ${productName}`);
    console.log(`   Tagline:     "${tagline}"`);
    console.log(`   Screenshots: ${screenshotPaths.length} file(s)`);
    console.log(`   Output:      ${outputPath}`);
    console.log("");

    // Validate and encode screenshots
    let screenshots;
    try {
      console.log("📸 Validating screenshots...");
      screenshots = validateAndEncodeScreenshots(screenshotPaths);
      console.log(
        `   ✅ ${screenshots.length} screenshot(s) loaded: ${screenshots.map((s) => s.filename).join(", ")}`
      );
    } catch (err: any) {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    }

    // Run the agent loop
    try {
      console.log("\n🤖 Starting AI agent...");
      const result = await runAgentLoop({
        productName,
        tagline,
        screenshots,
        apiKey,
        onRenderAttempt: async (code, iteration) => {
          return attemptRender(code, outputPath);
        },
        onLog: (message) => console.log(message),
      });

      console.log("\n================================");
      console.log(`✅ Video generated successfully!`);
      console.log(`   Output: ${outputPath}`);
      console.log(`   Iterations: ${result.iterations}`);
      console.log("");

      // Clean up
      cleanupTemplate();
    } catch (err: any) {
      console.error(`\n❌ ${err.message}`);
      cleanupTemplate();
      process.exit(1);
    }
  });

program.parse();
