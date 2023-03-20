import { IRegister } from "../../types";
import { getReplyOutput } from "./utils";

export const WebsiteCommandRegister: IRegister = {
    name: "website",
    description: "帮助网站列表.[10s CD]",
    timesInterval: 10,
    isAdmin: false,
    exec: async (ctx) => {
        await ctx.reply(getReplyOutput(ctx.env));
    }
}