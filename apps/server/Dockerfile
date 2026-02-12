FROM node:20-alpine

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# Build the frontend (output in /app/apps/web/dist)
RUN pnpm -C apps/web build

EXPOSE 3001

CMD ["sh", "-c", "pnpm -C apps/server migrate && pnpm -C apps/server exec tsx src/index.ts"]
