FROM ghcr.io/pnpm/pnpm:12

RUN pnpm runtime set node lts -g

RUN pnpm dlx playwright install --with-deps chromium

RUN curl -fsSL https://opencode.ai/install | bash

RUN apt update && apt install -y --no-install-recommends vim

RUN chsh -s /bin/zsh

ENV PATH=/root/.opencode/bin:$PATH
