# 部署说明

## 你需要准备

- 一个 GitHub 账号
- 一个 Cloudflare 账号
- 可选：你自己的域名，等部署成功后再绑定

这个项目不需要你先准备 API Key，也不需要先手动创建存储。Cloudflare 会根据 `wrangler.jsonc` 里的 `VOTE_KV` 绑定自动创建 KV 存储。

## 推荐方式：Deploy to Cloudflare

1. 在 GitHub 新建一个仓库，例如 `wechat-trip-vote`。
2. 把本项目文件推到这个仓库。
   - 如果用 GitHub 网页上传文件，不要上传 `node_modules/`、`.wrangler/`、`dist/`，它们都是本地生成物。
3. 打开 `README.md`，把 Deploy 按钮里的地址改成你的仓库地址：

   ```md
   [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/你的用户名/你的仓库名)
   ```

4. 在 GitHub 页面点击这个 Deploy 按钮。
5. Cloudflare 会让你确认仓库、Worker 名称和资源绑定，默认保持 `VOTE_KV` 即可。
6. 部署完成后，Cloudflare 会给你一个 `workers.dev` 链接。把这个链接发到微信群就能投票。
7. 后台地址是在投票链接后面加 `/admin-csight-8`，例如：

   ```text
   https://你的项目.workers.dev/admin-csight-8
   ```

   这个后台会显示完整姓名和补充意见，也可以清空测试数据。它目前没有账号密码，属于“不要公开传播的内部链接”，不要发到群里。

## 绑定自己的域名

部署成功后，在 Cloudflare 控制台进入这个 Worker：

1. 进入 `Settings` 或 `Triggers`。
2. 找到 `Custom Domains`。
3. 添加你想用的域名，例如 `vote.example.com`。
4. 如果域名 DNS 已经托管在 Cloudflare，一般按页面提示确认即可。

## 命令行方式

如果你想在本机直接部署：

```bash
npm install
npm run deploy
```

第一次部署时 Wrangler 会要求你登录 Cloudflare。部署时会自动创建 `VOTE_KV` 资源，并把它绑定到 Worker。

如果本机 `npm install` 遇到证书链报错，可以临时这样跑一次：

```bash
npm_config_registry=https://registry.npmjs.org npm_config_strict_ssl=false npm install
```

这条命令只影响当次安装，不会改你的全局 npm 配置。

## 以后怎么改选项

地点和时间在两个文件里各有一份：

- `src/index.ts`：后端校验和接口返回
- `public/app.js`：页面还没连上接口时的备用显示

改选项时两边保持一致。图片放在 `public/assets/`，页面里通过 `public/app.js` 的 `imageByLocation` 对应。

## 隐私边界

公开投票结果只显示每个人名字的第一个字头像，不显示完整名字，也不显示补充意见。

后台 `/admin-csight-8` 会显示完整姓名、选择和意见。这个后台没有强认证，如果以后想做得更稳，可以再加一个后台口令。

这个项目不用 cookie 识别用户，也不做登录系统。它把“输入的名字”当成身份：同一个名字再次进入时，会拉回这个名字之前提交过的选择；再次提交会覆盖旧选择。

后台有“清空测试数据”按钮，清空前需要二次确认并输入“清空”。清空后所有投票、意见和统计都会归零。
