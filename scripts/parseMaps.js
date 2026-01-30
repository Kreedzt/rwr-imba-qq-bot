import fs from 'fs';
import path from 'path';

// 解析命令行参数
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {
        inputFile: null,
        outputFile: null,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '-i' || arg === '--input') {
            result.inputFile = args[++i];
        } else if (arg === '-o' || arg === '--output') {
            result.outputFile = args[++i];
        } else if (!result.inputFile) {
            // 第一个位置参数作为输入文件
            result.inputFile = arg;
        } else if (!result.outputFile) {
            // 第二个位置参数作为输出文件
            result.outputFile = arg;
        }
    }

    return result;
}

const args = parseArgs();

// 检查是否需要显示帮助信息
const showHelp =
    process.argv.includes('--help') ||
    process.argv.includes('-h') ||
    process.argv.slice(2).length === 0;

if (showHelp) {
    console.log(`
Usage: node parseMaps.js [options] <input-file> [output-file]

Options:
  -i, --input     输入文件路径 (AngelScript 文件)
  -o, --output    输出文件路径 (JSON 文件)
  -h, --help      显示帮助信息

Arguments:
  input-file      输入的 AngelScript 文件路径 (必需)
  output-file     输出的 JSON 文件路径 (默认: ./maps.json)

Examples:
  node parseMaps.js scripts/stage_configurator_invasion.as
  node parseMaps.js scripts/stage_configurator_invasion.as data/maps.json
  node parseMaps.js -i scripts/stage_configurator_invasion.as -o maps.json
`);
    process.exit(showHelp && process.argv.slice(2).length === 0 ? 1 : 0);
}

// 确定输入输出文件路径
const inputFile = args.inputFile;
const outputFile = args.outputFile || 'maps.json';

// 检查输入文件是否存在
if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf-8');

// 提取所有 setupStage 函数的内容
function parseSetupFunctions(content) {
    const result = {};

    // 匹配所有 setupStage 函数
    const functionRegex =
        /protected\s+Stage@\s+(setupStage\d+|setupFinalStage\d+)\(\)\s*\{([\s\S]*?)\n\t\}\s*\n/g;

    let match;
    while ((match = functionRegex.exec(content)) !== null) {
        const functionName = match[1];
        const functionBody = match[2];

        // 提取 m_name
        const nameMatch = functionBody.match(
            /stage\.m_mapInfo\.m_name\s*=\s*"([^"]+)"/,
        );
        const name = nameMatch ? nameMatch[1] : '';

        // 提取 m_path
        const pathMatch = functionBody.match(
            /stage\.m_mapInfo\.m_path\s*=\s*"([^"]+)"/,
        );
        const mapPath = pathMatch ? pathMatch[1] : '';

        // 从 path 中提取 id（取最后一个 '/' 后的部分）
        const pathParts = mapPath.split('/');
        const id = pathParts[pathParts.length - 1] || '';

        result[functionName] = {
            id,
            name,
        };
    }

    return result;
}

// 解析 setupNormalStages 中的调用顺序
function parseCallOrder(content) {
    const order = [];

    // 匹配 setupNormalStages 函数内容
    const setupNormalStagesMatch = content.match(
        /protected\s+void\s+setupNormalStages\(\)\s*\{([\s\S]*?)\n\t\}/,
    );

    if (setupNormalStagesMatch) {
        const functionContent = setupNormalStagesMatch[1];

        // 提取所有 addStage 调用
        const addStageRegex =
            /addStage\((setupStage\d+|setupFinalStage\d+)\(\)\)/g;

        let match;
        while ((match = addStageRegex.exec(functionContent)) !== null) {
            order.push(match[1]);
        }
    }

    return order;
}

// 主程序
const functions = parseSetupFunctions(content);
const order = parseCallOrder(content);

// 构建最终输出
const output = [];
for (const funcName of order) {
    if (functions[funcName]) {
        output.push(functions[funcName]);
    }
}

// 写入文件
fs.writeFileSync(outputFile, JSON.stringify(output, null, 4));

console.log(
    `Successfully parsed ${output.length} maps and saved to ${outputFile}`,
);
