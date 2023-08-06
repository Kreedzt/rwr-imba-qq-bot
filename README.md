# RWR Imba QQ 机器人

[![codecov](https://codecov.io/gh/Kreedzt/rwr-imba-qq-bot/branch/master/graph/badge.svg?token=MWGXZH7GO9)](https://codecov.io/gh/Kreedzt/rwr-imba-qq-bot)
![build status](https://github.com/Kreedzt/rwr-imba-qq-bot/actions/workflows/ci.yml/badge.svg?branch=master)

## 环境变量

通用配置:
- PORT: 监听的 HTTP 端口号, 类型为 `number`
- REMOTE_URL: go-cqhttp 的服务 HTTP 地址, 类型为 `string`
- START_MATCH: 机器人命令触发前缀, 类型为 `string`
- ADMIN_QQ_LIST: 管理员 QQ 列表, 类型为 `string[]`
- LISTEN_GROUP: 监听的 QQ 群号, 类型为 `number`
- ACTIVE_COMMANDS: 激活的命令列表, 类型为 `string[]`
- WELCOME_TEMPLATE: TODO

命令配置:
- SERVERS_MATCH_REGEX: RWR 服务器筛选正则表达式, 类型为 `string`
- WEBSITE_DATA_FILE: 指定的网站文件路径
- TDOLL_DATA_FILE: 战术人形数据文件路径
- QA_DATA_FILE: 自助问答数据文件路径

## 部署

### Docker



### Docker compose

参考 `docker-compose-example.yaml` 文件

## License

- [MIT](https://opensource.org/licenses/MIT)
