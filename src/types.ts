export type Nullable<T> = T | null | undefined;

export interface GlobalEnv {
    PORT: number;
    START_MATCH: string;
    REMOTE_URL: string;
    LISTEN_GROUP: string;
    SERVERS_MATCH_REGEX: string;
    ADMIN_QQ: number;
    ACTIVE_COMMANDS: string[];
    WELCOME_TEMPLATE: string;
    WEBSITE_FILE: string;
    TDOLLDATA_FILE: string;
}

export interface BaseEvent {
    time: number;
    self_id: number;
    // message, request, notice, meta_event
    post_type: string;
    group_id?: number;
    user_id?: number;
}

export interface MessageEvent extends BaseEvent {
    post_type: 'message';
    // group
    sub_type: string;
    message_id: number;
    // sender QQ
    user_id: number;
    // sender QQ Group
    group_id: number;
    message: string;
    raw_message: string;
    font: number;
    sender: Record<string, any>;
}

export interface NewMemberEvent extends BaseEvent {
    time: number;
    // bot qq
    self_id: number;
    post_type: 'notice';
    notice_type: 'group_increase';
    sub_type: 'approve' | 'invite';
    // QQ Group
    group_id: number;
    operator_id: number;
    // QQ
    user_id: number;
}

export type NoticeEvent = NewMemberEvent;

export type ParamsType = Map<string, boolean>;
export type RegisterParamType = Record<string, boolean>;

export interface MsgExecCtx {
    msg: string;
    params: ParamsType;
    env: GlobalEnv;
    event: MessageEvent;
    reply: (msg: string) => Promise<void>;
}

export interface NoticeExecCtx {
    env: GlobalEnv;
    event: NoticeEvent;
    reply: (msg: string) => Promise<void>;
}

export interface IRegister<T extends RegisterParamType = RegisterParamType> {
    name: string;
    alias?: string;
    description: string;
    isAdmin: boolean;
    // 短期单用户使用限制, 单位: 秒
    timesInterval?: number;
    defaultParams?: T;
    parseParams?: (msg: string) => Map<string, boolean>;
    exec: (ctx: MsgExecCtx) => Promise<void>;
}
