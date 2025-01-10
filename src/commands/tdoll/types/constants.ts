import { TDollCategoryEnum } from './enums';

export const TDOLL_RANDOM_KEY = 'random';

export const TDOLL_URL_PREFIX = 'https://www.gfwiki.org';

export const TDOLL_SKIN_NOT_FOUND =
    '未找到指定人形编号的皮肤, 请检查输入是否有误!';

export const TDOLL_SKIN_END_TEXT =
    '所有数据来源于 gfwiki, 不保证与游戏内一致性, 请注意数据与实际游戏可能存在差异';

export const TDOLL_CATEGORY_EN_MAPPER: Record<string, TDollCategoryEnum> = {
    ar: TDollCategoryEnum.AR,
    smg: TDollCategoryEnum.SMG,
    rf: TDollCategoryEnum.RF,
    mg: TDollCategoryEnum.MG,
    sg: TDollCategoryEnum.SG,
    hg: TDollCategoryEnum.HG,
};

export const TDOLL_CATEGORY_CN_MAPPER: Record<string, TDollCategoryEnum> = {
    突击步枪: TDollCategoryEnum.AR,
    冲锋枪: TDollCategoryEnum.SMG,
    步枪: TDollCategoryEnum.RF,
    机枪: TDollCategoryEnum.MG,
    霰弹枪: TDollCategoryEnum.SG,
    手枪: TDollCategoryEnum.HG,
};

export const TDOLL_SKIN_NOT_FOUND_MSG =
    '未找到指定人形编号的皮肤, 请检查输入是否有误, 请注意需要输入编号而非名称!\n若确认输入编号无误, 多数是 gfwiki 数据问题, 请尝试去 gfwiki 查看数据(这并不是 bot 本身问题)';

export const TDOLL_OUTPUT_FOLDER = 'out';

export const TDOLL2_OUTPUT_FILE = 'tdoll2.png';

export const CANVAS_STYLE = {
    FONT: 'bold 20pt Consolas',
    TEXT_COLOR: '#fff',
    BACKGROUND_COLOR: '#451a03',
    BORDER_COLOR: '#f48225',
    PADDING: 10,
    IMAGE_SIZE: 40,
    LINE_HEIGHT: 40,
    TITLE_OFFSET: 60,
    RECT_OFFSET: 10,
};

export const TDOLL2_SKIN_OUTPUT_FILE = 'tdoll_skin2.png';
