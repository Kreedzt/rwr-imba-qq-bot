export interface NekoResultItem {
    artist_href: string;
    artist_name: string;
    source_url: string;
    url: string;
}

export interface NekoRes {
    results: NekoResultItem[];
}