# 基础依赖阶段
FROM node:22.11.0-alpine AS base

# 版本参数
ARG TAG_NAME
ENV APP_VERSION=$TAG_NAME
ENV PNPM_VERSION=10.2.0
ENV NODE_ENV=production

# 安装基础依赖
RUN apk add --no-cache \
    pango-dev \
    g++ \
    make \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    && npm install -g pnpm@${PNPM_VERSION} \
    && pnpm config set store-dir /root/.local/share/pnpm/store \
    && rm -rf /var/cache/apk/* /tmp/* ~/.npm

# 构建阶段
FROM base AS builder

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 使用 BuildKit 缓存优化依赖安装
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install

# 复制源码并构建
COPY . .
RUN pnpm run build \
    && pnpm prune --prod

# 运行阶段
FROM base AS runner

# 时区设置
ENV TZ=Asia/Shanghai

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# 运行时特有的依赖
RUN apk add --no-cache \
    tzdata \
    wqy-zenhei --repository https://nl.alpinelinux.org/alpine/edge/community \
    && fc-cache -fv \
    && rm -rf /var/cache/apk/* /tmp/*

# 设置工作目录并更改所有权
WORKDIR /app
RUN chown -R appuser:appgroup /app

# 复制生产依赖和资源
COPY --chown=appuser:appgroup package.json pnpm-lock.yaml ./
COPY --chown=appuser:appgroup consola.ttf ./
RUN pnpm install --prod && cd node_modules/canvas && npm run install && cd ../..
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist

# 添加元数据
LABEL maintainer="Kreedzt" \
    version=${TAG_NAME} \
    description="RWR Imba QQ Bot" \
    org.opencontainers.image.source="https://github.com/Kreedzt/rwr-imba-qq-bot"

# 配置安全选项
RUN mkdir -p /app/logs && \
    chown -R appuser:appgroup /app/logs

# 切换到非 root 用户
USER appuser

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "try { require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)); } catch (e) { process.exit(1); }"

# 声明暴露端口
EXPOSE 3000

# 设置默认命令
CMD ["node", "dist/app.js"]
