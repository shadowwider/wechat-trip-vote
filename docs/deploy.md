# 部署说明

## 推荐路径

这个分支仍然是 Cloudflare Workers 项目，沿用原来的 `wrangler.jsonc` 和 `VOTE_KV` 绑定。

不要使用 Deploy to Cloudflare 模板按钮。那个按钮会把这个项目克隆成一个新的 Git 仓库，再创建新的 Worker，适合公开模板，不适合当前“一个仓库多个投票分支”的工作流。

用户端路径：

```text
/ai-km-workshop-0627
```

管理端路径：

```text
/ai-km-workshop-0627/admin
```

## 使用 GitHub 分支部署

推荐用 Cloudflare Workers Builds 连接已有 GitHub 仓库：

1. 在 Cloudflare Dashboard 进入 `Workers & Pages`。
2. 如果已经有 Worker，打开这个 Worker；如果没有，先创建一个 Worker。Worker 名称需要和 `wrangler.jsonc` 里的 `name` 一致，也就是 `wechat-trip-vote`。
3. 进入 `Settings` -> `Builds`。
4. 选择 `Connect`，连接 GitHub 仓库 `shadowwider/wechat-trip-vote`。
5. Root directory 留空或填 `/`。
6. Build command 填 `npm run build`。
7. Deploy command 填 `npm run deploy`。
8. 初次连接仓库时，页面里通常显示的是 `Git branch`，这里选择：

   ```text
   codex/ai-km-workshop-feedback-20260627
   ```

9. 保存并触发构建。构建完成后，用 Worker 域名加上 `/ai-km-workshop-0627` 访问用户端。

连接完成之后，如果以后要切换到另一个投票分支，再进入 `Settings` -> `Builds` -> `Branch control` 修改。也就是说，`production branch` 不一定会在第一次创建页面里以这个名字出现；第一次连接时更常见的字段名是 `Git branch`。

如果你看到的是 `Set up your application`、`创建专用 Git 存储库`、`选择模板` 这类页面，说明你还在 Deploy Button / 模板创建流程里，不是在连接已有仓库的 Workers Builds 流程里。

非 production 分支通常不会自动替换正式线上 Worker。它们可以作为预览或版本，但正式访问哪个分支，取决于 Cloudflare 当前配置的 production branch 或你手动部署的版本。

## 使用命令行部署

```bash
npm install
npm run deploy
```

第一次部署时 Wrangler 会要求登录 Cloudflare。这个方式会部署你当前本地 checkout 的代码，所以要先确认当前分支是：

```bash
git branch --show-current
```

## 自定义域名

本分支没有写死域名。你可以在 Cloudflare 后台进入 Worker：

1. 打开 `Settings` 或 `Domains & Routes`。
2. 添加 Custom Domain。
3. 填写你要绑定的域名。
4. 保存后访问 `https://你的域名/ai-km-workshop-0627`。

如果你希望把域名写进 `wrangler.jsonc`，可以添加：

```json
"routes": [
  {
    "pattern": "feedback.example.com",
    "custom_domain": true
  }
]
```

把 `feedback.example.com` 换成你的域名即可。

## 管理端

管理端不设置密码：

```text
/ai-km-workshop-0627/admin
```

可以查看总提交人数、三个评分题的均分和分布、两个填空题的逐条回答，并支持下载 CSV 和清空数据。
