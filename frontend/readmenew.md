# 前端说明文档 (Electron + WebSocket 重构版)

## 技术选型说明

本项目采用现代化前端技术栈配合 Electron 容器，构建高性能的桌面伴侣应用：

- **React (v18)** - 用于构建用户界面
- **Vite (v6)** - 构建工具，提供秒级热更新
- **Electron** - **(新增)** 用于将 Web 应用打包为透明背景、置顶的桌面应用程序
- **WebSocket** - **(新增)** 用于替代 HTTP 轮询，实现低延迟、双向实时通信
- **PixiJS (v6)** - WebGL 渲染引擎，用于高性能图形渲染
- **pixi-live2d-display (v0.4)** - 专门用于在 PixiJS 中展示 Live2D 模型的插件

### 为什么选择这些技术

- **Electron**: 实现了浏览器做不到的功能：**背景透明、鼠标穿透、窗口置顶**，让 Live2D 角色真正“生活”在桌面上。
- **WebSocket**: 支持服务端主动推送（AI 自主说话）和客户端实时打断（Interruption），体验远优于 HTTP 请求。
- **Custom Hooks**: 通过 React Hooks 封装复杂逻辑，将 UI 与业务逻辑分离，避免组件臃肿。

------

## 项目结构

当前前端项目位于 `Geek-agent-live2D-main/frontend` 目录下，结构已进行重构：

```text
electron/             # (新增) Electron 主进程配置
  main.js             # 窗口创建、透明设置、硬件加速配置
public/               # 静态资源目录
src/                  # 源代码目录
  assets/             # 资源文件
  components/         # React UI 组件
    Chat/             # 聊天组件 (InputArea, MessageList)
    Live2D/           # Live2D 核心组件 (Controller, Model)
    Sidebar.jsx       # 侧边栏
    LoadingDots.jsx   # 加载动画
  hooks/              # (新增) 业务逻辑 Hooks
    useAudioQueue.js  # 音频队列管理、Base64解码、字幕同步、打断逻辑
    useNeuroSocket.js # WebSocket 连接管理、心跳、消息分发
  pages/              # 页面组件
    MainPage.jsx      # 主页 (重构后仅负责 UI 组装与状态分发)
  App.css             # 主应用样式
  main.jsx            # 应用入口
  index.css           # 全局样式 (已配置透明背景)
vite.config.js        # Vite 配置
package.json          # 依赖配置
```

------

## 视觉层级与 Electron 特性

为了实现“桌宠”效果，视觉层级经过了特殊设计：

**Electron 窗口配置 (`main.js`)**

- `transparent: true` (开启透明)
- `frame: false` (无边框)
- `alwaysOnTop: true` (窗口置顶)
- `backgroundColor: '#00000000'` (ARGB 全透明)

**DOM 层级关系**

```text
body, #root (背景色强制透明)
 ↓
 .app (相对定位)
   ↓
   .live2d-main (Live2D 模型区域)
      ↓
      canvas (PIXI 渲染层, z-index: 1)
      .subtitles (字幕浮层, z-index: 1000)
   ↓
   .sidebar (侧边栏, 交互时滑出)
   .input-area (底部输入框)
```

------

## 通信方式 (WebSocket 协议)

前端不再使用 `/api/chat`，而是通过 WebSocket 长连接与后端通信。

- **连接地址**: `ws://127.0.0.1:8000/ws`
- **消息格式**: JSON 对象 `{ type: "...", payload: { ... } }`

### 主要消息类型定义

| 方向                  | Type           | 说明                                   |
| --------------------- | -------------- | -------------------------------------- |
| **发送 (前端->后端)** | `text_input`   | 用户发送文本消息                       |
| **发送 (前端->后端)** | `audio_input`  | 用户发送语音/文件 (Base64)             |
| **发送 (前端->后端)** | `interrupt`    | 用户触发打断（停止生成）               |
| **接收 (后端->前端)** | `state_update` | 更新 AI 状态 (idle/listening/thinking) |
| **接收 (后端->前端)** | `audio_chunk`  | 接收音频片段、字幕、表情指令           |
| **接收 (后端->前端)** | `canceled`     | 后端确认打断完成                       |

------

## 架构说明 (重构后)

为了解决 `MainPage.jsx` 逻辑过于复杂的问题，采用了 **Custom Hooks** 模式进行解耦。

### 1. 主页面 (`MainPage.jsx`)

作为“指挥官”，不再处理具体逻辑。

- 负责渲染 UI 组件。
- 负责将 `useNeuroSocket`收到的消息转发给 `useAudioQueue`。
- 负责处理用户输入事件。

### 2. 音频逻辑 Hook (`useAudioQueue.js`)

作为“媒体中心”，封装了复杂的音频处理。

- **队列管理**: 维护待播放的音频片段，防止多段语音重叠。
- **Base64 解码**: 将后端返回的 Base64 字符串转为 Blob URL 播放。
- **打断机制**: 暴露 `stopAudio()` 方法，瞬间停止当前播放并清空队列。
- **字幕/表情同步**: 在播放音频的同时，更新字幕和 Live2D 表情。

### 3. 通信逻辑 Hook (`useNeuroSocket.js`)

作为“通信基站”。

- **连接管理**: 自动建立连接，断线自动重连（可扩展）。
- **消息分发**: 接收后端数据并通过回调函数传递给组件。
- **发送封装**: 提供 `sendPacket` 方法，统一发送格式。

### 4. Live2D 控制 (`Live2DController.jsx`)

保持原有的 Ref 设计模式。

- 通过 `live2dRef.current.showExpression("smile")` 供 Hooks 调用，实现表情切换。

------

这种架构使得前端具有极高的可维护性：

- 如果需要修改音频播放策略（如倍速播放），只需修改 `useAudioQueue.js`。
- 如果需要更换后端协议，只需修改 `useNeuroSocket.js`。
- UI 改动互不影响。