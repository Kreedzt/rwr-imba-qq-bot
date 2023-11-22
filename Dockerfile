# build
FROM node:18.16.0-alpine as builder

ARG TAG_NAME
ENV APP_VERSION=$TAG_NAME

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./

# node-canvas deps
RUN apk add --no-cache --virtual .build-deps \
        build-base \
	g++ \
	cairo-dev \
	jpeg-dev \
	pango-dev \
	giflib-dev \
    && apk add --no-cache --virtual .runtime-deps \
        cairo \
	jpeg \
	pango \
	giflib && npx pnpm i

COPY ./ ./

RUN npm run build:dev

# run
FROM node:18.16.0-alpine

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./

# node-canvas deps
RUN apk add --no-cache --virtual .build-deps \
        build-base \
	g++ \
	cairo-dev \
	jpeg-dev \
	pango-dev \
	giflib-dev \
    && apk add --no-cache --virtual .runtime-deps \
        cairo \
	jpeg \
	pango \
	giflib \
    tzdata

COPY ./consola.ttf /app/

# font deps
RUN apk add wqy-zenhei --update-cache --repository https://nl.alpinelinux.org/alpine/edge/community && fc-cache -fv

# tz
ENV TZ Asia/Shanghai

RUN npx pnpm i --production

COPY --from=builder /app/dist /app/dist

CMD ["node", "/app/dist/index.js"]
