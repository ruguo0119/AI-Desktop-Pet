const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

// 【核心修复 1】禁用硬件加速，否则 Windows 上透明窗口会变黑
app.disableHardwareAcceleration();

// 【核心修复 2】允许延迟创建，防止黑屏闪烁
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: 450, // 稍微宽一点，防止按钮挤下去
    height: 650,
    x: width - 500,
    y: height - 700,
    
    // 【核心修复 3】窗口属性配置
    frame: false,             // 无边框
    transparent: true,        // 开启透明
    backgroundColor: '#00000000', // 关键！ARGB格式，前两位00代表完全透明
    alwaysOnTop: true,        // 置顶
    hasShadow: false,         // 去掉系统阴影
    resizable: true,          // 允许调整大小
    
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.loadURL('http://localhost:5173');
}

// 这里的延时是为了让 GPU 状态稳定后再创建窗口
app.whenReady().then(() => {
  setTimeout(createWindow, 200); 
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});