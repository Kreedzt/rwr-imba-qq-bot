export interface SetuSizeItem {
    original: string;
    regular?: string;
    small?: string;
    thumb?: string;
    mini?: string;
}

export interface SetuResDataItem {
    pid: number;
    p: number;
    uid: number;
    title: string;
    author: string;
    r18: boolean;
    width: number;
    height: number;
    tags: string[];
    ext: string;
    uploadDate: number;
    urls: SetuSizeItem;
}

export type SetuRes = {
    error: string;
    data: SetuResDataItem[];
}