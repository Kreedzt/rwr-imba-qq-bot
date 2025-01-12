import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TDollSkin2Canvas } from './tdollSkin2Canvas';
import { ITDollDataItem, ITDollSkinDataItem } from '../types/types';
import { CANVAS_STYLE } from '../types/constants';

// Mock canvas and image loading
vi.mock('canvas', async (importOriginal) => {
    const actual = await importOriginal<typeof import('canvas')>();
    return {
        ...actual,
        createCanvas: vi
            .fn()
            .mockImplementation((width: number, height: number) => ({
                getContext: vi.fn().mockReturnValue({
                    fillStyle: '',
                    fillRect: vi.fn(),
                    fillText: vi.fn(),
                    measureText: vi.fn().mockReturnValue({ width: 100 }),
                    strokeStyle: '',
                    rect: vi.fn(),
                    stroke: vi.fn(),
                    drawImage: vi.fn(),
                }),
                toBuffer: vi.fn().mockReturnValue(Buffer.from('test')),
            })),
        loadImage: vi.fn().mockImplementation((src: string) =>
            Promise.resolve({
                width: CANVAS_STYLE.IMAGE_SIZE,
                height: CANVAS_STYLE.IMAGE_SIZE,
            })
        ),
    };
});

describe('TDollSkin2Canvas', () => {
    let tdollSkinCanvas: TDollSkin2Canvas;
    const mockTDolls = [
        {
            id: '1',
            nameIngame: 'Test Doll',
            avatar: 'test.jpg',
            mod: '0',
            type: 'AR',
        },
    ] as ITDollDataItem[];

    const mockSkinRecord: Record<string, ITDollSkinDataItem> = {
        '1': [{
            index: 0,
            value: 'skin1',
            title: 'Test Skin',
            image: {
                anime: 'test-anime.gif',
                line: 'test-line.png',
                name: 'Test Skin',
                pic: 'test-skin.jpg',
                pic_d: 'test-skin-d.jpg',
                pic_d_h: 'test-skin-d-h.jpg',
                pic_h: 'test-skin-h.jpg'
            }
        }]
    };

    beforeEach(() => {
        tdollSkinCanvas = new TDollSkin2Canvas('1', mockTDolls, mockSkinRecord, 'test.png');
    });

    it('should initialize correctly', () => {
        expect(tdollSkinCanvas).toBeInstanceOf(TDollSkin2Canvas);
        expect(tdollSkinCanvas.query).toBe('1');
        expect(tdollSkinCanvas.tdolls).toEqual(mockTDolls);
        expect(tdollSkinCanvas.fileName).toBe('test.png');
        expect(tdollSkinCanvas.tdoll).toEqual(mockTDolls[0]);
        expect(tdollSkinCanvas.skinsRecord).toEqual(mockSkinRecord);
    });

    describe('loadAllImg', () => {
        it('should load images successfully', async () => {
            await expect(tdollSkinCanvas.loadAllImg()).resolves.not.toThrow();
            expect(tdollSkinCanvas.tdollImgMap.size).toBe(1);
            expect(tdollSkinCanvas.tdollSkinImgMap.size).toBe(1);
        });

        it('should handle missing tdoll gracefully', async () => {
            tdollSkinCanvas.tdoll = undefined;
            await expect(tdollSkinCanvas.loadAllImg()).resolves.not.toThrow();
            expect(tdollSkinCanvas.tdollImgMap.size).toBe(0);
        });
    });

    describe('measureTitle', () => {
        it('should measure title width correctly', () => {
            tdollSkinCanvas.measureTitle();
            expect(tdollSkinCanvas.measureMaxWidth).toBeGreaterThan(0);
            expect(tdollSkinCanvas.totalTitle).toContain('1');
        });
    });

    describe('measureContent', () => {
        it('should measure content dimensions correctly', () => {
            tdollSkinCanvas.measureContent();
            expect(tdollSkinCanvas.measureMaxWidth).toBeGreaterThan(0);
            expect(tdollSkinCanvas.renderHeight).toBeGreaterThan(0);
        });

        it('should handle missing tdoll gracefully', () => {
            tdollSkinCanvas.tdoll = undefined;
            tdollSkinCanvas.measureContent();
            expect(tdollSkinCanvas.maxLengthStr).toBe('');
        });
    });

    describe('getTitleSection', () => {
        it('should return correct title sections', () => {
            const sections = tdollSkinCanvas.getTitleSection();
            expect(sections.staticSection).toBe('查询 ');
            expect(sections.userSection).toBe('1');
            expect(sections.staticSection2).toBe(' 匹配结果');
        });
    });

    describe('getTDollSection', () => {
        it('should return correct tdoll sections', () => {
            const sections = tdollSkinCanvas.getTDollSection();
            expect(sections.staticSection).toBe('No.');
            expect(sections.noSection).toBe('1');
            expect(sections.staticSection2).toBe(' Test Doll AR');
        });

        it('should handle missing tdoll gracefully', () => {
            tdollSkinCanvas.tdoll = undefined;
            const sections = tdollSkinCanvas.getTDollSection();
            expect(sections.noSection).toBe('');
            expect(sections.staticSection2).toBe('  ');
        });
    });

    describe('getSkinsHeight', () => {
        it('should calculate correct skins height', () => {
            const height = tdollSkinCanvas.getSkinsHeight();
            expect(height).toBe(200); // 10 + 40 + 150 for one skin
        });

        it('should return 0 when no skins', () => {
            tdollSkinCanvas.skinList = undefined;
            const height = tdollSkinCanvas.getSkinsHeight();
            expect(height).toBe(0);
        });
    });

    describe('render', () => {
        it('should render canvas without errors', async () => {
            await expect(tdollSkinCanvas.render()).resolves.not.toThrow();
        });
    });
});
