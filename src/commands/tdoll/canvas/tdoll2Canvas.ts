import {
    createCanvas,
    CanvasRenderingContext2D,
    loadImage,
    Image,
} from 'canvas';
import { BaseCanvas } from '../../../services/baseCanvas';
import { ITDollDataItem } from '../types/types';
import { resizeImg } from '../../../utils/imgproxy';
import { CANVAS_STYLE } from '../types/constants';

export class TDoll2Canvas extends BaseCanvas {
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
    imgMap: Map<string, Image> = new Map();

    fileName: string;
    query: string;
    tdolls: ITDollDataItem[];

    constructor(query: string, tdolls: ITDollDataItem[], fileName: string) {
        super();
        this.fileName = fileName;
        this.query = query;
        this.tdolls = tdolls;
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
            await Promise.all(
                this.tdolls.map(async (tdoll) => {
                    try {
                        const avatarUrl = resizeImg(
                            tdoll.avatar,
                            CANVAS_STYLE.IMAGE_SIZE,
                            CANVAS_STYLE.IMAGE_SIZE
                        );
                        const avatarImg = await loadImage(avatarUrl);
                        this.imgMap.set(tdoll.id, avatarImg);

                        if (tdoll.mod === '1') {
                            const avatarModImg = await loadImage(
                                resizeImg(
                                    tdoll.avatarMod,
                                    CANVAS_STYLE.IMAGE_SIZE,
                                    CANVAS_STYLE.IMAGE_SIZE
                                )
                            );
                            this.imgMap.set(`${tdoll.id}__mod`, avatarModImg);
                        }
                    } catch (error) {
                        console.error(
                            `Failed to load image for tdoll ${tdoll.id}:`,
                            error
                        );
                    }
                })
            );
        } catch (error) {
            console.error('Error loading images:', error);
            throw new Error('Failed to load images');
        }
    }

    getTitleSection() {
        return {
            staticSection: '查询 ',
            userSection: `${this.query}`,
            staticSection2: ' 匹配结果',
        };
    }

    getTDollSection(tdoll: ITDollDataItem) {
        const staticSection = `No.`;
        const noSection = `${tdoll.id}`;
        const staticSection2 = ` ${tdoll.nameIngame || ''}${
            tdoll.mod === '1' ? '(mod)' : ''
        } ${tdoll.type || ''}`;

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
    }

    measureList() {
        this.maxLengthStr = '';
        this.tdolls.forEach((tdoll) => {
            this.contentLines += 1;
            const sectionTitle = `No.${tdoll.id} ${tdoll.nameIngame || ''}${
                tdoll.mod === '1' ? '(mod)' : ''
            }`;
            const sectionTitleWidth = this.calcCanvasTextWidth(
                sectionTitle,
                20
            );

            if (sectionTitleWidth > this.measureMaxWidth) {
                this.measureMaxWidth = sectionTitleWidth;
            }
        });

        // text: 40, img: 40, spacing: 10
        this.renderHeight = 120 + this.tdolls.length * (40 + 40 + 10);
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

    private renderTdollTitle(
        context: CanvasRenderingContext2D,
        tdoll: ITDollDataItem
    ): number {
        const section = this.getTDollSection(tdoll);

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

        this.renderStartY += CANVAS_STYLE.LINE_HEIGHT;

        const fullWidth =
            staticSectionWidth +
            idSectionWidth +
            context.measureText(section.staticSection2).width;
        return fullWidth;
    }

    private renderTdollImages(
        context: CanvasRenderingContext2D,
        tdoll: ITDollDataItem
    ): number {
        let maxWidth = 0;
        let offsetX = CANVAS_STYLE.PADDING * 2;

        const renderImage = (image: Image | undefined) => {
            if (image) {
                context.drawImage(
                    image,
                    offsetX,
                    this.renderStartY,
                    CANVAS_STYLE.IMAGE_SIZE,
                    CANVAS_STYLE.IMAGE_SIZE
                );
                offsetX += CANVAS_STYLE.IMAGE_SIZE;
                maxWidth = Math.max(maxWidth, offsetX);
            }
        };

        renderImage(this.imgMap.get(tdoll.id));
        if (tdoll.mod === '1') {
            renderImage(this.imgMap.get(`${tdoll.id}__mod`));
        }

        this.renderStartY += CANVAS_STYLE.IMAGE_SIZE;
        return maxWidth;
    }

    renderList(context: CanvasRenderingContext2D) {
        this.applyBaseStyle(context);
        this.maxRectWidth = 0;

        this.tdolls.forEach((tdoll) => {
            this.renderStartY += 10;
            const titleWidth = this.renderTdollTitle(context, tdoll);
            this.maxRectWidth = Math.max(this.maxRectWidth, titleWidth);

            const imagesWidth = this.renderTdollImages(context, tdoll);
            this.maxRectWidth = Math.max(this.maxRectWidth, imagesWidth);
        });
    }

    renderRect(context: CanvasRenderingContext2D) {
        context.strokeStyle = '#f48225';
        context.rect(
            10,
            this.renderStartY + 10,
            this.maxRectWidth + 20,
            // plus end offset
            this.contentLines * (40 + 40 + 10) + 10
        );
        context.stroke();
        // start offset
        this.renderStartY += 10;
    }

    /**
     * 测量渲染尺寸
     */
    private measureRender() {
        this.measureTitle();
        this.measureList();

        const canvas = createCanvas(this.measureMaxWidth, this.renderHeight);
        const context = canvas.getContext('2d');

        this.renderTitle(context);
        const titleWidth = context.measureText(this.totalTitle).width + 30;

        this.renderList(context);
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
        this.renderList(context);
        this.renderFooter(context);

        return super.writeFile(canvas, this.fileName);
    }
}
