export interface WaifuTag {
    tag_id: number;
    name: string;
    description: string;
    is_nsfw: boolean;
}

export interface WaifuImage {
    signature: string;
    extension: string;
    image_id: number;
    favourites: number;
    dominant_color: string;
    source: string;
    uploaded_at: string;
    is_nsfw: boolean;
    width: number;
    height: number;
    url: string;
    preview_url: string;
    tags: WaifuTag[];
}

export interface WaifuRes {
    images: WaifuImage[];
}