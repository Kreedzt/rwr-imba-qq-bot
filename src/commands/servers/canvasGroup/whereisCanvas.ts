import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import { IUserMatchedServerItem } from '../types';
import {
    calcCanvasTextWidth,
    getCountColor,
    getWhereisHeaderSectionText,
    getUserMatchedServerDisplaySectionText,
    getWhereisFooterSectionText,
} from '../utils';
import { BaseCanvas } from './baseCanvas';

export class WhereisCanvas extends BaseCanvas {
    // constructor params
    matchList: IUserMatchedServerItem[];
    fileName: string;
    query: string;
    count: number;

    // render params data
    measureMaxWidth = 0;
    renderWidth = 0;
    renderHeight = 0;

    titleData: ReturnType<typeof getWhereisHeaderSectionText> = {
        staticSection: '',
        userSection: '',
        staticSection2: '',
    };
    totalTitle = '';

    maxLengthStr = '';
    renderStartY = 0;
    maxRectWidth = 0;
    contentLines = 0;

    totalFooter = '';

    constructor(
        matchList: IUserMatchedServerItem[],
        query: string,
        count: number,
        fileName: string
    ) {
        super();
        this.matchList = matchList;
        this.query = query;
        this.count = count;
        this.fileName = fileName;
    }

    measureTitle() {
        const titleData = getWhereisHeaderSectionText(this.query);
        this.titleData = titleData;

        this.totalTitle =
            titleData.staticSection +
            titleData.userSection +
            titleData.staticSection2;

        const titleWidth = calcCanvasTextWidth(this.totalTitle, 20) + 20;
        if (titleWidth > this.measureMaxWidth) {
            this.measureMaxWidth = titleWidth;
        }
    }

    measureList() {
        this.maxLengthStr = '';
        this.matchList.forEach((m) => {
            this.contentLines += 1;
            const section = getUserMatchedServerDisplaySectionText(m);
            const outputText =
                section.userSection +
                section.staticSection +
                section.serverCount +
                section.mapSection;
            if (outputText.length > this.maxLengthStr.length) {
                this.maxLengthStr = outputText;
            }
        });

        this.renderHeight = 120 + 40 + this.matchList.length * 40;
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

        // static section
        context.fillStyle = '#fff';
        context.fillText(this.titleData.staticSection, 10, 10);
        const titleStaticSectionWidth = context.measureText(
            this.titleData.staticSection
        ).width;

        // user section
        context.fillStyle = '#22d3ee';
        context.fillText(
            this.titleData.userSection,
            10 + titleStaticSectionWidth,
            10
        );
        const titleUserSectionWidth = context.measureText(
            this.titleData.userSection
        ).width;

        // static section 2
        context.fillStyle = '#fff';
        context.fillText(
            this.titleData.staticSection2,
            10 + titleStaticSectionWidth + titleUserSectionWidth,
            10
        );

        this.renderStartY = 10 + 40 + 10;
    }

    renderList(context: CanvasRenderingContext2D) {
        context.font = 'bold 20pt Consolas';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillStyle = '#3574d4';

        this.maxRectWidth = 0;
        this.matchList.forEach((m) => {
            /**
             * Render user in server info text
             */
            const outputSectionText = getUserMatchedServerDisplaySectionText(m);
            // all text, update maxRectWidth
            const allText =
                outputSectionText.userSection +
                outputSectionText.staticSection +
                outputSectionText.serverCount +
                outputSectionText.mapSection;
            const allTextWidth = context.measureText(allText).width;
            if (allTextWidth > this.maxRectWidth) {
                this.maxRectWidth = allTextWidth;
            }

            // user section
            context.fillStyle = '#22d3ee';
            context.fillText(
                outputSectionText.userSection,
                20,
                10 + this.renderStartY
            );
            const userSectionWidth = context.measureText(
                outputSectionText.userSection
            ).width;

            // user + server static section(xxx is playing server1)
            context.fillStyle = '#fff';
            context.fillText(
                outputSectionText.staticSection,
                20 + userSectionWidth,
                10 + this.renderStartY
            );
            const staticSectionWidth = context.measureText(
                outputSectionText.staticSection
            ).width;

            // server capacity count section
            context.fillStyle = getCountColor(
                m.server.current_players,
                m.server.max_players
            );
            context.fillText(
                outputSectionText.serverCount,
                20 + userSectionWidth + staticSectionWidth,
                10 + this.renderStartY
            );
            const serverCountWidth = context.measureText(
                outputSectionText.serverCount
            ).width;

            // server map section
            context.fillStyle = '#fff';
            context.fillText(
                outputSectionText.mapSection,
                20 + userSectionWidth + staticSectionWidth + serverCountWidth,
                10 + this.renderStartY
            );

            this.renderStartY += 40;
        });
    }

    renderFooterExtra(context: CanvasRenderingContext2D) {
        const footerData = getWhereisFooterSectionText(this.count);
        context.fillStyle = '#fff';
        context.font = 'bold 10pt Consolas';
        context.textAlign = 'left';
        context.fillText(footerData, 10, this.renderStartY + 20);
        this.renderStartY += 40;
    }

    renderRect(context: CanvasRenderingContext2D) {
        context.strokeStyle = '#f48225';
        context.rect(
            10,
            this.renderStartY + 10,
            this.maxRectWidth + 20,
            this.contentLines * 40 + 10
        );
        context.stroke();
        this.renderStartY += 10;
    }

    measureRender() {
        this.measureTitle();
        this.measureList();

        const canvas = createCanvas(this.measureMaxWidth, this.renderHeight);
        const context = canvas.getContext('2d');

        this.renderTitle(context);
        // 加上两端间距
        const titleWidth = context.measureText(this.totalTitle).width + 30;
        this.renderList(context);
        const listWidth = this.maxRectWidth + 40;
        this.renderFooter(context);
        const footerWidth = context.measureText(this.totalFooter).width + 30;

        this.renderWidth = Math.max(titleWidth, listWidth, footerWidth);
    }

    render() {
        this.record();
        this.measureRender();

        const canvas = createCanvas(this.renderWidth, this.renderHeight);
        const context = canvas.getContext('2d');

        this.renderLayout(context, this.renderWidth, this.renderHeight);
        this.renderBgImg(context, this.renderWidth, this.renderHeight);
        this.renderTitle(context);
        this.renderRect(context);
        this.renderList(context);
        this.renderFooterExtra(context);
        this.renderFooter(context);

        return super.writeFile(canvas, this.fileName);
    }
}
