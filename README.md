# 领导力 AI 兴趣小组工作坊反馈

这是一个部署在 Cloudflare Workers 上的轻量反馈表，用于 2026 年 6 月 27 日“领导力 AI 兴趣小组”工作坊。

主题：AI 和知识管理 / LLM Wiki。

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

```bash
npm run deploy
```

如果你使用 Cloudflare 的 GitHub 集成，把当前要上线的投票分支设置为 production branch。这个分支更新后，Cloudflare 会按该分支构建正式部署。

域名可以在 Cloudflare Worker 的 Domains & Routes 里单独绑定。本分支没有硬编码自定义域名。
