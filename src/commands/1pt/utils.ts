import axios from "axios";
import { API_URL, RES_URL_PREFIX } from "./constants";
import { OnePtRes } from "./types";

const axiosInst = axios.create({
    timeout: 10 * 1000,
});

axiosInst.defaults.headers.post['Content-Type'] = 'application/json';

export const getShortInfo = async (url: string) => {
    const data = (await axiosInst.get(`${API_URL}/1pt/addURL.php?url=${url}`)).data as OnePtRes;

    return data;
}

export const getShortUrl = (short: string): string => {
    return `${RES_URL_PREFIX}/${short}`;
}