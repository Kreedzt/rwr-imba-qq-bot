import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { logger } from './logger';
// import axios, { Axios, AxiosInstance } from 'axios';

export class RemoteService {
    axiosInst: AxiosInstance;
    static selfInst: RemoteService;

    constructor(remoteUrl: string) {
        logger.info('Remote service init with:', remoteUrl);
        const axiosInst = axios.create({
            baseURL: remoteUrl,
            timeout: 1000,
        });

        axiosInst.defaults.headers.post['Content-Type'] = 'application/json';

        axiosInst.interceptors.request.use(config => {
            const queryUrl = config.url;
            const queryParams = config.params;

            logger.info('> request:', queryUrl, queryParams);
            return config;
        });

        axiosInst.interceptors.response.use(config => {
            const resData = config.data;
            logger.info('> response:', resData);
            return config;
        });

        this.axiosInst = axiosInst;
    }

    static init(remoteUrl: string) {
        if (!RemoteService.selfInst) {
            RemoteService.selfInst = new RemoteService(remoteUrl);
        }
    }

    static getInst() {
        return RemoteService.selfInst;
    }

    sendPrivateMsg(params: {
        user_id: number;
        message: any;
        // default: false
        auto_escape?: boolean;
    }) {
        return this.axiosInst.post('/send_private_msg', params);
    }

    sendGroupMsg(params: {
        group_id: number;
        message: any;
    }) {
        return this.axiosInst.post('/send_group_msg', params);
    }

    sendMsg(params: {
        user_id: number;
        group_id: number;
        message: any;
    }) {
        return this.axiosInst.post('/send_msg', params);
    }
}
