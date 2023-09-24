# build
FROM node:18.16.0-alpine as builder

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
	giflib

COPY ./consola.ttf /app/

RUN apk add wqy-zenhei --update-cache --repository https://nl.alpinelinux.org/alpine/edge/testing && fc-cache -fv

RUN npx pnpm i --production

COPY --from=builder /app/dist /app/dist

CMD ["node", "/app/dist/index.js"]
