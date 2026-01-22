# 🎮 一个简单的AI 桌宠项目

一个可爱毒舌的 AI 桌宠（inspired by Neuro），集成 Live2D模型、语音交互、向量记忆系统。使用现代化前后端技术栈，提供流畅的实时对话体验。

<img width="867" height="1137" alt="d3d16fee29634e14e8984d2232188c81" src="https://github.com/user-attachments/assets/7d10e448-8824-43a4-8be7-e772d6dd7747" />

## ✨ 项目特性

- 🤖 **多 AI 模型集成**：Gemini/deepseek LLM + CosyVoice TTS + SenseVoice STT
- 🎨 **Live2D 3D 模型**：支持多个预制角色（Haru/Hiyori/PinkFox），实时表情/动作同步
- 💾 **向量记忆系统**：ChromaDB 长期记忆 + JSON 事实库，AI 能持久化学习用户信息(记忆都带时间戳)
- 🎙️ **实时语音交互**：麦克风输入识别 + 文字转语音输出(长按F2可以用快捷键启用语音输入) 你可以让她闭嘴(AI会自行判定），进入静默模式（AI将不会主动说话)
- 🔄 **WebSocket 双向通信**：前后端实时同步，支持主动发言(和打断操作)
- 🪟 **跨平台桌面应用**：Electron + React，支持 Windows/macOS/Linux
- 📊 **状态机设计**：完整的对话状态管理（Idle/Thinking/Speaking）
- 👀 **视觉感知系统**:输入内容含有“看看”等关键词，可以给AI桌宠传入当前电脑屏幕的截屏照片
## 📋 系统要求

### 后端
- Python 3.8+
- Node.js 16+ （可选，仅运行前端时需要）

### 前端
- Node.js 16+
- npm 或 yarn

## 🚀 快速开始

### 1️⃣ 克隆仓库

```bash
git clone <repository-url>
cd AI-Desktop-Pet
```

### 2️⃣ 后端环境配置

#### 步骤 1：安装 Python 依赖

```bash
cd backend
# 建议创建虚拟环境，请确保python版本为3.13
# python -m venv venv
# source venv/bin/activate (Linux/Mac) 或 venv\Scripts\activate (Windows)

pip install -r requirements.txt
```

#### 步骤 2：配置环境变量

在 `backend/.env` 文件中填入 API 密钥（已提供示例，如果没有请自行创建并复制下面的代码）：

```env
# LLM 主脑 (Gemini 或其他兼容 OpenAI 格式的模型)
LLM_BASE_URL="https://api.n1n.ai/v1"(这是一个中转站，可以自由改用别的支持Openai格式的中转站)
LLM_API_KEY="your-api-key-here"
LLM_MODEL="gemini-3-pro-preview" (选用gemini是基于其多模态，可以传入图片；如果改用别的模型，比如deepseek纯文字模型，那么就不支持视觉传入图片)

# 意图识别 (DeepSeek - 判断是否无聊/打断)(已经废弃)
PROFILE_LLM_KEY="your-deepseek-key"
PROFILE_LLM_BASE="https://api.deepseek.com"

# 语音服务 (SiliconFlow - TTS & STT) 
SILICON_API_KEY="your-siliconflow-key"
SILICON_BASE_URL="https://api.siliconflow.cn/v1"
TTS_MODEL="FunAudioLLM/CosyVoice2-0.5B"
TTS_VOICE="FunAudioLLM/CosyVoice2-0.5B:anna"
STT_MODEL="FunAudioLLM/SenseVoiceSmall"

# 代理 (可选)
PROXY_URL=""
```

#### 步骤 3：运行后端服务

```bash
python main.py
```

后端将在 `ws://localhost:8000/ws` 启动 WebSocket 服务。

### 3️⃣ 前端环境配置
(npm需要先按章node.js)
#### 步骤 1：安装依赖

```bash
cd frontend
npm install
# 或使用 yarn
yarn install
```

#### 步骤 2：开发模式运行

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

#### 步骤 3：构建 Electron 应用

```bash

npm run electron   # 启动 Electron 窗口
```

## 📂 项目结构

```
aigirl/
├── backend/                    # Python 后端服务
│   ├── main.py                # WebSocket 服务入口，状态机核心
│   ├── services.py            # AI 能力封装（LLM、TTS、STT）
│   ├── memory.py              # 向量记忆与存储（ChromaDB + JSON）
│   ├── config.py              # 配置管理（读取 .env）
│   ├── tools.py               # 工具函数（截图等）
│   ├── .env                   # 环境变量配置
│   ├── requirements.txt        # Python 依赖
│   └── memory_db/             # ChromaDB 数据库文件（自动生成）
│
├── frontend/                   # React + Vite + Electron 前端
│   ├── src/
│   │   ├── main.jsx           # 应用入口
│   │   ├── App.jsx            # 根组件
│   │   ├── components/
│   │   │   ├── Chat/          # 聊天组件（输入、消息列表、语音）
│   │   │   └── Live2D/        # Live2D 渲染组件
│   │   ├── pages/
│   │   │   └── MainPage.jsx   # 主页面
│   │   └── hooks/             # 自定义 Hooks（WebSocket、音频队列）
│   ├── public/
│   │   ├── models/            # Live2D 模型文件
│   │   └── libs/              # 第三方库（Cubism4、Live2D Runtime）
│   ├── package.json           # Node.js 依赖
│   ├── vite.config.js         # Vite 配置
│   ├── electron-main.cjs      # Electron 主进程
│   └── index.html             # HTML 模板
│
└── README.md                   # 本文件
```

