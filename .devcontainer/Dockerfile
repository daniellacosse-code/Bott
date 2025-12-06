FROM denoland/deno:latest

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libmp3lame-dev \
    libx265-dev \
    git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

ENV PORT=8080
EXPOSE $PORT

# Keep container running for development
CMD ["tail", "-f", "/dev/null"]
