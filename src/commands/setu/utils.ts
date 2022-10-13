import axios from "axios";
import { API_URL } from "./constants";
import { SetuRes } from "./types";

const axiosInst = axios.create({
    timeout: 10 * 1000,
});

axiosInst.defaults.headers.post['Content-Type'] = 'application/json';

export const getImgInfo = async () => {
    const data = (await axiosInst.post(API_URL, {
        r18: 0
    })).data as SetuRes;

    return data;
}