import {
    createCanvas,
    CanvasRenderingContext2D,
    loadImage,
    Image,
} from 'canvas';
import { BaseCanvas } from '../../../services/baseCanvas';
import { ITDollDataItem, ITDollSkinDataItem } from '../types/types';
import { resizeImg } from '../../../utils/imgproxy';
import { CANVAS_STYLE, TDOLL_URL_PREFIX } from '../types/constants';

export class TDollSkin2Canvas extends BaseCanvas {
    renderStartY: number = 0;
    totalTitle: string = '';
    totalFooter: string = '';

    // render params data
    measureMaxWidth = 0;
    renderWidth = 0;
    renderHeight = 0;
    maxRectWidth = 0;

    maxLengthStr: string = '';
    contentLines = 0;
    // key: tdoll id
    tdollImgMap: Map<string, Image> = new Map();
    // key: tdollskin id
    tdollSkinImgMap: Map<string, Image> = new Map();

    fileName: string;
    query: string;
    tdoll?: ITDollDataItem = undefined;
    tdolls: ITDollDataItem[];
    skinsRecord: Record<string, ITDollSkinDataItem>;
    skinList?: ITDollSkinDataItem = undefined;

    constructor(
        query: string,
        tdolls: ITDollDataItem[],
        record: Record<string, ITDollSkinDataItem>,
        fileName: string
    ) {
        super();
        this.fileName = fileName;
        this.query = query;
        this.tdolls = tdolls;
        this.tdoll = tdolls.find((tdoll) => tdoll.id === query);
        this.skinsRecord = record;
        const matchSkinRecord = record[query];
        if (matchSkinRecord) {
            this.skinList = Object.values(matchSkinRecord).filter(
                (s) => s.image
            );
        }
    }

    private applyBaseStyle(context: CanvasRenderingContext2D) {
        this.setContextStyle(context, {
            font: CANVAS_STYLE.FONT,
            textAlign: 'left',
            textBaseline: 'top',
            fillStyle: CANVAS_STYLE.TEXT_COLOR,
        });
    }

    private setContextStyle(
        context: CanvasRenderingContext2D,
        style: {
            font?: string;
            textAlign?: CanvasTextAlign;
            textBaseline?: CanvasTextBaseline;
            fillStyle?: string | CanvasGradient | CanvasPattern;
        }
    ) {
        if (style.font) context.font = style.font;
        if (style.textAlign) context.textAlign = style.textAlign;
        if (style.textBaseline) context.textBaseline = style.textBaseline;
        if (style.fillStyle) context.fillStyle = style.fillStyle;
    }

    async loadAllImg() {
        try {
            if (!this.tdoll) {
                return;
            }
            const avatarUrl = resizeImg(
                this.tdoll.avatar,
                CANVAS_STYLE.IMAGE_SIZE,
                CANVAS_STYLE.IMAGE_SIZE
            );
            const avatarImg = await loadImage(avatarUrl);
            this.tdollImgMap.set(this.tdoll.id, avatarImg);

            if (this.skinList?.length) {
                await Promise.all(
                    this.skinList.map(async (skin) => {
                        if (!skin.image) return;
                        const imgRawUrl = skin.image.pic.includes(
                            TDOLL_URL_PREFIX
                        )
                            ? skin.image.pic
                            : `${TDOLL_URL_PREFIX}${skin.image.pic}`;

                        const imgResizeUrl = resizeImg(imgRawUrl, 150, 150);

                        const skinImg = await loadImage(imgResizeUrl);

                        this.tdollSkinImgMap.set(skin.value, skinImg);
                    })
                );
            }
        } catch (error) {
            console.error(
                `Failed to load image for tdoll ${this.tdoll?.id}:`,
                error
            );
        }
    }

    getTitleSection() {
        return {
            staticSection: '查询 ',
            userSection: `${this.query}`,
            staticSection2: ' 匹配结果',
        };
    }

    getTDollSection() {
        const staticSection = `No.`;
        const noSection = this.tdoll?.id || '';
        const staticSection2 = ` ${this.tdoll?.nameIngame || ''}`;

        return {
            staticSection,
            noSection,
            staticSection2,
        };
    }

