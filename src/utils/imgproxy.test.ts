import {describe, expect, it} from "vitest";
import { resizeImg } from "./imgproxy";

describe('imgproxy', ()=> {
    it.concurrent('should return correct', () => {
        process.env.IMGPROXY_URL = 'https://imgproxy.example.com';

        const res = resizeImg('https://www.gfwiki.org/images/6/68/Icon_No.394.png', 200, 200)

        expect(res).toBe('https://imgproxy.example.com/sig/size:200:200/resizing_type:fit/aHR0cHM6Ly93d3cuZ2Z3aWtpLm9yZy9pbWFnZXMvNi82OC9JY29uX05vLjM5NC5wbmc=');
        process.env.IMGPROXY_URL = undefined;
    });
});
