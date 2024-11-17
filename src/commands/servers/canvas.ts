import { Canvas, createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import {
    calcCanvasTextWidth,
    getCountColor,
    getMapShortName,
    getMapTextInCanvas,
    getPlayersInServer,
    getServerInfoDisplaySectionText,
    getServersHeaderDisplaySectionText,
    getUserMatchedServerDisplaySectionText,
    getWhereisFooterSectionText,
    getWhereisHeaderSectionText,
} from './utils';
import {
    IMapDataItem,
    IUserMatchedServerItem,
    OnlineServerItem,
} from './types';
import { GlobalEnv } from '../../types';
import { CanvasImgService } from './canvasImg.service';
import { logger } from '../../utils/logger';

const OUTPUT_FOLDER = 'out';

const getFooterText = (cost: number, endTime: dayjs.Dayjs) => {
    return (
        'RWR QQ Bot' +
        `(cost=${cost}ms, render time=${endTime.format('YYYY-MM-DD HH:mm:ss')})`
    );
};

const getCanvasOutput = (canvas: Canvas, outPath: string) => {
    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(process.cwd(), OUTPUT_FOLDER, `./${outPath}`);

    fs.writeFileSync(outputPath, buffer);

    return outputPath;
};

const addBgImg = (
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D
) => {
    const path = (process.env as unknown as GlobalEnv).OUTPUT_BG_IMG;
    if (!path) {
        return;
    }
    const img = CanvasImgService.getInstance().getImg(path);
    if (!img) {
        return;
    }
    const imgWidth = img.width;
    const imgHeight = img.height;

    const widthRatio = width / imgWidth;
    const heightRatio = height / imgHeight;
    const scale = Math.min(widthRatio, heightRatio);

    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    // 添加半透明蒙层
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // 半透明黑色
    ctx.fillRect(0, 0, width, height); // 绘制蒙层
};

/**
 * Print servers output png
 * @param serverList server list
 * @param fileName output file name
 */
export const printServerListPng = (
    serverList: OnlineServerItem[],
    fileName: string
) => {
    const fnStartTime = dayjs();

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const titleData = getServersHeaderDisplaySectionText(serverList);
    const totalTitle =
        titleData.serversTotalSection +
        titleData.playersTotalStaticSection +
        titleData.playersCountSection;

    const titleWidth = calcCanvasTextWidth(totalTitle, 20) + 20;

    let maxLengthStr = '';
    serverList.forEach((s) => {
        const sectionData = getServerInfoDisplaySectionText(s);
        const outputText =
            sectionData.serverSection + sectionData.playersSection;
        if (outputText.length > maxLengthStr.length) {
            maxLengthStr = outputText;
        }
    });

    const contentOutputWidth = calcCanvasTextWidth(maxLengthStr, 14) + 20;

    const width = Math.max(titleWidth, contentOutputWidth);
    const height = 120 + serverList.length * 40;

    const canvas = createCanvas(width, height);

    const context = canvas.getContext('2d');

    /**
     * Layout
     */
    context.fillStyle = '#451a03';
    context.fillRect(0, 0, width, height);

    /**
     * Background image, need draw first
     */
    addBgImg(width, height, context);

    /**
     * Header
     */
    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    context.fillStyle = '#fff';
    context.fillText(
        titleData.serversTotalSection + titleData.playersTotalStaticSection,
        10,
        10
    );
    const titleStaticSectionWidth = context.measureText(
        titleData.serversTotalSection + titleData.playersTotalStaticSection
    ).width;
    // count
    const allServersCapacity = serverList.reduce(
        (acc, cur) => acc + cur.max_players,
        0
    );
    const allPlayersCount = serverList.reduce(
        (acc, cur) => acc + cur.current_players,
        0
    );
    context.fillStyle = getCountColor(allPlayersCount, allServersCapacity);
    context.fillText(
        titleData.playersCountSection,
        10 + titleStaticSectionWidth,
        10
    );

    /**
     * Content
     */
    let nextStartY = 10 + 40 + 10;

    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    /**
     * Border start Y
     */
    const rectStartY = nextStartY + 10;

    let maxRectWidth = 0;
    serverList.forEach((s) => {
        /**
         * Render server info text
         */
        context.fillStyle = '#fff';
        const outputSectionText = getServerInfoDisplaySectionText(s);
        // all text, update maxRectWidth
        const allText =
            outputSectionText.serverSection +
            outputSectionText.playersSection +
            outputSectionText.mapSection;
        const allTextWidth = context.measureText(allText).width;
        if (allTextWidth > maxRectWidth) {
            maxRectWidth = allTextWidth;
        }

        // server section
        context.fillText(outputSectionText.serverSection, 20, 10 + nextStartY);
        const serverSectionWidth = context.measureText(
            outputSectionText.serverSection
        ).width;

        // count section
        context.fillStyle = getCountColor(s.current_players, s.max_players);
        context.fillText(
            outputSectionText.playersSection,
            20 + serverSectionWidth,
            10 + nextStartY
        );
        const playersSectionWidth = context.measureText(
            outputSectionText.playersSection
        ).width;

        // map section
        context.fillStyle = '#fff';
        context.fillText(
            outputSectionText.mapSection,
            20 + serverSectionWidth + playersSectionWidth,
            10 + nextStartY
        );

        nextStartY += 40;
    });

    /**
     * Render rect
     */
    const maxTextInfo = context.measureText(maxLengthStr);
    const maxTextWidth = maxTextInfo.width;
    context.strokeStyle = '#f48225';
    context.rect(10, rectStartY, maxRectWidth + 20, serverList.length * 40);
    context.stroke();

    /**
     * Footer
     */
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    const fnEndTime = dayjs();

    const calcCost = fnEndTime.diff(fnStartTime);
    const footerText = getFooterText(calcCost, fnEndTime);
    context.fillText(footerText, 10, nextStartY + 20);

    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(process.cwd(), OUTPUT_FOLDER, `./${fileName}`);

    fs.writeFileSync(outputPath, buffer);

    return outputPath;
};

/**
 * Print players output png
 * @param serverList server list
 * @param fileName output file name
 */
export const printPlayersPng = (
    serverList: OnlineServerItem[],
    fileName: string
): string => {
    const fnStartTime = dayjs();

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const titleData = getServersHeaderDisplaySectionText(serverList);
    const totalTitle =
        titleData.serversTotalSection +
        titleData.playersTotalStaticSection +
        titleData.playersCountSection;

    const titleWidth = calcCanvasTextWidth(totalTitle, 20) + 20;

    // Server line + Player line
    let contentLines = 0;
    let maxLengthStr = '';
    serverList.forEach((s) => {
        contentLines += 1;
        // Servers max width
        const sectionData = getServerInfoDisplaySectionText(s);
        const outputText =
            sectionData.serverSection + sectionData.playersSection;
        if (outputText.length > maxLengthStr.length) {
            maxLengthStr = outputText;
        }

        // Players max width
        getPlayersInServer(s).forEach((p) => {
            contentLines += 1;
            if (p.length > maxLengthStr.length) {
                maxLengthStr = p;
            }
        });
    });

    const contentOutputWidth = calcCanvasTextWidth(maxLengthStr, 14) + 20;

    const width = Math.max(titleWidth, contentOutputWidth);
    const height = 120 + contentLines * 40;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    /**
     * Layout
     */
    context.fillStyle = '#451a03';
    context.fillRect(0, 0, width, height);

    /**
     * Background image, need draw first
     */
    addBgImg(width, height, context);

    /**
     * Header
     */
    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    context.fillStyle = '#fff';
    context.fillText(
        titleData.serversTotalSection + titleData.playersTotalStaticSection,
        10,
        10
    );

    const titleStaticSectionWidth = context.measureText(
        titleData.serversTotalSection + titleData.playersTotalStaticSection
    ).width;
    // count
    const allServersCapacity = serverList.reduce(
        (acc, cur) => acc + cur.max_players,
        0
    );
    const allPlayersCount = serverList.reduce(
        (acc, cur) => acc + cur.current_players,
        0
    );
    context.fillStyle = getCountColor(allPlayersCount, allServersCapacity);
    context.fillText(
        titleData.playersCountSection,
        10 + titleStaticSectionWidth,
        10
    );

    /**
     * Content
     */
    let nextStartY = 10 + 40 + 10;

    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    /**
     * Border start Y
     */
    const rectStartY = nextStartY + 10;

    let maxRectWidth = 0;
    serverList.forEach((s) => {
        context.font = 'bold 20pt Consolas';
        /**
         * Render server info text
         */
        context.fillStyle = '#fff';
        const outputSectionText = getServerInfoDisplaySectionText(s);
        // all text, update maxRectWidth
        const allText =
            outputSectionText.serverSection +
            outputSectionText.playersSection +
            outputSectionText.mapSection;
        const allTextWidth = context.measureText(allText).width;
        if (allTextWidth > maxRectWidth) {
            maxRectWidth = allTextWidth;
        }

        // server section
        context.fillText(outputSectionText.serverSection, 20, 10 + nextStartY);
        const serverSectionWidth = context.measureText(
            outputSectionText.serverSection
        ).width;

        // count section
        context.fillStyle = getCountColor(s.current_players, s.max_players);
        context.fillText(
            outputSectionText.playersSection,
            20 + serverSectionWidth,
            10 + nextStartY
        );
        const playersSectionWidth = context.measureText(
            outputSectionText.playersSection
        ).width;

        // map section
        context.fillStyle = '#fff';
        context.fillText(
            outputSectionText.mapSection,
            20 + serverSectionWidth + playersSectionWidth,
            10 + nextStartY
        );

        // render players
        context.font = 'bold 16pt Consolas';
        context.fillStyle = '#a5f3fc';
        getPlayersInServer(s).forEach((p) => {
            context.fillText(p, 20, 10 + nextStartY + 40);
            nextStartY += 40;
        });

        nextStartY += 40;
    });

    /**
     * Render rect
     */
    const maxTextInfo = context.measureText(maxLengthStr);
    const maxTextWidth = maxTextInfo.width;
    context.strokeStyle = '#f48225';
    context.rect(10, rectStartY, maxRectWidth + 20, contentLines * 40);
    context.stroke();

    /**
     * Footer
     */
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    const fnEndTime = dayjs();

    const calcCost = fnEndTime.diff(fnStartTime);
    const footerText = getFooterText(calcCost, fnEndTime);
    context.fillText(footerText, 10, nextStartY + 20);

    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(process.cwd(), OUTPUT_FOLDER, `./${fileName}`);

    fs.writeFileSync(outputPath, buffer);

    return outputPath;
};

/**
 * Print whereis output png
 * @param matchList user in server list(matched)
 * @param query query user name
 * @param count total matched count
 * @param fileName output file name
 */
export const printUserInServerListPng = (
    matchList: IUserMatchedServerItem[],
    query: string,
    count: number,
    fileName: string
): string => {
    const fnStartTime = dayjs();

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const titleData = getWhereisHeaderSectionText(query);
    const totalTitle =
        titleData.staticSection +
        titleData.userSection +
        titleData.staticSection2;

    const titleWidth = 11 * 28 + (totalTitle.length - 11) * 14;

    let maxLengthStr = '';
    matchList.forEach((m) => {
        const section = getUserMatchedServerDisplaySectionText(m);
        const outputText =
            section.userSection +
            section.staticSection +
            section.serverCount +
            section.mapSection;
        if (outputText.length > maxLengthStr.length) {
            maxLengthStr = outputText;
        }
    });

    const contentOutputWidth = calcCanvasTextWidth(maxLengthStr, 14) + 20;

    const width = Math.max(titleWidth, contentOutputWidth);
    /**
     * 40: whereis footer height
     */
    const height = 120 + 40 + matchList.length * 40;

    const canvas = createCanvas(width, height);

    const context = canvas.getContext('2d');

    /**
     * Background image, need draw first
     */
    addBgImg(width, height, context);

    /**
     * Layout
     */
    context.fillStyle = '#451a03';
    context.fillRect(0, 0, width, height);

    /**
     * Header
     */
    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';

    // static section
    context.fillStyle = '#fff';
    context.fillText(titleData.staticSection, 10, 10);
    const titleStaticSectionWidth = context.measureText(
        titleData.staticSection
    ).width;

    // user section
    context.fillStyle = '#22d3ee';
    context.fillText(titleData.userSection, 10 + titleStaticSectionWidth, 10);
    const titleUserSectionWidth = context.measureText(
        titleData.userSection
    ).width;

    // static section 2
    context.fillStyle = '#fff';
    context.fillText(
        titleData.staticSection2,
        10 + titleStaticSectionWidth + titleUserSectionWidth,
        10
    );

    /**
     * Content
     */
    let nextStartY = 10 + 40 + 10;

    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    /**
     * Border start Y
     */
    const rectStartY = nextStartY + 10;

    let maxRectWidth = 0;
    matchList.forEach((m) => {
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
        if (allTextWidth > maxRectWidth) {
            maxRectWidth = allTextWidth;
        }

        // user section
        context.fillStyle = '#22d3ee';
        context.fillText(outputSectionText.userSection, 20, 10 + nextStartY);
        const userSectionWidth = context.measureText(
            outputSectionText.userSection
        ).width;

        // user + server static section(xxx is playing server1)
        context.fillStyle = '#fff';
        context.fillText(
            outputSectionText.staticSection,
            20 + userSectionWidth,
            10 + nextStartY
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
            10 + nextStartY
        );
        const serverCountWidth = context.measureText(
            outputSectionText.serverCount
        ).width;

        // server map section
        context.fillStyle = '#fff';
        context.fillText(
            outputSectionText.mapSection,
            20 + userSectionWidth + staticSectionWidth + serverCountWidth,
            10 + nextStartY
        );

        nextStartY += 40;
    });

    /**
     * Render rect
     */
    const maxTextInfo = context.measureText(maxLengthStr);
    const maxTextWidth = maxTextInfo.width;
    context.strokeStyle = '#f48225';
    context.rect(10, rectStartY, maxRectWidth + 20, matchList.length * 40);
    context.stroke();

    const footerData = getWhereisFooterSectionText(count);
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    context.fillText(footerData, 10, nextStartY + 20);
    nextStartY += 40;

    /**
     * Footer
     */
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    const fnEndTime = dayjs();

    const calcCost = fnEndTime.diff(fnStartTime);
    const footerText = getFooterText(calcCost, fnEndTime);
    context.fillText(footerText, 10, nextStartY + 20);

    return getCanvasOutput(canvas, fileName);
};

/**
 * output map png spacing
 */
const UNDER_MAP_SERVER_SPACING = 20;

export const printMapPng = (
    serverList: OnlineServerItem[],
    mapData: IMapDataItem[],
    fileName: string
): string => {
    const fnStartTime = dayjs();

    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    const titleData = `共计 ${mapData.length} 项地图数据`;

    const titleWidth = calcCanvasTextWidth(titleData, 20) + 20;

    let maxLengthStr = '';
    serverList.forEach((s) => {
        const sectionData = getServerInfoDisplaySectionText(s);
        const outputText =
            sectionData.serverSection +
            sectionData.playersSection +
            new Array(8).fill('');
        if (outputText.length > maxLengthStr.length) {
            maxLengthStr = outputText;
        }
    });

    mapData.forEach((m) => {
        const sectionData = getMapTextInCanvas(m);

        const outputText = sectionData;

        if (outputText.length > maxLengthStr.length) {
            maxLengthStr = outputText;
        }
    });

    const width = Math.max(
        titleWidth,
        calcCanvasTextWidth(maxLengthStr, 14) + 20
    );
    const height = 120 + serverList.length * 40 + mapData.length * 40;

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    /**
     * Layout
     */
    context.fillStyle = '#451a03';
    context.fillRect(0, 0, width, height);

    /**
     * Background image, need draw first
     */
    addBgImg(width, height, context);

    /**
     * Header
     */
    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    context.fillStyle = '#fff';
    context.fillText(titleData, 10, 10);

    /**
     * Content
     */
    let nextStartY = 10 + 40 + 10;

    context.font = 'bold 20pt Consolas';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    context.fillStyle = '#3574d4';

    /**
     * Border start Y
     */
    const rectStartY = nextStartY + 10;

    let maxRectWidth = 0;
    mapData.forEach((m) => {
        context.fillStyle = '#bfdbfe';
        const mapText = getMapTextInCanvas(m);
        // map section
        context.fillText(mapText, 20, 10 + nextStartY);
        nextStartY += 40;

        const mapSectionWidth = context.measureText(mapText).width;
        if (mapSectionWidth > maxRectWidth) {
            maxRectWidth = mapSectionWidth;
        }

        serverList
            .filter((s) => {
                return getMapShortName(s.map_id) === m.id;
            })
            .forEach((s) => {
                // server section
                const serverText = getServerInfoDisplaySectionText(s);
                context.fillStyle = '#fff';
                context.fillText(
                    serverText.serverSection,
                    20 + UNDER_MAP_SERVER_SPACING,
                    10 + nextStartY
                );
                const serverSectionWidth = context.measureText(
                    serverText.serverSection
                ).width;

                // count section
                context.fillStyle = getCountColor(
                    s.current_players,
                    s.max_players
                );
                context.fillText(
                    serverText.playersSection,
                    20 + UNDER_MAP_SERVER_SPACING + serverSectionWidth,
                    10 + nextStartY
                );

                // count section
                context.fillStyle = getCountColor(
                    s.current_players,
                    s.max_players
                );
                context.fillText(
                    serverText.playersSection,
                    20 + UNDER_MAP_SERVER_SPACING + serverSectionWidth,
                    10 + nextStartY
                );

                nextStartY += 40;

                const allText =
                    serverText.serverSection + serverText.playersSection;
                const allTextWidth =
                    context.measureText(allText).width +
                    UNDER_MAP_SERVER_SPACING;

                if (allTextWidth > maxRectWidth) {
                    maxRectWidth = allTextWidth;
                }
            });
    });

    /**
     * Render rect
     */
    const maxTextInfo = context.measureText(maxLengthStr);
    const maxTextWidth = maxTextInfo.width;
    context.strokeStyle = '#f48225';
    context.rect(
        10,
        rectStartY,
        maxRectWidth + 20,
        mapData.length * 40 + serverList.length * 40
    );
    context.stroke();

    /**
     * Footer
     */
    context.fillStyle = '#fff';
    context.font = 'bold 10pt Consolas';
    context.textAlign = 'left';
    const fnEndTime = dayjs();

    const calcCost = fnEndTime.diff(fnStartTime);
    const footerText = getFooterText(calcCost, fnEndTime);
    context.fillText(footerText, 10, nextStartY + 20);

    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 3,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(process.cwd(), OUTPUT_FOLDER, `./${fileName}`);

    fs.writeFileSync(outputPath, buffer);

    return outputPath;
};
