# Log 命令

## 用途

查询并统计命令执行相关信息

## 环境准备

使用根目录下的 `init.sql` 初始化 ClickHouse 数据库

## 环境变量

-   CLICKHOUSE_HOST: ClickHouse 地址
-   CLICKHOUSE_DB: ClickHouse 数据库
-   CLICKHOUSE_USER: ClickHouse 用户名
-   CLICKHOUSE_PASSWORD: ClickHouse 密码

## 注册的指令

-   log: 查询命令执行日志

    > 用法: `#log tdoll` 查询 `tdoll` 命令执行日志`

    > `#log all` 查询所有命令执行日志
