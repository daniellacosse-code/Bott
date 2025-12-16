# Contributing to Bott

Thinking about contributing to Bott? There are a number of ways you can help!

## Reporting Issues

### Unexpected Behavior

If you find a bug, please open an issue! Include as much detail as possible in
the form. Screenshots, logs, and video captures are super helpful!

> [!WARNING]
> **Security Vulnerabilities** are different. Please see
> [./SECURITY.md](./SECURITY.md).

### Feature Requests

If you have an idea for a new feature or an improvement to an existing one,
please open an issue to discuss it!

## Submitting Code

### Getting started

#### Prerequisites

- Your container runtime of choice (Docker/Podman). For this guide, we'll use
  Docker.

#### Instructions

1. Copy `.env.example.yml` to `.env.devcontainer.yml`:

```sh
cp .env.example.yml .env.devcontainer.yml
```

2. Get your GCP information and add it to `.env.devcontainer.yml`.
3. Get your Discord information and add it to `.env.devcontainer.yml`.
4. Open the project in VS Code with the devcontainer. Bott will start
   automatically.

### Pull Requests

There are numerous issues tracked in the
[issues tab](https://github.com/daniellacosse-code/Bott/issues) that need work!

In order to submit a pull request, you will need to sign the
[**Contributor License Agreement (CLA)**](./CONTRIBUTOR_AGREEMENT.md). By
signing a CLA, you (or your employer) grant us the rights necessary to use and
distribute your contributions under our [dual-licensing model](./LICENSE). This
helps protect both you as a contributor and the project.

### Deploying Bott

TODO: update this section
