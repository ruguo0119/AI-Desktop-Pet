import { useRef, useEffect, useCallback } from 'react';

export function useNeuroSocket(url, onMessage) {
  const wsRef = useRef(null);
  // 用 ref 存 callback，防止 useEffect 依赖死循环
  const onMessageRef = useRef(onMessage); 

  // 每次渲染更新 callback
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ Neuro Link Connected");
    
    ws.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        if (onMessageRef.current) {
          onMessageRef.current(packet);
        }
      } catch (e) {
        console.error("WS Parse Error:", e);
      }
    };

    ws.onerror = (e) => console.error("WS Error:", e);
    
    ws.onclose = () => console.log("❌ 连接断开");

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [url]);

  const sendPacket = useCallback((packet) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(packet));
    }
  }, []);

  return { sendPacket };
}