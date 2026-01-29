-- PostgreSQL schema for command execution logging
-- Feature: 001-migrate-postgresql

-- Create table for command access logs
CREATE TABLE IF NOT EXISTS cmd_access_table (
    cmd VARCHAR(255) NOT NULL,
    params TEXT,
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    received_time TIMESTAMP WITH TIME ZONE NOT NULL,
    response_time TIMESTAMP WITH TIME ZONE NOT NULL,
    elapse_time INTEGER NOT NULL,
    create_time TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_cmd ON cmd_access_table(cmd);
CREATE INDEX IF NOT EXISTS idx_user_id ON cmd_access_table(user_id);
CREATE INDEX IF NOT EXISTS idx_create_time ON cmd_access_table(create_time);
CREATE INDEX IF NOT EXISTS idx_cmd_create_time ON cmd_access_table(cmd, create_time);
CREATE INDEX IF NOT EXISTS idx_user_cmd ON cmd_access_table(user_id, cmd);
