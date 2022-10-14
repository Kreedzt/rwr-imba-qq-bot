import axios from "axios";
import { API_URL } from "./constants";
import { TouhouRes } from "./types";

const axiosInst = axios.create({
    timeout: 10 * 1000,
});

axiosInst.defaults.headers.post['Content-Type'] = 'application/json';

export const getImgInfo = async () => {
    const data = (await axiosInst.get(`${API_URL}?type=json&proxy=0`)).data as TouhouRes;

    return data;
}