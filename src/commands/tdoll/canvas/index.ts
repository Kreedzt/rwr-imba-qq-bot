/**
 * TDoll2 重构后的 Canvas 渲染模块
 *
 * 重构要点:
 * 1. 职责分离: 将 408 行的单文件拆分为 6 个专注职责的类
 * 2. 组合优于继承: 使用依赖注入替代继承 BaseCanvas
 * 3. 单一职责:
 *    - TDollDataProvider: 图片加载
 *    - TDollTitleRenderer: 标题渲染
 *    - TDollImageRenderer: 图片渲染
 *    - TextWidthCalculator: 文本宽度计算
 *    - TDoll2CanvasRefactored: 组合协调
 * 4. 常量提取: 消除魔法数字，所有配置集中管理
 */

// 渲染器
export { TDollDataProvider } from './renderers/TDollDataProvider';
export { TDollTitleRenderer } from './renderers/TDollTitleRenderer';
export { TDollImageRenderer } from './renderers/TDollImageRenderer';
export { TextWidthCalculator } from './renderers/TextWidthCalculator';

// 重构后的主类
export { TDoll2Canvas } from './tdoll2Canvas';
