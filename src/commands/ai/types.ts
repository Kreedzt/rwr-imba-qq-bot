export interface IDifyAIUsage {
    prompt_tokens: number;
    prompt_unit_price: string;
    prompt_price_unit: string;
    prompt_price: string;
    completion_tokens: number;
    completion_unit_price: string;
    completion_price_unit: string;
    completion_price: string;
    total_tokens: number;
    total_price: string;
    currency: string;
    latency: number;
}

export interface IDifyAIResource {
    dataset_id: string;
    dataset_name: string;
    document_id: string;
    document_name: string;
    data_source_type: string;
    segment_id: string;
    retriever_from: string;
    score: number;
    content: string;
    position: number;
}

export interface IDifyAIResponse {
    event: string;
    task_id: string;
    id: string;
    message_id: string;
    conversation_id: string;
    mode: string;
    answer: string;
    metadata: {
        retriever_resources: IDifyAIResource[];
        usage: IDifyAIUsage;
    };
    created_at: 1733842225;
}
