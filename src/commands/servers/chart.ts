import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from 'canvas';
import * as echarts from 'echarts';
import { IAnalysisData } from './types';
import {
    ANALYSIS_DATA_FILE, ANALYSIS_HOURS_DATA_FILE, ANALYSIS_HOURS_OUTPUT_FILE,
    ANALYSIS_OUTPUT_FILE,
    OUTPUT_FOLDER,
} from './constants';

const readData = () => {
    const fileContent = fs.readFileSync(
        path.join(process.cwd(), OUTPUT_FOLDER, `./${ANALYSIS_DATA_FILE}`),
        'utf-8'
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
    // echarts:
    const canvas = createCanvas(800, 400);
    const chart = echarts.init(canvas as any);
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
                    show: true,
                },
                type: 'line',
            },
        ],
    });

    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 0,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(
        process.cwd(),
        OUTPUT_FOLDER,
        `./${ANALYSIS_OUTPUT_FILE}`
    );
    fs.writeFileSync(outputPath, buffer);

    return ANALYSIS_OUTPUT_FILE;
};

const readHoursData = () => {
    const fileContent = fs.readFileSync(
        path.join(process.cwd(), OUTPUT_FOLDER, `./${ANALYSIS_HOURS_DATA_FILE}`),
        'utf-8'
    );

    const typedValues = JSON.parse(fileContent) as IAnalysisData[];

    return typedValues.map((v) => {
        return {
            date: v.date,
            count: v.count,
            c: 0,
        };
    });
}

export const printHoursChartPng = async () => {
    // echarts:
    const canvas = createCanvas(800, 400);
    const chart = echarts.init(canvas as any);
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
                    show: true,
                },
                type: 'line',
                smooth: true
            },
        ],
    });

    const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 0,
        filters: canvas.PNG_FILTER_NONE,
    });

    const outputPath = path.join(
        process.cwd(),
        OUTPUT_FOLDER,
        `./${ANALYSIS_HOURS_OUTPUT_FILE}`
    );
    fs.writeFileSync(outputPath, buffer);

    return ANALYSIS_HOURS_OUTPUT_FILE;
};