    measureTitle() {
        const section = this.getTitleSection();
        const title =
            section.staticSection +
            section.userSection +
            section.staticSection2;
        this.totalTitle = title;

        const titleWidth = this.calcCanvasTextWidth(title, 20) + 20;

        if (titleWidth > this.measureMaxWidth) {
            this.measureMaxWidth = titleWidth;
        }

        this.renderHeight += 20;
    }

    measureContent() {
        if (!this.tdoll) {
            return;
        }
        this.maxLengthStr = '';

        const tdollTitle = `No.${this.tdoll.id} ${this.tdoll.nameIngame || ''}`;
        const tdollTitleWidth = this.calcCanvasTextWidth(tdollTitle, 20);
        this.measureMaxWidth = Math.max(this.measureMaxWidth, tdollTitleWidth);

        this.skinList?.forEach((tdoll, index) => {
            const skinTitle = `${index + 1}. ${tdoll.title} ID:${tdoll.value}`;
            const skinTitleWidth = this.calcCanvasTextWidth(skinTitle, 20);

            this.measureMaxWidth = Math.max(
                this.measureMaxWidth,
                skinTitleWidth,
                // img
                150
            );
        });

        // tdoll title: 20
        // spacing: 10
        // tdoll img: 40
        // --- Loop:
        // spacing: 10
        // skin title: 20
        // spacing: 10
        // skin img: 150
        this.renderHeight =
            120 +
            20 +
            10 +
            40 +
            (this.skinList?.length || 0) * (10 + 20 + 10 + 150);
    }

    renderLayout(
        context: CanvasRenderingContext2D,
        width: number,
        height: number
    ) {
        context.fillStyle = '#451a03';
        context.fillRect(0, 0, width, height);
    }

    /**
     * Renders the main title at the top of the canvas
     * @param context - The canvas rendering context
     */
    renderTitle(context: CanvasRenderingContext2D) {
        this.applyBaseStyle(context);
        const section = this.getTitleSection();
        context.fillText(
            section.staticSection,
            CANVAS_STYLE.PADDING,
            CANVAS_STYLE.PADDING
        );
        const staticSectionWidth = context.measureText(
            section.staticSection
        ).width;

        context.fillStyle = '#22d3ee';
        context.fillText(
            section.userSection,
            CANVAS_STYLE.PADDING + staticSectionWidth,
            CANVAS_STYLE.PADDING
        );
        const userSectionWidth = context.measureText(section.userSection).width;

        context.fillStyle = '#fff';
        context.fillText(
            section.staticSection2,
            CANVAS_STYLE.PADDING + userSectionWidth + staticSectionWidth,
            CANVAS_STYLE.PADDING
        );
        this.renderStartY = CANVAS_STYLE.TITLE_OFFSET;
    }

    private renderTdollTitle(context: CanvasRenderingContext2D): number {
        const section = this.getTDollSection();

        // No.
        context.fillStyle = '#fff';
        context.fillText(
            section.staticSection,
            CANVAS_STYLE.PADDING * 2,
            this.renderStartY
        );
        const staticSectionWidth = context.measureText(
            section.staticSection
        ).width;

        // id number
        context.fillStyle = '#f97316';
        context.fillText(
            section.noSection,
            CANVAS_STYLE.PADDING * 2 + staticSectionWidth,
            this.renderStartY
        );
        const idSectionWidth = context.measureText(section.noSection).width;

        // name
        context.fillStyle = '#fff';
        context.fillText(
            section.staticSection2,
            CANVAS_STYLE.PADDING * 2 + staticSectionWidth + idSectionWidth,
            this.renderStartY
        );
        const nameSectionWidth = context.measureText(
            section.staticSection2
        ).width;

        this.renderStartY += CANVAS_STYLE.LINE_HEIGHT;

        const fullWidth =
            staticSectionWidth + idSectionWidth + nameSectionWidth;
        return fullWidth;
    }

