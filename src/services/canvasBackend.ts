import {
    Canvas,
    CanvasRenderingContext2D,
    Image,
    loadImage,
} from 'skia-canvas';
import { initCanvasFonts } from './canvasFonts';

export type CanvasLike = Canvas;
export type Canvas2DContext = CanvasRenderingContext2D;
export type ImageLike = Image;

let initialized = false;

function ensureInit() {
    if (initialized) {
        return;
    }
    initialized = true;
    initCanvasFonts();
}

export function createCanvas(width: number, height: number): CanvasLike {
    ensureInit();
    return new Canvas(width, height);
}

export async function loadImageFrom(src: string | Buffer): Promise<ImageLike> {
    ensureInit();
    // skia-canvas loadImage supports file paths, URLs, data-URLs, and Buffers.
    return loadImage(src as any);
}

export function toPngBuffer(canvas: CanvasLike): Buffer {
    ensureInit();
    // Keep existing call-sites synchronous.
    return canvas.toBufferSync('png');
}
