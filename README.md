# 创见 C-Sight 八期夏天出行投票

一个可以直接分享到微信群里的小投票页面：进来写名字，地点和时间都可以多选，提交后才出现查看结果入口。公开结果只显示名字第一个字的头像，完整姓名和补充意见在后台看。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shadowwider/wechat-trip-vote)

## 功能

- 地点多选：安吉漂流、临港耀雪水世界、崇明横沙岛红房子
- 时间多选：2026 年 6 月 27-28 日、7 月 4-5 日、7 月 11-12 日
- 地点卡片包含从上海市中心出发的大致距离、车程和推荐理由
- 每个人用名字投票，不需要账号登录；同一个名字就是同一个人
- 输入已投过的名字，会自动拉回这个名字的选择，方便修改
- 同名再次提交会更新自己的选择
- 投完之后才显示“查看结果”按钮
- 结果页展示票数、比例和投票人的首字头像，不显示完整姓名
- 可以填写补充意见
- 后台地址 `/admin-csight-8` 可以查看完整姓名、选择和意见，也可以清空测试数据
- 数据存到 Cloudflare Workers KV，部署时会自动创建绑定

## 本地预览

```bash
npm install
npm run dev
```

打开 Wrangler 给出的本地地址即可预览。

## 部署

完整操作看 [docs/deploy.md](docs/deploy.md)。

发布到你自己的 GitHub 仓库后，可以用上面的 Deploy 按钮部署到 Cloudflare。

地点文案和路程口径看 [docs/content-notes.md](docs/content-notes.md)。
