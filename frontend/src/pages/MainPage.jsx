import React, { useState, useRef, useCallback } from 'react';
import Live2DController from '../components/Live2D/Live2DController';
import MessageList from '../components/Chat/MessageList';
import InputArea from '../components/Chat/InputArea';
import Sidebar from '../components/Sidebar';
import LoadingDots from '../components/LoadingDots';
import '../App.css';

// 引入刚才写的 Hook
import { useAudioQueue } from '../hooks/useAudioQueue';
import { useNeuroSocket } from '../hooks/useNeuroSocket';

const WS_URL = 'ws://127.0.0.1:8000/ws';
const MSG_TYPE = {
  TEXT_INPUT: "text_input",
  AUDIO_INPUT: "audio_input",
  INTERRUPT: "interrupt",
  STATE_UPDATE: "state_update",
  AUDIO_CHUNK: "audio_chunk",
  CANCELED: "canceled",
  ERROR: "error"
};

export default function MainPage() {
  // === UI State ===
  const [messages, setMessages] = useState([]);
  const [neuroState, setNeuroState] = useState("idle");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const live2dRef = useRef(null);
  const fileInputRef = useRef(null);

  // === 1. 使用音频 Hook (逻辑外包) ===
  const { subtitle, isPlaying, queueAudioChunk, stopAudio } = useAudioQueue(live2dRef);

  // === 2. 定义收到消息的处理逻辑 ===
  const handleServerPacket = useCallback((packet) => {
    const { type, payload } = packet;

    switch (type) {
      case MSG_TYPE.STATE_UPDATE:
        setNeuroState(payload.state);
        break;
      
      case MSG_TYPE.AUDIO_CHUNK:
        setNeuroState("idle"); 
        // 收到音频，直接丢给 Hook 处理
        queueAudioChunk(payload);
        setMessages(prev => [...prev, { type: 'assistant', content: payload.text }]);
        break;
        
      case MSG_TYPE.CANCELED:
        console.log("🛑 打断确认");
        break;
        
      case MSG_TYPE.ERROR:
        setMessages(prev => [...prev, { type: 'system', content: `❌ ${payload.info}` }]);
        setNeuroState("idle");
        break;
        
      default:
        console.warn("未知消息:", type);
    }
  }, [queueAudioChunk]);

  // === 3. 使用 Socket Hook (逻辑外包) ===
  const { sendPacket } = useNeuroSocket(WS_URL, handleServerPacket);

  // === 4. 用户交互逻辑 (保持原来的功能) ===
  
  // 触发打断
  const interruptNeuro = () => {
    stopAudio(); // 停止前端
    sendPacket({ type: MSG_TYPE.INTERRUPT }); // 停止后端
  };

  // 发送文本
  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    if (neuroState === "speaking" || isPlaying) interruptNeuro();

    setMessages(prev => [...prev, { type: 'user', content: text }]);
    sendPacket({ 
      type: MSG_TYPE.TEXT_INPUT, 
      payload: { text } 
    });
  };

  // 发送文件 (逻辑没变，只是复用了 sendPacket)
  const handleUpload = (file) => {
    if (!file) return;
    interruptNeuro();

    const reader = new FileReader();
    reader.onload = () => {
      const base64Full = reader.result;
      const base64Data = base64Full.split(',')[1];
      const mimeType = file.type;

      let msgType = MSG_TYPE.TEXT_INPUT;
      let payload = {};

      if (mimeType.startsWith('audio/')) {
        msgType = MSG_TYPE.AUDIO_INPUT;
        payload = { audio_base64: base64Data, format: mimeType };
      } else {
        payload = { 
          text: `[上传了文件: ${file.name}]`, 
          image_base64: base64Data 
        };
      }

      setMessages(prev => [...prev, { type: 'user', content: `📂 ${file.name}` }]);
      sendPacket({ type: msgType, payload });
    };
    reader.readAsDataURL(file);
  };

  // === 5. 渲染 UI (完全保留你原来的结构) ===
  return (
    <div className="app">
      <div className="live2d-main">
        <Live2DController ref={live2dRef} />
        
        {/* 字幕区域 */}
        <div className="subtitles">
          {neuroState === "thinking" ? (
             <div className="status-indicator">
               <LoadingDots /> <span style={{marginLeft:8}}>思考中...</span>
             </div>
          ) : (
             subtitle && <div className="subtitle-text">{subtitle}</div>
          )}
        </div>
      </div>

      <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(true)}>
        ☰
      </button>

      <MessageList messages={messages} />

      <InputArea 
        onSendMessage={handleSendMessage}
        onRecordStart={interruptNeuro} 
        fileInputRef={fileInputRef}
        onFileUpload={handleUpload}
        disabled={false}
        isAiSpeaking={neuroState === "speaking" || isPlaying}
      />

      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        messages={messages}
      />
    </div>
  );
}