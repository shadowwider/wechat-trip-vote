# 部署说明

## 推荐路径

这个分支仍然是 Cloudflare Workers 项目，沿用原来的 `wrangler.jsonc` 和 `VOTE_KV` 绑定。

README 顶部有 Deploy to Cloudflare 按钮，可以先用它部署。如果按钮页面没有自动识别分支，请手动选择 `codex/ai-km-workshop-feedback-20260627`。

用户端路径：

```text
/ai-km-workshop-0627
```

管理端路径：

```text
/ai-km-workshop-0627/admin
```

## 使用 GitHub 分支部署

如果 Cloudflare Worker 已连接这个 GitHub 仓库：

1. 在 Cloudflare Worker 的 Builds / Git 设置中选择 production branch。
2. 把 production branch 切到这个反馈表分支。
3. 等 Cloudflare 自动构建。
4. 构建完成后，用 Worker 域名加上 `/ai-km-workshop-0627` 访问用户端。

非 production 分支通常不会自动替换正式线上 Worker。它们可以作为预览或版本，但正式访问哪个分支，取决于 Cloudflare 当前配置的 production branch 或你手动部署的版本。

## 使用命令行部署

```bash
npm install
npm run deploy
```

第一次部署时 Wrangler 会要求登录 Cloudflare。

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
