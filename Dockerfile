FROM denoland/deno:latest

# Security: Create non-root user
RUN groupadd -r botuser && useradd -r -g botuser botuser

# Security: Install only necessary packages and clean up
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libmp3lame0 \
    libx265-199 && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Security: Create secure directories with proper permissions
RUN mkdir -p /app /libraries /model /fs_root && \
    chown -R botuser:botuser /app /libraries /model /fs_root && \
    chmod -R 755 /app /libraries /model && \
    chmod -R 700 /fs_root

# Copy application files
COPY --chown=botuser:botuser ./deno.json ./deno.lock* ./
COPY --chown=botuser:botuser ./app /app
COPY --chown=botuser:botuser ./libraries /libraries
COPY --chown=botuser:botuser ./model /model

# Security: Switch to non-root user
USER botuser

# Security: Set secure file permissions
RUN chmod -R 555 /app /libraries /model

EXPOSE 8080

# Security: Run with limited permissions
CMD ["deno", "task", "start:prod"]
