# QA 命令

## 用途

自定义问答

## 环境变量

- QADATA_FILE: 定义问答数据文件路径
- GLM_APIKEY: 智谱 AI API KEY, 用于通常问答没有答案时的智能回答
- GLM_KNOWLEDGE_ID: 智谱 AI 知识库 ID, 用于提供智能回答的知识库 ID

### 数据源格式

- q 为查询 key
- a 为答案

```
[
  {
    "q": "query",
    "a:: "answer"
  }
]
```


## 注册的指令

- qa: 根据定义的 qa 问题数据查询答案, 无参数时列举所有问题列表
- q: qa 的别名
> 示例: `#qa 什么是苹果`
> 示例2: `#q`

- qadefine: 定义 QA 数据, 管理员指令, 需要 2 个参数(格式: `#qadefine Q1 A1`), 最后一个参数会识别任意内容, 包括换行符等

以下内容都是合法的:
```
#qadefine 苹果 这是一个苹果
Q: 苹果
A: 这是一个苹果
```

```
#qadefine 苹果 这 是 一个苹果
Q: 苹果
A: 这 是 一个苹果
```

```
#qadefine 苹果 这 是 一个
苹果

Q: 苹果
A: 这 是 一个苹果
```

- qadelete: 删除指定的 QA 数据, 管理员指令, 需要一个参数(格式: `#qadelete Question1`)
