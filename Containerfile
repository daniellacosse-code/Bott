FROM denoland/deno:latest

USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ffmpeg \
    libmp3lame-dev \
    libx265-dev \
    curl \
    gnupg \
    && echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - \
    && apt-get update && apt-get install -y google-cloud-cli \
    && rm -rf /var/lib/apt/lists/*


WORKDIR /workspace

COPY ./deno.jsonc ./deno.lock* ./
COPY ./app ./app
COPY ./libraries ./libraries
COPY ./model ./model

ENV PORT=8080
EXPOSE $PORT

CMD ["deno", "run", "--allow-all", "./app/main.ts"]
