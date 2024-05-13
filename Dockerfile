# https://pnpm.io/docker#example-2-build-multiple-docker-images-in-a-monorepo

# FROM node:20-slim AS base
FROM node:20.10.0-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# RUN pnpm run -r build

# RUN pnpm deploy --filter=@spill-it/api --prod /prod/api
RUN pnpm deploy --filter=@spill-it/api /prod/api

FROM base AS api
COPY --from=build /prod/api /prod/api
WORKDIR /prod/api
EXPOSE 8000

CMD [ "pnpm", "start" ]
# CMD [ "pnpm", "dev" ]
