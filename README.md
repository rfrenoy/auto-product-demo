# auto-product-demo

Generate professional product demo videos from screenshots using AI and [Remotion](https://remotion.dev).

Takes screenshots of your product, analyzes them with Claude, and generates a 20-second animated demo video with stylized UI mockups and your tagline.

## How it works

1. You provide screenshots of your product + a tagline + your product name
2. Claude analyzes the screenshots (colors, layout, features) via its vision capabilities
3. Claude generates Remotion (React) code that creates animated UI mockups inspired by your product
4. Remotion renders the code into an MP4 video
5. If rendering fails, the error is fed back to Claude for automatic retry (up to 5 attempts)

## Prerequisites

- **Node.js** ≥ 18
- **Anthropic API key** (Claude Sonnet 4.6)

## Installation

```bash
git clone <repo-url>
cd auto-product-demo
npm install
cd src/remotion/template && npm install && cd ../../..
npm run build
```

## Usage

```bash
export ANTHROPIC_API_KEY=your-key-here

node dist/cli.js \
  --product-name "Acme AI" \
  --screenshots hero.png dashboard.png \
  --tagline "Ship 10x faster with AI" \
  --output demo.mp4
```

### CLI Options

| Flag | Required | Description |
|------|----------|-------------|
| `-n, --product-name <name>` | ✅ | Your product's name |
| `-s, --screenshots <paths...>` | ✅ | Screenshot image paths (ordered by importance) |
| `-t, --tagline <text>` | ✅ | Value proposition sentence shown at the end |
| `-o, --output <path>` | No | Output file path (default: `demo.mp4`) |

### Supported image formats

PNG, JPG/JPEG, WebP, GIF

## Video specs (v1)

- **Resolution**: 1920×1080 (landscape)
- **Duration**: 20 seconds
- **FPS**: 30
- **Format**: MP4 (H.264)

## Project structure

```
auto-product-demo/
├── src/
│   ├── cli.ts                  # CLI entry point
│   ├── agent/
│   │   ├── loop.ts             # Agent loop (call Claude, retry on failure)
│   │   └── prompt.ts           # System prompt + skills loading
│   ├── remotion/
│   │   ├── renderer.ts         # Write code + run remotion render
│   │   └── template/           # Remotion project (agent writes code here)
│   └── utils/
│       └── screenshots.ts      # Screenshot validation + base64 encoding
├── skills/
│   └── remotion-best-practices/ # Remotion agent skills (from remotion-dev/skills)
├── package.json
└── tsconfig.json
```

## Architecture

The tool uses an **agentic loop** pattern:

1. Screenshots are base64-encoded and sent to Claude along with Remotion best-practice documentation (skills)
2. Claude generates a single `ProductDemo.tsx` file with animated React components
3. The code is written into the template Remotion project and rendered via `npx remotion render`
4. If rendering fails (compilation error, runtime error), the error output is sent back to Claude with a request to fix the code
5. This loops up to 5 times until a successful render is produced

## License

ISC
