import axios from "axios";
import { API_URL } from "./constants";
import { NekoRes } from "./types";

const axiosInst = axios.create({
    timeout: 10 * 1000,
});

axiosInst.defaults.headers.post['Content-Type'] = 'application/json';

export const getNekoImgs = async () => {
    const data = (await axiosInst.get(`${API_URL}/v2/neko`)).data as NekoRes;

    return data;
}