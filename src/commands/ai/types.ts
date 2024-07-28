export interface IGLMMessage {
    role: string;
    content: string;
}

export interface IGLMChoice {
    index: number;
    finish_reason: 'stop' | 'tool_calls' | 'length';
    message: IGLMMessage;
}

export interface IGLMUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface IGLMResponse {
    id: string;
    created: number;
    model: string;
    choices: IGLMChoice[];
    usage: IGLMUsage;
}
