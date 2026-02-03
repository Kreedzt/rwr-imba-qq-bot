/**
 * TDoll2Canvas.ts - 重构后的版本
 * 
 * 重构要点：
 * 1. 使用组合替代继承
 * 2. 职责分离：将渲染逻辑拆分到专门的渲染器类
 * 3. 依赖注入：通过构造函数注入依赖
 * 
 * 原文件已备份为：tdoll2Canvas.ts.bak.legacy
 */

import { createCanvas, Canvas2DContext } from '../../../services/canvasBackend';
import { ITDollDataItem } from '../types/types';
import { TDOLL_OUTPUT_FILE } from '../types/constants';
import { CANVAS_STYLE } from '../types/constants';
import { BaseCanvas } from '../../../services/baseCanvas';
import {
    TDollDataProvider,
    TDollTitleRenderer,
    TDollImageRenderer,
    TextWidthCalculator,
} from './renderers';

/**
 * TDoll2Canvas - 重构后的类
 * 
 * 使用组合替代继承，将渲染职责分离到专门的渲染器类
 */
export class TDoll2Canvas {
    // 渲染尺寸
    private renderWidth = 0;
    private renderHeight = 0;
    private measureMaxWidth = 0;
    private maxRectWidth = 0;
    private contentLines = 0;
    private renderStartY = 0;

    // 文本内容
    private totalTitle = '';
    private totalFooter = '';


    // 依赖组件
    private dataProvider: TDollDataProvider;
    private textCalculator: TextWidthCalculator;
    private baseCanvas: BaseCanvas;


    // 输入参数
    private fileName: string;
    private query: string;
    private tdolls: ITDollDataItem[];


    constructor(query: string, tdolls: ITDollDataItem[], fileName: string) {
        this.fileName = fileName;
        this.query = query;
        this.tdolls = tdolls;


        // 初始化依赖
        this.dataProvider = new TDollDataProvider();
        this.textCalculator = new TextWidthCalculator();
        this.baseCanvas = new BaseCanvas();
    }

    /**
     * 获取标题段落
     */
    private getTitleSection() {
        return {
            staticSection: '查询 ',
            userSection: `${this.query}`,
            staticSection2: ' 匹配结果',
        };
    }

    /**
     * 测量标题尺寸
     */
    private measureTitle(): void {
        const section = this.getTitleSection();
        const title = section.staticSection + section.userSection + section.staticSection2;
        this.totalTitle = title;

        const titleWidth = this.textCalculator.calcCanvasTextWidth(title, CANVAS_STYLE.FONT_SIZE) + CANVAS_STYLE.TITLE_PADDING;

        if (titleWidth > this.measureMaxWidth) {
            this.measureMaxWidth = titleWidth;
        }
    }

    /**
     * 测量列表尺寸
     */
    private measureList(): void {
        this.tdolls.forEach((tdoll) => {
            this.contentLines += 1;
            const sectionTitle = `No.${tdoll.id} ${tdoll.nameIngame || ''}${tdoll.mod === '1' ? '(mod)' : ''}`;
            const sectionTitleWidth = this.textCalculator.calcCanvasTextWidth(sectionTitle, CANVAS_STYLE.FONT_SIZE);

            if (sectionTitleWidth > this.measureMaxWidth) {
                this.measureMaxWidth = sectionTitleWidth;
            }
        });

        this.renderHeight = CANVAS_STYLE.HEADER_HEIGHT + this.tdolls.length * CANVAS_STYLE.ROW_HEIGHT;
    }

    /**
     * 执行完整测量
     */
    private performMeasurement(): void {
        this.measureTitle();
        this.measureList();

        const canvas = createCanvas(this.measureMaxWidth, this.renderHeight);
        const context = canvas.getContext('2d');

        this.renderTitle(context);
        const titleWidth = context.measureText(this.totalTitle).width + CANVAS_STYLE.TITLE_OFFSET;


        this.renderList(context);
        const listWidth = this.maxRectWidth + CANVAS_STYLE.LIST_OFFSET;


        this.renderFooter(context);
        const footerWidth = context.measureText(this.totalFooter).width + CANVAS_STYLE.FOOTER_OFFSET;


        this.renderWidth = Math.max(titleWidth, listWidth, footerWidth);
    }

    /**
     * 渲染标题
     */
    private renderTitle(context: Canvas2DContext): void {
        const section = this.getTitleSection();

        context.fillStyle = CANVAS_STYLE.TEXT_COLOR;
        context.fillText(section.staticSection, CANVAS_STYLE.PADDING, CANVAS_STYLE.PADDING);
        const staticSectionWidth = context.measureText(section.staticSection).width;


        context.fillStyle = CANVAS_STYLE.HIGHLIGHT_COLOR;
        context.fillText(section.userSection, CANVAS_STYLE.PADDING + staticSectionWidth, CANVAS_STYLE.PADDING);
        const userSectionWidth = context.measureText(section.userSection).width;


        context.fillStyle = CANVAS_STYLE.TEXT_COLOR;
        context.fillText(section.staticSection2, CANVAS_STYLE.PADDING + userSectionWidth + staticSectionWidth, CANVAS_STYLE.PADDING);


        this.renderStartY = CANVAS_STYLE.TITLE_OFFSET;
    }

    /**
     * 渲染列表
     */
    private renderList(context: Canvas2DContext): void {
        this.maxRectWidth = 0;


        const imgMap = this.dataProvider.getImgMap();
        const titleRenderer = new TDollTitleRenderer(this.renderStartY, this.query);
        const imageRenderer = new TDollImageRenderer(this.renderStartY, imgMap);


        this.tdolls.forEach((tdoll) => {
            this.renderStartY += CANVAS_STYLE.SPACING;


            const titleWidth = titleRenderer.render(context, tdoll);
            this.maxRectWidth = Math.max(this.maxRectWidth, titleWidth);


            const imagesWidth = imageRenderer.render(context, tdoll);
            this.maxRectWidth = Math.max(this.maxRectWidth, imagesWidth);
        });

        this.renderStartY = titleRenderer.getCurrentY();
    }
    /**
     * 渲染布局背景
     */
    private renderLayout(context: Canvas2DContext, width: number, height: number): void {
        context.fillStyle = CANVAS_STYLE.BACKGROUND_COLOR;
        context.fillRect(0, 0, width, height);
    }
    /**
     * 渲染背景图片
     */
    private renderBackground(context: Canvas2DContext, width: number, height: number): void {
        this.baseCanvas.renderBgImg(context, width, height);
    }
    /**
     * 渲染页脚
     */
    private renderFooter(context: Canvas2DContext): void {
        this.baseCanvas.record();
        this.baseCanvas.renderFooter(context);
    }
    /**
     * 加载所有图片 (向后兼容方法)
     */
    async loadAllImg(): Promise<void> {
        return this.dataProvider.loadAllImages(this.tdolls);
    }

    /**
     * 执行渲染
     */
    async render(): Promise<string> {
        // 加载图片
        await this.dataProvider.loadAllImages(this.tdolls);

        // 执行测量
        this.performMeasurement();

        // 创建画布
        const canvas = createCanvas(this.renderWidth, this.renderHeight);
        const context = canvas.getContext('2d');

        // 渲染各组件
        this.renderLayout(context, this.renderWidth, this.renderHeight);
        this.renderBackground(context, this.renderWidth, this.renderHeight);
        this.renderTitle(context);
        this.renderList(context);
        this.renderFooter(context);

        // 输出文件
        return this.baseCanvas.writeFile(canvas, this.fileName);
    }
}
