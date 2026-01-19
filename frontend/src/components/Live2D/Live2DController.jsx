// frontend/src/components/Live2D/Live2DController.jsx
import { forwardRef, useImperativeHandle, useRef } from 'react';
import Live2DDisplay from './Live2DModel';

const Live2DController = forwardRef((props, ref) => {
  const live2dRef = useRef(null);

  // 对外暴露的方法
  useImperativeHandle(ref, () => ({
    // 显示表情
    showExpression: (expression, active = true) => {
      if (live2dRef.current) {
        live2dRef.current.showExpression(expression, active);
      }
    },

    // 设置跟踪功能
    setTracking: (enabled) => {
      if (live2dRef.current) {
        live2dRef.current.setTracking(enabled);
      }
    },

    // 重置表情
    resetExpression: () => {
      if (live2dRef.current) {
        setTimeout(() => {
          live2dRef.current.showExpression('', false);
        }, 1000);
      }
    },

    // 获取原始 ref（以备不时之需）
    getLive2DRef: () => live2dRef
  }));

  return <Live2DDisplay ref={live2dRef} />;
});

Live2DController.displayName = 'Live2DController';

export default Live2DController;