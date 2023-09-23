import * as vega from 'vega';
import * as fs from 'fs';
import * as gm from 'gm';
import { Spec } from 'vega';
import * as path from 'path';
import { cloneDeep } from 'lodash';
import { IAnalysisData } from './types';
import { logger } from '../../logger';
import {
    ANALYSIS_DATA_FILE,
    ANALYSIS_OUTPUT_FILE,
    OUTPUT_FOLDER,
} from './constants';

const spec = {
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    description: 'A basic line chart example.',
    width: 500,
    height: 200,
    padding: 5,

    signals: [
        {
            name: 'interpolate',
            value: 'linear',
            bind: {
                input: 'select',
                options: [
                    'basis',
                    'cardinal',
                    'catmull-rom',
                    'linear',
                    'monotone',
                    'natural',
                    'step',
                    'step-after',
                    'step-before',
                ],
            },
        },
    ],

    data: [
        {
            name: 'table',
            values: [
                { date: '9/9', count: 28, c: 0 },
                { date: '9/10', count: 43, c: 0 },
                { date: '9/11', count: 81, c: 0 },
                { date: '9/12', count: 19, c: 0 },
                { date: '9/13', count: 52, c: 0 },
                { date: '9/14', count: 24, c: 0 },
                { date: '9/15', count: 87, c: 0 },
                { date: '9/16', count: 17, c: 0 },
            ],
        },
    ],

    scales: [
        {
            name: 'x',
            type: 'point',
            range: 'width',
            domain: { data: 'table', field: 'date' },
        },
        {
            name: 'y',
            type: 'linear',
            range: 'height',
            nice: true,
            zero: true,
            domain: { data: 'table', field: 'count' },
        },
        {
            name: 'color',
            type: 'ordinal',
            range: 'category',
            domain: { data: 'table', field: 'c' },
        },
        {
            name: 'align',
            type: 'ordinal',
            domain: ['left', 'right', 'top', 'bottom'],
            range: ['right', 'left', 'center', 'center'],
        },
        {
            name: 'base',
            type: 'ordinal',
            domain: ['left', 'right', 'top', 'bottom'],
            range: ['middle', 'middle', 'bottom', 'top'],
        },
        {
            name: 'dx',
            type: 'ordinal',
            domain: ['left', 'right', 'top', 'bottom'],
            range: [-7, 6, 0, 0],
        },
        {
            name: 'dy',
            type: 'ordinal',
            domain: ['left', 'right', 'top', 'bottom'],
            range: [1, 1, -5, 6],
        },
    ],

    axes: [
        { orient: 'bottom', scale: 'x', title: '日期' },
        { orient: 'left', scale: 'y', title: '玩家数' },
    ],

    marks: [
        {
            type: 'group',
            from: {
                facet: {
                    name: 'series',
                    data: 'table',
                    groupby: 'c',
                },
            },
            marks: [
                {
                    type: 'line',
                    from: { data: 'series' },
                    encode: {
                        enter: {
                            x: { scale: 'x', field: 'date' },
                            y: { scale: 'y', field: 'count' },
                            stroke: { scale: 'color', field: 'c' },
                            strokeWidth: { value: 2 },
                        },
                        update: {
                            interpolate: { signal: 'interpolate' },
                            strokeOpacity: { value: 1 },
                        },
                        hover: {
                            strokeOpacity: { value: 0.5 },
                        },
                    },
                },
            ],
        },
    ],
};

const igm = gm.subClass({
    imageMagick: '7+',
});

const transformSvg2Png = async (svg: string) => {
    return new Promise((resolve, reject) => {
        igm(Buffer.from(svg))
            .density(1000, 1000)
            .resize(1000, 1000)
            .background('#fff')
            .write(
                path.join(
                    process.cwd(),
                    OUTPUT_FOLDER,
                    `./${ANALYSIS_OUTPUT_FILE}`
                ),
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(ANALYSIS_OUTPUT_FILE);
                    }
                }
            );
    });
};

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
    const newSpec = cloneDeep(spec);
    newSpec.data[0].values = readData();
    const view = new vega.View(vega.parse(newSpec as Spec), {
        renderer: 'none',
    });
    const svg = await view.toSVG();

    await transformSvg2Png(svg);

    return ANALYSIS_OUTPUT_FILE;
};
