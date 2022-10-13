export type Nullable<T> = T | null | undefined;

export interface GlobalEnv {
    PORT: number;
    START_MATCH: string;
    REMOTE_URL: string;
    ADMIN_QQ: number;
}

export interface BaseEvent {
    time: number;
    self_id: number;
    // message, request, notice, meta_event
    post_type: string;
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

export type ParamsType = Map<string, boolean>;
export type RegisterParamType = Record<string, boolean>;

export interface ExecCtx {
    msg: string;
    params: ParamsType;
    env: GlobalEnv;
    event: MessageEvent;
    reply: (msg: string) => Promise<void>;
}

export interface IRegister<T extends RegisterParamType = RegisterParamType> {
    name: string;
    description: string;
    isAdmin: boolean;
    // 短期单用户使用限制, 单位: 秒
    timesInterval?: number;
    defaultParams?: T;
    exec: (ctx: ExecCtx) => Promise<void>;
}
