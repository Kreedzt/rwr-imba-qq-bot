# Website 命令

## 用途

查询已定义的网站数据

## 环境变量

- WEBSITE_DATA_FILE: 定义网站数据文件位置

文件数据格式: 
```typescript
export interface IWebsiteItem {
    name: string;
    website: string;
}
```

示例:
```json
[
    {
        "name": "Bing",
        "website": "https://www.bing.com"
    }
]
```

## 注册的指令

- website: 返回所有定义的网站数据

