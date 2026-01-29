# Log 命令

## 用途

查询并统计命令执行相关信息

## 环境准备

使用根目录下的 `init.sql` 初始化 PostgreSQL 数据库

## 环境变量

- PG_HOST: PostgreSQL 地址 (默认: localhost)
- PG_PORT: PostgreSQL 端口 (默认: 5432)
- PG_DB: PostgreSQL 数据库名
- PG_USER: PostgreSQL 用户名
- PG_PASSWORD: PostgreSQL 密码

## 注册的指令

- log: 查询命令执行日志

    > 用法: `#log tdoll` 查询 `tdoll` 命令执行日志`

    > `#log all` 查询所有命令执行日志
