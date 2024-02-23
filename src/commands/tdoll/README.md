# Tdoll 相关命令

## 用途

查询少女前线战术人形数据

## tdoll

### 环境变量

-   TDOLL_DATA_FILE: 定义人形数据文件位置
-   IMGPROXY_URL: imgproxy 图片代理地址, 用于图片裁剪宽高及缩放

### 数据源获取方式

1. 进入 http://www.gfwiki.org/w/%E6%88%98%E6%9C%AF%E4%BA%BA%E5%BD%A2%E5%9B%BE%E9%89%B4 网站
2. 打开控制台, 执行以下 js 代码获取数据

```js
window.DollsData;
```

3. 将变量值 DollsData 保存为 json, 使用环境变量 `TDOLL_DATA_FILE` 指定此文件即可

> 假设保存的文件为 tdoll_data.json, .env 环境变量文件中编写内容为 `TDOLL_DATA_FILE=tdoll_data.json` 即可

### 注册的指令

-   tdoll: 根据枪名查询数据
    > 示例: tdoll M4A1
-   td: tdoll 的别名

## tdollskin

### 环境变量

-   TDOLLSKIN_DATA_FILE: 定义人形皮肤数据文件位置

### 数据源获取方式

1. 根据上述 DollsData, 轮询查询详情页获取
2. 将所有数据值 保存为 json, 使用环境变量 `TDOLLSKIN_DATA_FILE` 指定此文件即可
    > json key 为人形 id, value 为人形皮肤列表, 格式如下:

```json
{
    "3": [
        {
            "index": 0,
            "title": "默认皮肤",
            "value": 1
        }
    ]
}
```

### 注册的指令

-   tdollskin: 根据枪名查询皮肤数据
    > 示例: tdollskin 3
-   ts: tdollskin 的别名
