CREATE DATABASE IF NOT EXISTS rwr_imba_bot_db;

-- cmd
CREATE TABLE IF NOT EXISTS rwr_imba_bot_db.cmd_access_table (
  cmd FixedString(255) COMMENT '命令全称',
  params String COMMENT '命令参数',
  group_id UInt32 COMMENT 'QQ群组ID',
  user_id UInt32 COMMENT 'QQ用户ID',
  received_time DateTime64 DEFAULT now() COMMENT '接受时间',
  response_time DateTime64 DEFAULT now() COMMENT '响应时间',
  elapse_time UInt32 DEFAULT 0 COMMENT '执行时间(按毫秒)',
  create_time DateTime DEFAULT now() COMMENT '创建时间'
)
ENGINE = MergeTree()
PARTITION BY toYYYYMM(create_time)
ORDER BY (cmd, create_time)
PRIMARY KEY (cmd, create_time)
SETTINGS index_granularity = 8192
COMMENT '命令执行表';
-- index performance
CREATE INDEX idx_cmd ON rwr_imba_bot_db.cmd_access_table(cmd) TYPE minmax granularity 8192;
