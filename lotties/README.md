# Lottie Animations

此目录用于存放底部的 Lottie 动画文件。由于微信小程序不支持直接 require JSON 文件，请将 Lottie 导出的 JSON 内容包装在一个 JS 文件中。

## 使用方法

1. 将导出的 JSON 代码包裹在 module.exports 中，例如 `home.js`:

```javascript
module.exports = {
  "v": "5.5.2",
  "fr": 60,
  "ip": 0,
  "op": 60,
  "w": 500,
  "h": 500,
  "nm": "Home",
  // ... 完整的 json 内容 ...
}
```

2. 在 `app.js` 中引入，并在 tabbar.list 配置中关联 `lottieData` 字段：

```javascript
const homeLottie = require('./lotties/home.js');

// ...
  "list": [{
    "pagePath": "/pages/index/index",
    "iconPath": "/images/redesign/home.svg",
    "lottieData": homeLottie,
    "text": "首页"
  }]
// ...
```
