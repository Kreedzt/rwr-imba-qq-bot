import { ImageLike, loadImageFrom } from './canvasBackend';

export class CanvasImgService {
    private static instance: CanvasImgService;
    private imgMap = new Map<string, ImageLike>();
    private imgReady = new Map<string, boolean>();

    private constructor() {}

    static getInstance() {
        if (!CanvasImgService.instance) {
            CanvasImgService.instance = new CanvasImgService();
        }
        return CanvasImgService.instance;
    }

    private async loadImageAsync(path: string): Promise<ImageLike> {
        const image = await loadImageFrom(path);
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

    getImg(path: string): ImageLike | undefined {
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
