# Bott - Discord AI Bot

Always reference these instructions first and fallback to search or bash
commands only when you encounter unexpected information that does not match the
info here.

Bott is a Discord bot powered by Gemini AI, built with Deno/TypeScript. It
features intelligent conversation, media processing (images, videos, audio), and
content generation capabilities.

## Working Effectively

### Initial Setup

- Copy configuration template: `cp .env.example .env.local`
- Configure settings in `.env.local`:
  - `GCP_PROJECT` - GCP project ID
  - `GCP_REGION` - GCP region (e.g., us-central1)
  - `GEMINI_ACCESS_TOKEN` - GCP access token
  - `SERVICE_DISCORD_TOKEN` - Discord bot token

### Development Workflow

- Run `./run` to start Bott locally.
- NEVER CANCEL initial startup - dependency downloads take 2-5 minutes
- The development server watches for changes in `app/`, `libraries/`, and
  `model/` directories

### Using `./run` - Container Execution

The `./run` script is the primary interface for executing commands in this
project. **All commands should be run through `./run` whenever possible** to
ensure consistency and proper environment setup.

**How it works:**

- `./run` builds a Docker/Podman container with all dependencies pre-installed
- Commands are executed inside the container, not on the host system
- The workspace directory is mounted at `/workspace` inside the container
- Environment variables are loaded from `.env.$ENV` files (default: `.env.local`)

**Why use it:**

- **Consistency**: Everyone works with the same dependencies and environment
- **No local installation**: You don't need Deno or other tools installed on
  your host
- **Isolation**: Container ensures no conflicts with your local system

**Examples:**

```sh
./run deno fmt --check        # Format check
./run deno lint              # Lint code
./run deno test --allow-all  # Run tests
./run deno task deploy_gcp   # Deploy to GCP
```

**Container runtime:**

Set `RUNNER` environment variable to choose container runtime:

```sh
RUNNER=podman ./run deno fmt --check      # Use Podman instead of Docker
```

**Environment selection:**

Set `ENV` to use different environment configurations:

```sh
ENV=production ./run deno task logs       # Use .env.production
```

## Validation

### Manual Validation Steps

- Container builds successfully when running `./run`
- Format check passes: `./run deno fmt --check` reports "Checked X files" with
  exit code 0
- Application starts automatically in the devcontainer without TypeScript
  compilation errors
- Health endpoint responds: When running, http://localhost:8080 should return
  "OK"

### Testing Requirements

- ALWAYS run `./run deno fmt --check` and `./run deno lint` before committing
  changes
- ALWAYS run `./run deno test --allow-all` to validate unit tests
- Test files are located in: `**/**.test.ts`

### CI/CD Validation

- Always run `./run deno fmt --check && ./run deno lint` before committing -
  this matches the GitHub Actions workflow
- License header check: All `.ts` and `.sql` files must contain "This project is
  dual-licensed:" in their header
- The CI workflow in `.github/workflows/qualityChecks.yml` runs: lint, unit
  tests, and license header validation

### Network Dependencies

- First-time runs require downloading system dependencies, 200+ npm packages and
  JSR modules
- Downloads can take 2-5 minutes depending on network speed
- Certificate or network issues may prevent package downloads in restricted
  environments
- If downloads fail, the application cannot start but builds will still succeed

## Project Structure

```
.
├── README.md              # Project documentation
├── constants.ts          # Global configuration and constants
├── deno.json             # Deno configuration and tasks
├── Containerfile         # Container build instructions
├── Brewfile              # macOS dependencies via Homebrew
├── .env.example          # Environment configuration template
├── .devcontainer/        # Devcontainer configuration
├── app/                  # Main application
│   ├── README.md        # Application layer documentation
│   ├── main.ts          # Entry point
│   ├── tasks.ts         # Task management
│   ├── service/         # App Service logic
│   └── settings/        # App identity and reasons
├── libraries/           # Modular libraries
│   ├── aiModels/       # AI Model integrations
│   │   └── gemini/     # Google Gemini integration
│   ├── chatSpaces/     # Chat platform integrations
│   │   └── discord/    # Discord integration
│   ├── log/            # Logging
│   └── system/         # Core system libraries
│       ├── actions/    # Action definitions
│       ├── events/     # Event types and handling
│       ├── services/   # Service infrastructure
│       └── storage/    # Data persistence (SQLite)
├── model/              # Shared types
│   └── README.md       # Data model documentation
└── .github/            # CI/CD workflows
```

## Common Tasks

### Adding New Features

- Bot commands: Add handlers in `app/service/actions.ts` (or
  `libraries/system/actions`)
- New AI capabilities: Extend `libraries/aiModels/gemini/`
- Data models: Update `libraries/system/events/` (or `model/`)
- Storage functionality: Modify `libraries/system/storage/`

### Debugging

- Check logs in the terminal where Bott is running
- Verify configuration is set correctly in `.env.*`
- Test network connectivity to Discord API and Google Cloud APIs
- Validate file permissions for `FILE_SYSTEM_ROOT` directory (default:
  `./.output/fsRoot`)

### Configuration Options

Key environment variables are defined in [constants.ts](../constants.ts). See
that file for the full list and default values.
