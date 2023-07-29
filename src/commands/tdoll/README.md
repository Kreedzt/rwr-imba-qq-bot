# Tdoll 命令

## 用途

查询少女前线战术人形数据

## 环境变量

- TDOLLDATA_FILE: 定义人形数据文件位置

### 数据源获取方式

1. 进入 http://www.gfwiki.org/w/%E6%88%98%E6%9C%AF%E4%BA%BA%E5%BD%A2%E5%9B%BE%E9%89%B4 网站
2. 打开控制台, 执行以下 js 代码:
```js
const tableHeaders = [];
[...document.querySelectorAll('#Tdolltable thead tr th')].forEach((trDOM, index) => {
  console.log('trDOM');
  console.dir(trDOM.innerText);
  tableHeaders.push(trDOM.innerText.replace('\n', '').replaceAll('\t', ''));
});

console.log('tableHeaders', tableHeaders);

const tdollList = [...document.querySelectorAll('#Tdolltable .tdollqueryline')].map(trDOM => {
  
  const tdollItem = {};
  [...trDOM.children].forEach((tdDOM, index) => {
    tdollItem[tableHeaders[index]] = tdDOM.innerText.replaceAll('\n', '').replaceAll('\t', '');
    if (tableHeaders[index] === '枪名') {
        const targetLink = tdDOM.querySelector('a').href;
        tdollItem['link'] = targetLink;
    }
  });

  return tdollItem;
});

console.log('tdollList', tdollList);
```
3. 将变量值 tdollList 保存为 json, 使用环境变量 `TDOLLDATA_FILE` 指定此文件即可

> 假设保存的文件为 tdoll_data.json, .env 环境变量文件中编写内容为 `TDOLLDATA_FILE=tdoll_data.json` 即可

## 注册的指令

- tdoll: 根据枪名查询数据
> 示例: tdoll M4A1
- td: tdoll 的别名

