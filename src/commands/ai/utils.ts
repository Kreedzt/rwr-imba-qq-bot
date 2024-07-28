import * as jwt from 'jsonwebtoken';
import { JwtHeader } from 'jsonwebtoken';
import { MsgExecCtx } from '../../types';
import { AI_MODEL_DISPLAY_NAME, AI_MODEL_NAME } from './constants';
import { logger } from '../../utils/logger';
import axios, { AxiosResponse } from 'axios';
import { IGLMResponse } from './types';

const genGLMJWT = (apiKey: string): string => {
    const [key, secret] = apiKey.split('.');
    return jwt.sign(
        {
            api_key: key,
        },
        secret,
        {
            algorithm: 'HS256',
            expiresIn: '1h',
            header: {
                sign_type: 'SIGN',
            } as unknown as JwtHeader,
        }
    );
};

const genGLMMessages = (
    query: string
): Array<{
    role: string;
    content: string;
}> => {
    return [
        {
            role: 'system',
            content:
                '作为一名智能客服, 你善于从知识库中总结提炼并思考知识的关联性, 并需要根据知识库内容用简洁和专业的来回答用户问题。如果无法从中得到答案，请说 “根据已知信息无法回答该问题” 或 “没有提供足够的相关信息”，不允许在答案中添加编造成分，答案请使用中文。 ',
        },
        {
            role: 'user',
            content: `${query}`,
        },
    ];
};

export const getAIQAMatchRes = async (query: string, ctx: MsgExecCtx) => {
    const res = await getQAAIRes(
        query,
        ctx.env.GLM_APIKEY,
        ctx.env.GLM_KNOWLEDGE_ID,
        ctx.env.GLM_MODEL
    );

    if (res) {
        return `[${ctx.env.GLM_MODEL}]${res}`;
    }

    return `未匹配到指定问题, 请尝试其他问题或联系管理员更新知识库`;
};

export const getQAAIRes = async (
    query: string,
    apiKey: string,
    knowledgeId: string,
    model: string
) => {
    const jwt = genGLMJWT(apiKey);

    const queryParams = {
        model: model,
        messages: genGLMMessages(query),
        temperature: 0.95,
        top_p: 0.7,
        max_tokens: 1024,
        tools: [
            {
                type: 'retrieval',
                retrieval: {
                    knowledge_id: knowledgeId,
                },
            },
        ],
        stream: false,
    };

    logger.info('queryParams:', queryParams);

    try {
        const res = (await axios.post(
            'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            queryParams,
            {
                headers: {
                    Authorization: jwt,
                },
            }
        )) as AxiosResponse<IGLMResponse>;

        logger.info(`${model} res choices:`, res.data?.choices);

        logger.info(
            `${model} tokens cost:`,
            res.data?.usage?.total_tokens
        );

        return (
            res.data.choices[0]?.message?.content ??
            `${model} 服务端响应失败`
        );
    } catch (e) {
        logger.error('call glm error', e);
        return `${model}服务端响应失败`;
    }
};
