# How to integrate Live2D into your project
1. clone the repository and find the frontend directory
```bash
git clone https://github.com/PKUMakerSpace/Geek-agent-live2D
cd Geek-agent-live2D/frontend
```
2. load live2d model
src/Live2DModel.jsx is the component to load live2d model, and define the methods to control live2d model

public/models is the directory to store live2d model

src/Live2DModel.jsx use this to load live2d model:
```javascript
const model = await Live2DModel.from('/models/Hiyori/Hiyori.model3.json')
```
`Hiyori.model3.json` is the main file of live2d model. User will upload zips of live2d model, the frontend must unzip the zip file and find the model3.json file.

to use the component in src/App.jsx, you can use it like this:
```javascript
<Live2DDisplay ref={live2dRef} />
```
more details can be found in src/App.jsx. now we don't need to use expressions, so some code in src/App.jsx is not necessary.
The canvas, where we load live2d model on the web, has been defined in src/App.css.
```css
/* Live2D 相关样式 */
.app .live2d-main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app .live2d-main .live2d-container {
  width: 600px;
  height: 800px;
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
}

```