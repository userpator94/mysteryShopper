# Mystery Shopper

Mystery shopper app with a mobile-friendly interface.

## About the project

This project started as an experiment in **testing what AI can do**—and in **tracking how that changes over time**. I don’t write the code myself (except when it’s cheaper than spending tokens): the goal is to **direct**, not to implement. To make that work, I developed a **method for phrasing tasks** in a way that’s as clear as possible for the model—so it understands intent, scope, and constraints without endless back-and-forth. How well this works in practice depends on model updates: better models tend to need less hand-holding, but the method itself stays relevant.

**Mystery Shopper** is split into two parts:

- **Frontend** (this repo) – the app users see and interact with
- **Backend** – API and server logic: [mysteryShopper-backend](https://github.com/userpator94/mysteryShopper-backend)

Design was created with several AI tools, with [Stitch (stitch.withgoogle.com)](https://stitch.withgoogle.com) as the main design partner. The codebase is produced the same way: by directing AI (e.g. in [Cursor](https://cursor.com) or similar tools). So the project is both a real app and a **living snapshot of human–AI collaboration**—what works today, what gets better with each model, and what still needs a human in the loop.

**AI models used (Cursor):** Claude 4.5 Opus, Claude 4.5 Sonnet (Anthropic); Composer 1 (Cursor); Gemini 3 Flash, Gemini 3 Pro (Google); GPT-5.2, GPT-5.2 Codex (OpenAI); Grok Code (xAI); DeepSeek.

## Installation and run

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Main pages

- **Home** (`/`) - search and offer categories
- **Offers** (`/offers`) - list of available offers
- **Favorites** (`/favorites`) - saved offers
- **Profile** (`/profile`) - user settings

## Tech stack

- **Vite** - build tool
- **TypeScript** - typing
- **Tailwind CSS** - styles
- **Vanilla JS** - no frameworks

## License

MIT License - see [LICENSE](LICENSE)
