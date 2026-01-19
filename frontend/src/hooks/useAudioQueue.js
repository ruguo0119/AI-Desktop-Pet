import { useState, useRef, useCallback } from 'react';

export function useAudioQueue(live2dRef) {
  const [subtitle, setSubtitle] = useState("");
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const currentAudioRef = useRef(null);

  // === 内部工具：播放 Base64 音频 ===
  const playAudioBlob = (base64Data) => {
    return new Promise((resolve, reject) => {
      try {
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        currentAudioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudioRef.current = null;
          resolve();
        };

        audio.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };

        audio.play().catch(resolve); // 忽略自动播放限制错误
      } catch (e) {
        reject(e);
      }
    });
  };

  // === 内部逻辑：处理队列 ===
  const processQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    const item = audioQueueRef.current.shift();

    try {
      // 1. 设置表情
      if (item.expression && live2dRef.current) {
        live2dRef.current.showExpression(item.expression);
      }
      // 2. 设置字幕
      setSubtitle(item.text);

      // 3. 播放音频或模拟阅读
      if (item.audio_base64) {
        await playAudioBlob(item.audio_base64);
      } else {
        await new Promise(r => setTimeout(r, 1000 + item.text.length * 100));
      }
    } catch (err) {
      console.error("播放错误:", err);
    } finally {
      isPlayingRef.current = false;
      // 递归消费
      if (audioQueueRef.current.length > 0) {
        processQueue();
      } else {
        // 全部播完
        setSubtitle("");
        if (live2dRef.current) live2dRef.current.resetExpression();
      }
    }
  }, [live2dRef]);

  // === 对外暴露：添加任务 ===
  const queueAudioChunk = useCallback((chunk) => {
    audioQueueRef.current.push(chunk);
    processQueue();
  }, [processQueue]);

  // === 对外暴露：打断 ===
  const stopAudio = useCallback(() => {
    audioQueueRef.current = [];
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    isPlayingRef.current = false;
    setSubtitle("");
    if (live2dRef.current) live2dRef.current.resetExpression();
  }, [live2dRef]);

  return {
    subtitle,
    isPlaying: isPlayingRef.current,
    queueAudioChunk,
    stopAudio
  };
}