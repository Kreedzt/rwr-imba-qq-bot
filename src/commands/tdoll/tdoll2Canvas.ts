import {
    createCanvas,
    CanvasRenderingContext2D,
    loadImage,
    Image,
} from 'canvas';
import { BaseCanvas } from '../../services/baseCanvas';
import { ITDollDataItem } from './types';
import { resizeImg } from '../../utils/imgproxy';

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

    async loadAllImg() {
        await Promise.all(
            this.tdolls.map(async (tdoll) => {
                const avatarUrl = resizeImg(tdoll.avatar, 40, 40);
                const avatarImg = await loadImage(avatarUrl);
                this.imgMap.set(tdoll.id, avatarImg);
                if (tdoll.mod === '1') {
                    const avatarModImg = await loadImage(
                        resizeImg(tdoll.avatarMod, 40, 40)
                    );
                    this.imgMap.set(`${tdoll.id}__mod`, avatarModImg);
                }
            })
        );
    }

    measureTitle() {
        const title = `查询: \`${this.query}\` 匹配结果`;
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

        this.renderHeight = 120 + this.tdolls.length * 2 * 40;
    }

    renderLayout(
        context: CanvasRenderingContext2D,
        width: number,
        height: number
    ) {
        context.fillStyle = '#451a03';
        context.fillRect(0, 0, width, height);
    }

    renderTitle(context: CanvasRenderingContext2D) {
        context.font = 'bold 20pt Consolas';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillStyle = '#fff';
        context.fillText(this.totalTitle, 10, 10);

        this.renderStartY = 10 + 40 + 10;
    }

    renderList(context: CanvasRenderingContext2D) {
        context.font = 'bold 20pt Consolas';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillStyle = '#fff';

        this.maxRectWidth = 0;
        this.tdolls.forEach((tdoll) => {
            // title
            const sectionTitle = `No.${tdoll.id} ${tdoll.nameIngame || ''}${
                tdoll.mod === '1' ? '(mod)' : ''
            }`;
            const sectionTitleWidth = context.measureText(sectionTitle).width;
            context.fillText(sectionTitle, 10, this.renderStartY);
            this.renderStartY += 40;

            if (sectionTitleWidth > this.maxRectWidth) {
                this.maxRectWidth = sectionTitleWidth;
            }

            // img
            const avatarImg = this.imgMap.get(tdoll.id);
            let offsetX = 10;
            if (avatarImg) {
                context.drawImage(avatarImg, 10, this.renderStartY, 40, 40);
                offsetX += 40;
                if (40 > this.maxRectWidth) {
                    this.maxRectWidth = 40;
                }
            }
            const avatarModImg = this.imgMap.get(`${tdoll.id}__mod`);
            if (avatarModImg) {
                context.drawImage(
                    avatarModImg,
                    offsetX,
                    this.renderStartY,
                    40,
                    40
                );
                if (80 > this.maxRectWidth) {
                    this.maxRectWidth = 80;
                }
            }
            this.renderStartY += 40;
        });
    }

    renderRect(context: CanvasRenderingContext2D) {
        context.strokeStyle = '#f48225';
        context.rect(
            10,
            this.renderStartY + 10,
            this.maxRectWidth + 20,
            // plus end offset
            this.contentLines * 40 * 2 + 10
        );
        context.stroke();
        // start offset
        this.renderStartY += 10;
    }

    measureRender() {
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
