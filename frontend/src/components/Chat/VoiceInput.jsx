import React, { useState, useRef, useEffect } from 'react';

export default function VoiceInput({ onAudioCaptured, onRecordStart, disabled }) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null); // 新增：保存流引用以便清理

  // ✅ 安全清理：组件卸载时强制停止录音，释放麦克风
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
        // 防止长按重复触发
        if (e.repeat) return;
        
        // 按住 F2 (或者波浪号 `) 开始录音
        if (e.key === 'F2' && !isRecording && !disabled) {
            startRecording();
        }
    };

    const handleKeyUp = (e) => {
        // 松开 F2 停止录音
        if (e.key === 'F2' && isRecording) {
            stopRecording();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
}, [isRecording, disabled]); // 依赖项要加上
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 立即打断 AI
      if (onRecordStart) {
          onRecordStart(); 
      }

      // ⚠️ 注意：Chrome/Electron 默认录制 WebM
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // ✅ 修正：使用正确的 MIME 类型，防止后端解码失败
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onAudioCaptured(audioBlob); 
        
        // 停止麦克风占用
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);

    } catch (err) {
      console.error("无法启动麦克风:", err);
      // 这里的 alert 在 Electron 里可能比较突兀，以后可以换成 toast 提示
      alert("请允许麦克风权限，或检查麦克风设置");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      className={`icon-button ${isRecording ? 'recording' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      title={isRecording ? "点击停止" : "点击说话"}
      style={{
        backgroundColor: isRecording ? '#ff4d4f' : 'transparent', // 录音时变红
        color: isRecording ? 'white' : 'inherit',
        border: isRecording ? 'none' : '1px solid #ccc',
        transition: 'all 0.2s',
        minWidth: '40px',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {isRecording ? '⏹' : '🎤'}
    </button>
  );
}