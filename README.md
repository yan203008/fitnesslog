# Fitnesslog · 运动记录

独立的个人运动记录 PWA，原生 JavaScript / CSS，无需构建。

线上地址：https://yan203008.github.io/fitnesslog/

## 本地运行

```sh
python3 -m http.server 4175
```

## 发布

GitHub Pages 从 `main` 分支根目录自动部署。

## 使用

首页快速记录，历史按月回看，独立力量训练动作库。月历常驻，绿色圆底标记运动日期，一条记录对应一个小点。日期之外的字段均选填。

iPhone：Safari 打开线上地址 → 分享 → 添加到主屏幕。

记录仅保存在使用者浏览器的 localStorage（`yuxia-movement-v1`），不上传服务器。更换设备或网址前导出 JSON，再在新设备「设置 → 导入 JSON 备份」。与余下账本使用不同的数据键、PWA 标识和缓存。

## 检查

```sh
node --test tests/*.test.mjs
```
