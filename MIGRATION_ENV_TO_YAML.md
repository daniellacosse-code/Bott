# Migration Guide: .env to YAML Configuration

This guide will help you migrate from `.env` configuration files to the new
YAML-based configuration system.

## Why YAML?

- **Better structure**: YAML supports comments and is more human-readable
- **Type safety**: Clearer value formatting with quotes for strings
- **Consistency**: Single configuration format across the project
- **Flexibility**: Easier to extend with nested configurations in the future

## Migration Steps

### 1. Create your new config file

Copy the example configuration:

```bash
cp config.example.yml config.test.yml
# or for production
cp config.example.yml config.production.yml
```

### 2. Transfer your settings

If you have an existing `.env.test` or `.env.production` file, transfer the
values to the corresponding YAML file.

**Old format (.env):**

```bash
GOOGLE_PROJECT_ID=my-project-123
GOOGLE_PROJECT_LOCATION=us-central1
DISCORD_TOKEN=abc123xyz
```

**New format (.yml):**

```yaml
GOOGLE_PROJECT_ID: my-project-123
GOOGLE_PROJECT_LOCATION: us-central1
DISCORD_TOKEN: abc123xyz
```

### 3. Run with the new config

The `deno task runApp` command now automatically uses YAML configs:

```bash
deno task runApp test    # Uses config.test.yml
deno task runApp prod    # Uses config.production.yml
```

## Configuration Format

### Basic Syntax

```yaml
# Comments are supported with #
KEY_NAME: value

# String values can be quoted or unquoted
SIMPLE_VALUE: hello
QUOTED_VALUE: "hello world"
SINGLE_QUOTED: "hello world"

# Numeric values
PORT: 8080

# Empty values are ignored
EMPTY_VALUE:
```

### Required Fields

The following fields are required for the bot to function:

```yaml
GOOGLE_PROJECT_ID: "" # Your GCP project ID
GOOGLE_PROJECT_LOCATION: "" # GCP region (e.g., us-central1)
DISCORD_TOKEN: "" # Your Discord bot token
```

### Optional Fields

The following fields have defaults and can be omitted:

```yaml
GOOGLE_ACCESS_TOKEN: "" # For local development only
PORT: 8080 # Health check server port
LOG_TOPICS: "info,warn,error" # Log levels to display

# Rate limits
CONFIG_RATE_LIMIT_IMAGES: 100
CONFIG_RATE_LIMIT_MUSIC: 25
CONFIG_RATE_LIMIT_VIDEOS: 10

# Input limits
CONFIG_INPUT_FILE_TOKEN_LIMIT: 500000
CONFIG_INPUT_FILE_AUDIO_COUNT_LIMIT: 1
CONFIG_INPUT_FILE_VIDEO_COUNT_LIMIT: 10
CONFIG_INPUT_EVENT_COUNT_LIMIT: 2000
CONFIG_INPUT_EVENT_TIME_LIMIT_MS: 86400000

# AI Models
CONFIG_ERROR_MODEL: "gemini-2.5-flash"
CONFIG_EVENTS_MODEL: "gemini-2.5-flash"
CONFIG_RATING_MODEL: "gemini-2.5-flash-lite"
CONFIG_ESSAY_MODEL: "gemini-3-pro-preview"
CONFIG_PHOTO_MODEL: "gemini-3-pro-image-preview"
CONFIG_SONG_MODEL: "lyria-002"
CONFIG_MOVIE_MODEL: "veo-3.1-fast-generate-001"
```

## Deployment

### Local Development

For local development with Docker/Podman:

```bash
cp config.example.yml config.test.yml
# Edit config.test.yml with your values
deno task runApp test
```

### Cloud Run Deployment

For Cloud Run deployments, you still need to convert YAML to environment
variables:

```bash
# Create production config
cp config.example.yml config.production.yml
# Edit with your production values

# Convert to env format for Cloud Run
grep -v '^#' config.production.yml | grep -v '^$' | sed 's/: /=/' > .env.production

# Deploy
gcloud run deploy bott-service \
  --source . \
  --allow-unauthenticated \
  --region <YOUR_REGION> \
  --env-vars-file .env.production
```

## Troubleshooting

### Config file not found

If you see an error like:

```
Config file config.test.yml not found. Please copy config.example.yml...
```

Make sure you've created your config file:

```bash
cp config.example.yml config.test.yml
```

### Invalid YAML syntax

Common YAML syntax issues:

1. **Spacing**: Use spaces, not tabs
2. **Colons**: Must have a space after the colon: `KEY: value` not `KEY:value`
3. **Quotes**: Use quotes for values with special characters or spaces

### Empty values

Empty values are ignored in the config. If a required field is empty, you'll get
an error. Make sure all required fields have values:

```yaml
# This will be ignored (no value)
GOOGLE_PROJECT_ID:

# This is correct
GOOGLE_PROJECT_ID: my-project-id
```

## Backward Compatibility

The old `.env` files are no longer used by the application. However, they are
still ignored by Git (`.gitignore`) and Docker (`.dockerignore`), so you can
keep them around if needed for other tools.

## Questions?

If you encounter any issues during migration, please open an issue on the
[GitHub repository](https://github.com/daniellacosse-code/Bott/issues).
