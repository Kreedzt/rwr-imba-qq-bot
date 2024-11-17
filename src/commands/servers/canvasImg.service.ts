import { Image, loadImage } from 'canvas';

export class CanvasImgService {
    private static instance: CanvasImgService;
    private imgMap = new Map<string, Image>();
    private imgReady = new Map<string, boolean>();

    private constructor() {}

    static getInstance() {
        if (!CanvasImgService.instance) {
            CanvasImgService.instance = new CanvasImgService();
        }
        return CanvasImgService.instance;
    }

    private async loadImageAsync(path: string): Promise<Image> {
        const image = await loadImage(path);
        this.imgMap.set(path, image);
        this.imgReady.set(path, true);
        return image;
    }

    async addTask(path: string) {
        if (this.imgMap.has(path)) {
            return;
        }
        this.imgReady.set(path, false);
        await this.loadImageAsync(path);
    }

    getImg(path: string): Image | undefined {
        if (this.imgMap.has(path)) {
            if (this.imgReady.get(path)) {
                return this.imgMap.get(path);
            }
        }
    }

    async addImg(path: string) {
        if (!this.imgMap.has(path)) {
            await this.addTask(path);
        }
    }
}
