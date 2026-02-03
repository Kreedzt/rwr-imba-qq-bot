import { createCanvas, Canvas2DContext } from '../../../services/canvasBackend';
import { OnlineServerItem } from '../types/types';
import {
    getServersHeaderDisplaySectionText,
    calcCanvasTextWidth,
    getServerInfoDisplaySectionText,
    getCountColor,
} from '../utils/utils';
import {
    BaseCanvasRefactored,
    DependencyFactory,
} from '../../../services/canvas/base';

export class ServersCanvas extends BaseCanvasRefactored {
    // constructor params
    serverList: OnlineServerItem[];
    fileName: string;

    // render params data
    measureMaxWidth = 0;
    renderWidth = 0;
    renderHeight = 0;

    titleData: ReturnType<typeof getServersHeaderDisplaySectionText> = {
        serversTotalSection: '',
        playersTotalStaticSection: '',
        playersCountSection: '',
    };
    totalTitle = '';

    maxLengthStr = '';
    renderStartY = 0;
    maxRectWidth = 0;
    contentLines = 0;

    totalFooter = '';

    constructor(serverList: OnlineServerItem[], fileName: string) {
        // 使用依赖工厂创建依赖
        const deps = DependencyFactory.create({
            outputFolder: 'out',
            footerConfig: { color: '#fff' },
        });
        super(deps);

        this.serverList = serverList;
        this.fileName = fileName;
    }

    measureTitle() {
        const titleData = getServersHeaderDisplaySectionText(this.serverList);
        this.titleData = titleData;

        this.totalTitle =
            titleData.serversTotalSection +
            titleData.playersTotalStaticSection +
            titleData.playersCountSection;

        const titleWidth = calcCanvasTextWidth(this.totalTitle, 20) + 20;
        // ... 其他测量逻辑
    }

    print() {
        this.record(); // 使用继承的方法记录开始时间

        // 创建 Canvas
        const canvas = createCanvas(this.renderWidth, this.renderHeight);
        const ctx = canvas.getContext('2d');

        // 渲染背景
        this.renderBgImg({
            context: ctx,
            width: this.renderWidth,
            height: this.renderHeight,
        });

        // 渲染内容
        // ... 具体的渲染逻辑

        // 渲染页脚
        this.setRenderStartY(this.renderStartY);
        this.renderFooter(ctx);

        // 写入文件
        return this.writeFile(canvas, this.fileName);
    }
}
