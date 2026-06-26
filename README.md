# 领导力 AI 兴趣小组工作坊反馈

这是一个部署在 Cloudflare Workers 上的轻量反馈表，用于 2026 年 6 月 27 日“领导力 AI 兴趣小组”工作坊。

主题：AI 和知识管理 / LLM Wiki。

不要用 Deploy to Cloudflare 模板按钮部署这个分支。那个按钮会把源码克隆成一个新的 Git 仓库，更适合公开模板，不适合我们“一个仓库里多个投票分支”的工作流。

## 页面

- 用户端：`/ai-km-workshop-0627`
- 管理端：`/ai-km-workshop-0627/admin`

管理端不设置密码，只通过特定地址访问。请不要把管理端链接发到公开群里。

## 字段

- 姓名 / 昵称
- 课程整体收获满意度：1-5 分
- 课程中最有价值的具体模块
- 希望进一步深入的 AI 课程内容
- 参加后续进阶课程意愿：1-5 分
- 推荐其他人参加意愿：1-5 分

同一个姓名 / 昵称再次提交会更新同一条反馈记录。

## 数据

项目继续使用 Cloudflare Workers KV，绑定名保持为 `VOTE_KV`，方便沿用原来的 Cloudflare 配置。

本表单使用独立数据 key：

```text
feedback:leadership-ai-km-workshop-2026-06-27:v1
```

因此可以和旧投票共用 KV namespace，不会混在同一份数据里。

## 本地预览

```bash
npm install
npm run dev
```

打开 Wrangler 给出的本地地址后，访问 `/ai-km-workshop-0627`。

## 部署

推荐方式是在 Cloudflare 里连接已有 Worker 和已有 GitHub 仓库：

1. 进入 Cloudflare Dashboard 的 Workers & Pages。
2. 打开已有 Worker，或创建一次新的 Worker。
3. 进入 `Settings` -> `Builds`，连接 GitHub 仓库 `shadowwider/wechat-trip-vote`。
4. 在 Branch control 里把 production branch 设置为 `codex/ai-km-workshop-feedback-20260627`。
5. 构建命令使用 `npm run build`，部署命令使用 `npm run deploy`。

如果只是本地手动部署，也可以切到这个分支后运行：

```bash
npm install
npm run deploy
```

第一次本地部署时 Wrangler 会要求登录 Cloudflare。

域名可以在 Cloudflare Worker 的 Domains & Routes 里单独绑定。本分支没有硬编码自定义域名。
