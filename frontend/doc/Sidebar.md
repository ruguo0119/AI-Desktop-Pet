```
初始状态: sidebarOpen = false
  ↓
点击"聊天记录"按钮
  ↓
setSidebarOpen(true) → sidebarOpen = true
  ↓
<Sidebar isOpen={true} ... />
  ↓
Sidebar 组件应用 'open' 类名
  ↓
CSS: .sidebar.open { transform: translateX(0); }  // 侧边栏滑入
  ↓
用户操作:
  1. 点击遮罩层 → onClose() → setSidebarOpen(false)
  2. 点击关闭按钮 → onClose() → setSidebarOpen(false)
  3. 按ESC键(如果实现) → onClose() → setSidebarOpen(false)
  ↓
sidebarOpen = false
  ↓
<Sidebar isOpen={false} ... />
  ↓
移除 'open' 类名
  ↓
CSS: .sidebar { transform: translateX(-100%); }  // 侧边栏滑出
```