## 🏗️ 架构设计

### 后端架构（职责分离）

| 层级 | 文件 | 职责 |
|------|------|------|
| 控制层 | `main.py` | WebSocket 路由、状态机、游戏循环 |
| 服务层 | `services.py` | AI API 调用（Gemini、DeepSeek、CosyVoice） |
| 数据层 | `memory.py` | 向量存储、事实管理、检索 |
| 配置层 | `config.py` | 环境变量读取 |

### 前端技术栈

- **框架**：React 18 + Vite 6
- **渲染**：PixiJS 6（WebGL 2D 引擎） + pixi-live2d-display（Live2D 渲染器）
- **桌面**：Electron 28
- **语音**：Web Audio API + Silero VAD（语音活动检测）

## 🔌 API 接口

### WebSocket 通信协议

**服务器地址**：`ws://localhost:8000/ws`

#### 消息格式

所有消息均为 JSON 格式：
```json
{
  "type": "message_type",
  "payload": { /* 具体数据 */ }
}
```

#### 前端 → 后端

| type | 说明 | payload |
|------|------|---------|
| `text_input` | 文本消息 | `{ "text": "你好" }` |
| `audio_input` | 音频输入 | `{ "audio_base64": "..." }` |
| `set_dnd_mode` | 设置勿扰模式 | `{ "enabled": true/false }` |
| `screenshot` | 截图请求 | `{}` |

#### 后端 → 前端

| type | 说明 | payload |
|------|------|---------|
| `ai_thinking` | AI 正在思考 | `{ "status": "thinking" }` |
| `ai_reply` | AI 回复 | `{ "text": "你好呀", "emotion": "happy" }` |
| `ai_speaking` | AI 正在说话 | `{ "audio_base64": "..." }` |
| `ai_emotion` | 表情变化 | `{ "emotion": "angry", "duration": 2000 }` |
| `game_loop` | 主动发言 | `{ "text": "你咋不理我了" }` |

## 🛠️ 开发指南

### 添加新的 Live2D 模型

1. 将模型文件放入 `frontend/public/models/<ModelName>/`
2. 在 `Live2DModel.jsx` 中注册模型
3. 在 UI 中添加模型切换按钮

### 修改 AI 人设

编辑 `backend/main.py` 中 `build_system_prompt()` 方法内的系统 Prompt。

### 扩展记忆功能

- **短期记忆**（对话历史）：在 `main.py` 中修改 `history` 列表管理
- **长期记忆**（向量存储）：编辑 `memory.py` 中的 Embedding 和检索逻辑
- **事实库**（JSON）：直接修改 `user_facts.json` 或通过 API 更新

### 添加新的工具函数

在 `backend/tools.py` 中新增方法，然后在 `main.py` 中调用。

## 📦 依赖说明

### 后端依赖（Python）

| 包名 | 版本 | 用途 |
|------|------|------|
| fastapi | ≥0.104.1 | 异步 Web 框架 |
| uvicorn | ≥0.24.0 | ASGI 服务器 |
| openai | ≥1.3.8| LLM/TTS/STT API 客户端 |
| chromadb | ≥0.4.14 | 向量数据库 |
| python-dotenv | ≥1.0.0 | 环境变量管理 |
| pillow | ≥10.1.0 | 图像处理（截图压缩） |
| pyautogui | ≥0.9.53 | 屏幕截图 |
| tiktoken |≥0.5.2|Token 计算 (用于记忆管理)|
### 前端依赖（Node.js）

详见 `frontend/package.json`，主要包括：
- `react` / `react-dom` - UI 框架
- `vite` - 构建工具
- `electron` - 桌面应用框架
- `pixi.js` - 2D WebGL 渲染
- `pixi-live2d-display` - Live2D 渲染
- `@ricky0123/vad-react` - 语音活动检测

## 🔍 故障排查

### 后端启动失败

```bash
# 检查 Python 版本
python --version  # 需要 3.8+

# 检查依赖安装
pip list | grep fastapi

# 查看详细错误
python -c "from services import AIService"
```

### WebSocket 连接失败

- 确保后端已启动：`python main.py`
- 检查前端 WebSocket 地址配置（通常为 `ws://localhost:8000/ws`）
- 检查防火墙是否开放 8000 端口

### Live2D 模型不显示

- 验证模型文件是否在 `frontend/public/models/` 目录
- 查看浏览器控制台是否有跨域 CORS 错误
- 确保 Vite 静态资源配置正确

### 语音识别无法工作

- 检查麦克风权限（浏览器和操作系统）
- 验证 SiliconFlow API Key 是否正确
- 查看网络连接和代理设置

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！


## 📞 支持

如有问题，请提交 Issue 或联系开发者。
由于作者能力有限，前端部分主要由AI完成，有不足之处请多指教
---

**最后更新**：2026年1月
