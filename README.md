# find-files

获取匹配 Rule 的文件路径

## API

### find

返回查找到的匹配文件路径，否则返回 `空数组`

-- Options Params

| name    | type                                    | required | desc                                        |
| ------- | --------------------------------------- | -------- | ------------------------------------------- |
| src     | string                                  | true     | 检索目录绝对路径                            |
| dest    | string                                  | false    | 目标文件夹路径                              |
| exclude | Array&lt;string&gt;                     | false    | 取消匹配路径                                |
| nomatch | boolean                                 | false    | 是否过滤未匹配到的文件路径                  |
| rules   | Array&lt;{from: string; to: string}&gt; | true     | 匹配规则，支持 glob & extglob & RegExp 规则 |

-- Result

Array<[string, string]> 返回二维数组
第 0 项为`文件绝对路径`，第 1 项 为 `to 匹配到的内容`
