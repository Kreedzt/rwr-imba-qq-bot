# Tdoll 命令

## 用途

查询少女前线战术人形数据

## 环境变量

- TDOLL_DATA_FILE: 定义人形数据文件位置

### 数据源获取方式

1. 进入 http://www.gfwiki.org/w/%E6%88%98%E6%9C%AF%E4%BA%BA%E5%BD%A2%E5%9B%BE%E9%89%B4 网站
2. 打开控制台, 执行以下 js 代码获取数据
```js
window.DollsData
```
3. 将变量值 DollsData 保存为 json, 使用环境变量 `TDOLL_DATA_FILE` 指定此文件即可

> 假设保存的文件为 tdoll_data.json, .env 环境变量文件中编写内容为 `TDOLL_DATA_FILE=tdoll_data.json` 即可

## 注册的指令

- tdoll: 根据枪名查询数据
> 示例: tdoll M4A1
- td: tdoll 的别名