    private renderTdollImage(context: CanvasRenderingContext2D): number {
        if (!this.tdoll) {
            return 0;
        }
        let maxWidth = 0;
        let offsetX = CANVAS_STYLE.PADDING * 2;

        const image = this.tdollImgMap.get(this.tdoll.id);
        if (image) {
            context.drawImage(
                image,
                offsetX,
                this.renderStartY,
                CANVAS_STYLE.IMAGE_SIZE,
                CANVAS_STYLE.IMAGE_SIZE
            );

            offsetX += CANVAS_STYLE.IMAGE_SIZE;
            maxWidth = Math.max(maxWidth, CANVAS_STYLE.IMAGE_SIZE);
        }

        this.renderStartY += CANVAS_STYLE.LINE_HEIGHT;
        return maxWidth;
    }

    private renderTdollSkins(context: CanvasRenderingContext2D): number {
        if (!this.tdoll) {
            return 0;
        }
        let maxWidth = 0;

        let offsetX = CANVAS_STYLE.PADDING * 2;

        this.skinList?.forEach((skin, index) => {
            const image = this.tdollSkinImgMap.get(skin.value);
            if (!image) return;

            this.renderStartY += 10;
            context.fillStyle = '#fff';

            const title = `${index + 1}. ${skin.title} ID:${skin.value}`;
            context.fillText(title, offsetX, this.renderStartY);
            const textWidth = context.measureText(title).width;

            this.renderStartY += 20 + 10;
            context.drawImage(image, offsetX, this.renderStartY, 150, 150);

            this.renderStartY += 150;

            maxWidth = Math.max(maxWidth, textWidth, 150);
        });

        return maxWidth;
    }

    renderContent(context: CanvasRenderingContext2D) {
        this.applyBaseStyle(context);
        this.maxRectWidth = 0;

        this.renderStartY += 10;
        const titleWidth = this.renderTdollTitle(context);
        this.maxRectWidth = Math.max(this.maxRectWidth, titleWidth);

        const imagesWidth = this.renderTdollImage(context);
        this.maxRectWidth = Math.max(this.maxRectWidth, imagesWidth);

        const skinsWidth = this.renderTdollSkins(context);
        this.maxRectWidth = Math.max(this.maxRectWidth, skinsWidth);
    }

    renderRect(context: CanvasRenderingContext2D) {
        context.strokeStyle = '#f48225';
        context.rect(
            10,
            this.renderStartY + 10,
            this.maxRectWidth + 20,
            // tdoll title: 20
            // spacing: 10
            // tdoll img: 40
            // --- Loop:
            // spacing: 10
            // skin title: 20
            // spacing: 10
            // skin img: 150
            // staic padding: 10
            20 +
                10 +
                40 +
                (this.skinList?.length || 0) * (10 + 20 + 10 + 150) +
                10
        );
        context.stroke();
        // start offset
        this.renderStartY += 10;
    }

    /**
     * 测量渲染尺寸
     */
    private measureRender() {
        this.renderHeight = 0;
        this.measureTitle();
        this.measureContent();

        const canvas = createCanvas(this.measureMaxWidth, this.renderHeight);
        const context = canvas.getContext('2d');

        this.renderTitle(context);
        const titleWidth = context.measureText(this.totalTitle).width + 30;

        this.renderContent(context);
        const listWidth = this.maxRectWidth + 40;

        this.renderFooter(context);
        const footerWidth = context.measureText(this.totalFooter).width + 30;

        this.renderWidth = Math.max(titleWidth, listWidth, footerWidth);
    }

    async render() {
        await this.loadAllImg();
        this.record();
        this.measureRender();

        const canvas = createCanvas(this.renderWidth, this.renderHeight);
        const context = canvas.getContext('2d');

        this.renderLayout(context, this.renderWidth, this.renderHeight);
        this.renderBgImg(context, this.renderWidth, this.renderHeight);
        this.renderTitle(context);
        this.renderRect(context);
        this.renderContent(context);
        this.renderFooter(context);

        return super.writeFile(canvas, this.fileName);
    }
}
