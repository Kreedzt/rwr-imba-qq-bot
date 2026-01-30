# RWR Imba QQ 机器人

[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Kreedzt_rwr-imba-qq-bot&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=Kreedzt_rwr-imba-qq-bot)
[![codecov](https://codecov.io/gh/Kreedzt/rwr-imba-qq-bot/branch/master/graph/badge.svg?token=MWGXZH7GO9)](https://codecov.io/gh/Kreedzt/rwr-imba-qq-bot)
![build status](https://github.com/Kreedzt/rwr-imba-qq-bot/actions/workflows/ci.yml/badge.svg?branch=master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FKreedzt%2Frwr-imba-qq-bot.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FKreedzt%2Frwr-imba-qq-bot?ref=badge_shield)
[![Docker Image Size](https://badgen.net/docker/size/zhaozisong0/rwr-imba-qq-bot?icon=docker&label=image%20size)](https://hub.docker.com/r/zhaozisong0/rwr-imba-qq-bot/)

## 环境变量

通用配置:

- PORT: 监听的 HTTP 端口号, 类型为 `number`, 默认值为 `3000`, eg: `6768`
- REMOTE_URL: go-cqhttp 的服务监听的 HTTP 地址, 类型为 `string`, eg: `http://127.0.0.1:5701`
- START_MATCH: 机器人命令触发前缀, 类型为 `string`, eg: `#`
- ADMIN_QQ_LIST: 管理员 QQ 列表, 类型为 `string[]`, eg: `555555`
- LISTEN_GROUP: 监听的 QQ 群号, 类型为 `number`, eg: `111111`
- ACTIVE_COMMANDS: 激活的命令列表, 类型为 `JSON string[]`, eg: `["fuck", "roll", "tdoll"]`
- IMGPROXY_URL: imgproxy 图片代理地址, 用于图片裁剪宽高及缩放
- WELCOME_TEMPLATE: TODO

命令配置:

- SERVERS_MATCH_REGEX: RWR 服务器筛选正则表达式, 类型为 `string`
- WEBSITE_DATA_FILE: 指定的网站文件路径
- TDOLL_DATA_FILE: 战术人形数据文件路径
- QA_DATA_FILE: 自助问答数据文件路径
- PG_HOST: PostgreSQL 数据库Host地址, 用于统计命令数据 (默认: localhost)
- PG_PORT: PostgreSQL 数据库端口 (默认: 5432)
- PG_DB: PostgreSQL 数据库名, 用于统计命令数据
- PG_USER: PostgreSQL 用户名, 用于统计命令数据
- PG_PASSWORD: PostgreSQL 密码, 用于统计命令数据

## 部署

### Docker

可选挂载目录

- logs: 日志输出目录

```sh
docker run --name my-rwr-qq-bot \
-p 3000:3000 \
-e "PORT=3000" \
-e "REMOTE_URL=<REMOTE_URL>" \
-e "START_MATCH=<START_MATCH>" \
-e "ADMIN_QQ_LIST=<ADMIN_QQ_LIST>" \
-e "LISTEN_GROUP=<LISTEN_GROUP>" \
-e "ACTIVE_COMMANDS=<ACTIVE_COMMANDS>" \
-e "SERVER_MATCH_REGEX=<SERVER_MATCH_REGEX>" \
-v ${PWD}/data:/app/data \
-v ${PWD}/logs:/app/logs \
-d zhaozisong0/rwr-imba-qq-bot:latest
```

> **提示**: PORT 默认值为 `3000`，如需修改端口，请同时调整 `-p` 映射和 `-e PORT` 环境变量。例如使用 8080 端口：`-p 8080:8080 -e "PORT=8080"`

### Docker compose

参考 `docker-compose-example.yaml` 文件

## 图像渲染

- 项目图片生成依赖使用 `skia-canvas`（替代 `canvas`/node-canvas），以提升 CI 与本地安装稳定性。
- 图片回归样例（用于验证迁移后输出可用）：

```sh
pnpm run test:image
```

## License

- [MIT](https://opensource.org/licenses/MIT)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FKreedzt%2Frwr-imba-qq-bot.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FKreedzt%2Frwr-imba-qq-bot?ref=badge_large)
