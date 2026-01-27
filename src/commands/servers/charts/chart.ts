import * as fs from 'fs';
import * as path from 'path';
import * as echarts from 'echarts';
import { Resvg } from '@resvg/resvg-js';
import { IAnalysisData } from '../types/types';
import {
    ANALYSIS_DATA_FILE,
    ANALYSIS_HOURS_DATA_FILE,
    ANALYSIS_HOURS_OUTPUT_FILE,
    ANALYSIS_OUTPUT_FILE,
    OUTPUT_FOLDER,
} from '../types/constants';
import { logger } from '../../../utils/logger';
import { asImageRenderError } from '../../../services/imageRenderErrors';
import { logImageRenderError } from '../../../services/imageRenderLogger';

const readData = () => {
    const fileContent = fs.readFileSync(
        path.join(process.cwd(), OUTPUT_FOLDER, `./${ANALYSIS_DATA_FILE}`),
        'utf-8',
    );

    const typedValues = JSON.parse(fileContent) as IAnalysisData[];

    return typedValues.map((v) => {
        return {
            date: v.date,
            count: v.count,
            c: 0,
        };
    });
};

export const printChartPng = async () => {
    try {
        const width = 800;
        const height = 400;
        // SVG SSR avoids Canvas-backend integration quirks.
        const chart = echarts.init(null as any, null as any, {
            renderer: 'svg',
            ssr: true,
            width,
            height,
        });

        const data = readData();
        chart.setOption({
            backgroundColor: '#fff',
            title: {
                text: '玩家7日在线数峰值统计图',
                textAlign: 'center',
                left: '50%',
            },
            xAxis: {
                name: '日期',
                nameLocation: 'center',
                nameGap: 30,
                nameTextStyle: {
                    fontWeight: 700,
                },
                type: 'category',
                data: data.map((d) => d.date),
            },
            yAxis: {
                name: '玩家数',
                nameGap: 30,
                nameLocation: 'end',
                nameTextStyle: {
                    fontWeight: 700,
                },
                type: 'value',
            },
            series: [
                {
                    data: data.map((d) => d.count),
                    label: {
                        // Avoid duplicated value labels when combined with bar series.
                        show: false,
                    },
                    type: 'line',
                },
                {
                    data: data.map((d) => d.count),
                    label: {
                        show: true,
                        position: 'top',
                    },
                    type: 'bar',
                },
            ],
        });

        // Render -> SVG -> rasterize via resvg for better quality.
        const svg = chart.renderToSVGString();
        chart.dispose();

        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: width },
            background: 'white',
        });
        const buffer = Buffer.from(resvg.render().asPng());

        const outputPath = path.join(
            process.cwd(),
            OUTPUT_FOLDER,
            `./${ANALYSIS_OUTPUT_FILE}`,
        );
        fs.writeFileSync(outputPath, buffer);

        return ANALYSIS_OUTPUT_FILE;
    } catch (error) {
        const wrapped = asImageRenderError(error, {
            code: 'IMAGE_RENDER_FAILED',
            message: 'Failed to render analysis chart',
            context: {
                scene: 'charts:analysis',
                fileName: ANALYSIS_OUTPUT_FILE,
            },
        });
        logImageRenderError(wrapped);
        logger.error('Failed to print chart png', wrapped);
        throw wrapped;
    }
};

const readHoursData = () => {
    const fileContent = fs.readFileSync(
        path.join(
            process.cwd(),
            OUTPUT_FOLDER,
            `./${ANALYSIS_HOURS_DATA_FILE}`,
        ),
        'utf-8',
    );

    const typedValues = JSON.parse(fileContent) as IAnalysisData[];

    return typedValues.map((v) => {
        return {
            date: v.date,
            count: v.count,
            c: 0,
        };
    });
};

export const printHoursChartPng = async () => {
    try {
        const width = 800;
        const height = 400;
        const chart = echarts.init(null as any, null as any, {
            renderer: 'svg',
            ssr: true,
            width,
            height,
        });

        const data = readHoursData();
        chart.setOption({
            backgroundColor: '#fff',
            title: {
                text: '玩家24小时在线数峰值统计图',
                textAlign: 'center',
                left: '50%',
            },
            xAxis: {
                name: '日期',
                nameLocation: 'center',
                nameGap: 30,
                nameTextStyle: {
                    fontWeight: 700,
                },
                type: 'category',
                data: data.map((d) => d.date),
            },
            yAxis: {
                name: '玩家数',
                nameGap: 30,
                nameLocation: 'end',
                nameTextStyle: {
                    fontWeight: 700,
                },
                type: 'value',
            },
            series: [
                {
                    data: data.map((d) => d.count),
                    label: {
                        // Avoid duplicated value labels when combined with bar series.
                        show: false,
                    },
                    type: 'line',
                },
                {
                    data: data.map((d) => d.count),
                    label: {
                        show: true,
                        position: 'top',
                    },
                    type: 'bar',
                },
            ],
        });

        const svg = chart.renderToSVGString();
        chart.dispose();

        const resvg = new Resvg(svg, {
            fitTo: { mode: 'width', value: width },
            background: 'white',
        });
        const buffer = Buffer.from(resvg.render().asPng());

        const outputPath = path.join(
            process.cwd(),
            OUTPUT_FOLDER,
            `./${ANALYSIS_HOURS_OUTPUT_FILE}`,
        );
        fs.writeFileSync(outputPath, buffer);

        return ANALYSIS_HOURS_OUTPUT_FILE;
    } catch (error) {
        const wrapped = asImageRenderError(error, {
            code: 'IMAGE_RENDER_FAILED',
            message: 'Failed to render analysis hours chart',
            context: {
                scene: 'charts:analysis_hours',
                fileName: ANALYSIS_HOURS_OUTPUT_FILE,
            },
        });
        logImageRenderError(wrapped);
        logger.error('Failed to print hours chart png', wrapped);
        throw wrapped;
    }
};
