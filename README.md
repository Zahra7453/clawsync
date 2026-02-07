# ClawSync

Open source AI agent platform built with React + Convex. Deploy your personal AI agent with a public chat UI, private admin dashboard (SyncBoard), skills system, MCP support, and multi-model routing.

## Features

- **Public Chat UI** - Clean, real-time chat with streaming responses
- **SyncBoard Admin** - Private dashboard to manage your agent
- **Skills System** - Template, webhook, or code-based skills
- **Multi-Model** - Claude, GPT, Gemini, or any OpenRouter model
- **MCP Support** - Connect to MCP servers or expose your agent as one
- **Channel Integrations** - Telegram, Discord, WhatsApp, Slack, Email
- **Live Activity Feed** - Public real-time log of agent actions
- **Self-Hosted** - No external hosting required (Convex Self Static Hosting)

## Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- A Convex account (free tier works)
- An Anthropic API key (or OpenAI/OpenRouter)

### Setup

1. **Clone and install:**

```bash
git clone https://github.com/waynesutton/clawsync.git
cd clawsync
npm install
```

2. **Initialize Convex:**

```bash
npx convex dev
```

This will prompt you to create a new Convex project. Follow the prompts.

3. **Set environment variables:**

In the Convex Dashboard (dashboard.convex.dev), go to Settings > Environment Variables and add:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Optional for multi-model support:
```
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
```

4. **Start the frontend:**

```bash
npm run dev
```

5. **Complete setup:**

Visit http://localhost:5173 and complete the setup wizard. This creates your agent configuration.

6. **Open in browser:**

- Landing Page: http://localhost:5173
- Chat: http://localhost:5173/chat
- SyncBoard: http://localhost:5173/syncboard

## Deployment

ClawSync uses **Convex Self Static Hosting** exclusively. No Vercel, Netlify, or external hosting required.

### Deploy to Production

```bash
# Deploy everything (backend + frontend)
npm run deploy

# Or deploy static files only
npm run deploy:static
```

Your app will be available at `https://your-project.convex.site`.

### Deployment Options

| Mode | Description | Best For |
|------|-------------|----------|
| Convex Storage | Files in Convex, served via HTTP | Simple apps, development |
| Convex + Cloudflare CDN | Files in Convex, cached at edge | Custom domains, production |

See [@convex-dev/self-static-hosting](https://github.com/get-convex/self-static-hosting) for advanced options.

## Authentication

### SyncBoard Password Protection

Protect your admin dashboard with a password:

1. Generate a password hash:
```bash
node -e "console.log(require('crypto').createHash('sha256').update('your-password').digest('hex'))"
```

2. Set `SYNCBOARD_PASSWORD_HASH` in Convex Dashboard > Settings > Environment Variables.

3. Restart your app. SyncBoard will now require login.

### WorkOS AuthKit (Coming Soon)

Enterprise SSO support via WorkOS AuthKit is planned. The codebase is prepared for this integration:

- `convex/auth.config.ts` - JWT validation configuration (placeholder)
- `src/main.tsx` - Comments for AuthKit provider setup
- `src/App.tsx` - SyncBoardAuthGuard ready for WorkOS

See [Convex AuthKit docs](https://docs.convex.dev/auth/authkit/) when ready to enable.

## Project Structure

```
clawsync/
├── convex/                    # Convex backend
│   ├── agent/                 # Agent core
│   │   ├── clawsync.ts       # Agent definition
│   │   ├── security.ts       # Security checker
│   │   ├── toolLoader.ts     # Dynamic tool loading
│   │   └── modelRouter.ts    # Multi-model routing
│   ├── auth.config.ts         # WorkOS config (placeholder)
│   ├── staticHosting.ts       # Self-static-hosting API
│   ├── schema.ts              # Database schema
│   ├── convex.config.ts       # Component registration
│   └── http.ts                # HTTP endpoints
├── src/                       # React frontend
│   ├── pages/
│   │   ├── LandingPage.tsx   # Public landing with activity feed
│   │   ├── ChatPage.tsx      # Chat UI
│   │   ├── SetupWizard.tsx   # First-run setup
│   │   ├── SyncBoard*.tsx    # Admin pages
│   │   └── SyncBoardLogin.tsx # Password login
│   ├── components/
│   └── styles/
│       ├── tokens.css         # Design tokens (Geist fonts)
│       └── global.css
├── content/
│   └── soul.md                # Default soul document
├── AGENTS.md                  # For AI coding agents
└── CLAUDE.md                  # For Claude Code
```

## Design System

ClawSync uses a custom design system with Geist fonts from Vercel.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | #f3f3f3 | Page backgrounds |
| `--bg-secondary` | #ececec | Cards, inputs |
| `--interactive` | #ea5b26 | Buttons, links |
| `--text-primary` | #232323 | Body text |
| `--font-sans` | Geist | UI text |
| `--font-mono` | Geist Mono | Code |

All tokens are in `src/styles/tokens.css`. Never hardcode colors.

## Commands

```bash
npm install          # Install dependencies
npx convex dev       # Start Convex backend
npm run dev          # Start Vite frontend
npm run build        # Production build
npm run deploy       # Deploy to Convex
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

## Adding Skills

### Template Skill
1. SyncBoard > Skills > Add Skill
2. Select "Template Skill"
3. Choose a template and configure
4. Approve the skill

### Webhook Skill
1. SyncBoard > Skills > Add Skill
2. Select "Webhook Skill"
3. Enter the API endpoint URL
4. Add domain to allowlist
5. Approve the skill

### Code Skill
Add a file in `convex/agent/skills/` and register it in the skill registry.

## Security

See [CLAUDE.md](./CLAUDE.md) for security rules:

- Never store secrets in code
- Never modify `security.ts` without review
- All skills start unapproved
- Webhook handlers verify signatures
- No `.collect()` without `.take(n)`

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes following CLAUDE.md guidelines
4. Submit a pull request

## License

MIT License. Fork it, own it.

---

Built with [Convex](https://convex.dev), [WorkOS](https://workos.com) (coming soon), and [Geist](https://vercel.com/font).
# clawsync
