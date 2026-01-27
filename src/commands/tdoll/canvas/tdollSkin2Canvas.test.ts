import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TDollSkin2Canvas } from './tdollSkin2Canvas';
import { ITDollDataItem, ITDollSkinDataItem } from '../types/types';
import { CANVAS_STYLE } from '../types/constants';

// Mock canvas backend to avoid loading native renderer.
vi.mock('../../../services/canvasBackend', () => ({
    // Avoid referencing imported constants here; vi.mock is hoisted.
    createCanvas: vi.fn().mockImplementation(() => ({
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
        toBufferSync: vi.fn().mockReturnValue(Buffer.from('test')),
    })),
    loadImageFrom: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
    toPngBuffer: vi
        .fn()
        .mockImplementation((canvas: any) => canvas.toBufferSync('png')),
}));

// Test helper class to access protected members
class TestTDollSkin2Canvas extends TDollSkin2Canvas {
    constructor(
        query: string,
        tdolls: ITDollDataItem[],
        record: Record<string, ITDollSkinDataItem>,
        fileName: string,
    ) {
        super(query, tdolls, record, fileName);
    }

    // Expose protected members for testing
    get testQuery() {
        return this.query;
    }
    get testTDolls() {
        return this.tdolls;
    }
    get testFileName() {
        return this.fileName;
    }
    get testTDoll() {
        return this.tdoll;
    }
    get testSkinsRecord() {
        return this.skinsRecord;
    }
    get testSkinList() {
        return this.skinList;
    }
    get testTDollImgMap() {
        return this.tdollImgMap;
    }
    get testTDollSkinImgMap() {
        return this.tdollSkinImgMap;
    }

    // Expose protected methods for testing
    async testLoadAllImg() {
        return this.loadAllImg();
    }
    testGetTitleSection() {
        return this.getTitleSection();
    }
    testGetTDollSection() {
        return this.getTDollSection();
    }
    testMeasureTitle() {
        return this.measureTitle();
    }
    testMeasureContent() {
        return this.measureContent();
    }
    testGetSkinsHeight() {
        return this.getSkinsHeight();
    }
}

describe('TDollSkin2Canvas', () => {
    let tdollSkinCanvas: TestTDollSkin2Canvas;
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
        '1': [
            {
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
                    pic_h: 'test-skin-h.jpg',
                },
            },
        ],
    };

    beforeEach(() => {
        tdollSkinCanvas = new TestTDollSkin2Canvas(
            '1',
            mockTDolls,
            mockSkinRecord,
            'test.png',
        );
    });

    it('should initialize correctly', () => {
        expect(tdollSkinCanvas).toBeInstanceOf(TDollSkin2Canvas);
        expect(tdollSkinCanvas.testQuery).toBe('1');
        expect(tdollSkinCanvas.testTDolls).toEqual(mockTDolls);
        expect(tdollSkinCanvas.testFileName).toBe('test.png');
        expect(tdollSkinCanvas.testTDoll).toEqual(mockTDolls[0]);
        expect(tdollSkinCanvas.testSkinsRecord).toEqual(mockSkinRecord);
    });

    describe('loadAllImg', () => {
        it('should load images successfully', async () => {
            await expect(
                tdollSkinCanvas.testLoadAllImg(),
            ).resolves.not.toThrow();
            expect(tdollSkinCanvas.testTDollImgMap.size).toBe(1);
            expect(tdollSkinCanvas.testTDollSkinImgMap.size).toBe(1);
        });

        it('should handle missing tdoll gracefully', async () => {
            // Create a new instance with empty tdolls array to ensure no tdoll is found
            tdollSkinCanvas = new TestTDollSkin2Canvas(
                '1',
                [],
                mockSkinRecord,
                'test.png',
            );
            await expect(
                tdollSkinCanvas.testLoadAllImg(),
            ).resolves.not.toThrow();
            expect(tdollSkinCanvas.testTDollImgMap.size).toBe(0);
        });
    });

    describe('getTitleSection', () => {
        it('should return correct title sections', () => {
            const sections = tdollSkinCanvas.testGetTitleSection();
            expect(sections.staticSection).toBe('查询 ');
            expect(sections.userSection).toBe('1');
            expect(sections.staticSection2).toBe(' 匹配结果');
        });
    });

    describe('getTDollSection', () => {
        it('should return correct tdoll sections', () => {
            const sections = tdollSkinCanvas.testGetTDollSection();
            expect(sections.staticSection).toBe('No.');
            expect(sections.noSection).toBe('1');
            expect(sections.staticSection2).toBe(' Test Doll AR');
        });

        it('should handle missing tdoll gracefully', async () => {
            // Create a new instance with empty tdolls array to ensure no tdoll is found
            tdollSkinCanvas = new TestTDollSkin2Canvas(
                '1',
                [],
                mockSkinRecord,
                'test.png',
            );
            const sections = tdollSkinCanvas.testGetTDollSection();
            expect(sections.noSection).toBe('');
            expect(sections.staticSection2).toBe('  ');
        });
    });

    describe('getSkinsHeight', () => {
        it('should calculate correct skins height', () => {
            const height = tdollSkinCanvas.testGetSkinsHeight();
            expect(height).toBe(200); // 10 + 40 + 150 for one skin
        });

        it('should return 0 when no skins', () => {
            // Create a new instance with empty skin record to ensure no skins are found
            tdollSkinCanvas = new TestTDollSkin2Canvas(
                '1',
                mockTDolls,
                {},
                'test.png',
            );
            const height = tdollSkinCanvas.testGetSkinsHeight();
            expect(height).toBe(0);
        });
    });

    describe('render', () => {
        it('should render canvas without errors', async () => {
            await expect(tdollSkinCanvas.render()).resolves.not.toThrow();
        });
    });
});
