为了保证可扩展性（方便以后加功能）和可维护性（防止变成屎山），请严格遵守以下职责划分。目前我们保持扁平结构（不搞深层文件夹），但逻辑必须分清。

```text
backend/
├── .env                  # [配置层] 存密钥 (API Key, Base URL)。绝不要上传到 Github。
├── config.py             # [配置层] 读取 .env，供代码调用。所有硬编码参数(如模型名)都在这。
├── main.py               # [控制层] 程序的入口 (Controller)。
│                         #   - 负责 WebSocket 连接与路由
│                         #   - 负责 状态机 (FSM) 切换 (Idle/Thinking/Speaking)
│                         #   - 负责 游戏循环 (Game Loop) 触发主动发言
│                         #   - ❌ 不写具体的 AI 调用代码
│                         #   - ❌ 不写具体的 数据库 操作代码
├── services.py           # [服务层] AI 能力封装 (Service)。
│                         #   - 负责 Gemini/DeepSeek/CosyVoice 的 API 调用
│                         #   - 负责 这里是唯一能联网发请求的地方
│                         #   - ❌ 不保存任何状态变量
├── memory.py             # [数据层] 记忆与存储 (Model/DAO)。
│                         #   - 负责 ChromaDB (向量) 和 JSON (事实) 的读写
│                         #   - 负责 为主脑提供 context 字符串
│                         #   - ❌ 不做决策，只执行增删改查
└── neuro_memory_db/      # [存储] ChromaDB 自动生成的文件夹 (不要动)
└── user_facts.json       # [存储] 用户事实的 JSON 文件 (自动生成)
```