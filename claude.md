# SecondMe Agent Network Demo

## 项目愿景

基于 SecondMe API 构建一个 Agent 网络协调系统，让用户的数字分身自动分析需求、匹配资源、协调执行。

## 用户故事示例

> 小美想在周六办一场户外电影之夜，邀请朋友来。她什么都没有，预算 200 块。
>
> 她打开 SecondMe 说："我想办一场户外电影之夜，邀请朋友来。我什么都没有，预算 200 块。"
>
> Agent 网络开始运转：
> - 老王的 Agent 分析主人的天台空着 → 自动生成 Offer："天台可以用，免费"
> - 小李的 Agent 分析投影仪闲置 → 自动生成 Offer："投影仪可以借，1080P"
> - 阿亮的 Agent 分析主人想炫耀音响 → 自动生成 Offer："我带 Marshall 来"
> - 阿芳的 Agent 分析主人想拓展客源 → 自动生成 Offer："我带手工爆米花，免费"
> - 老周的 Agent 分析露营装备闲置 → 自动生成 Offer："我带椅子和垫子，够 10 个人坐"

## 技术栈

- **前端**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **认证**: SecondMe OAuth2
- **AI**: SecondMe Chat API (流式对话)
- **数据库**: Prisma + SQLite (后续迭代)
- **UI 风格**: 赛博朋克 (霓虹色 + 网格背景)

## SecondMe API

**官方文档**: https://develop-docs.second.me/zh/docs/api-reference/secondme

**Base URL**: `https://app.mindos.com/gate/lab`

**认证方式**: 所有端点需要 OAuth2 Token 或 API Key，通过 `Authorization` header 传递

### OAuth2 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/oauth/authorize/external` | 发起授权请求 |
| POST | `/api/oauth/token/code` | 授权码换取 access_token |
| POST | `/api/oauth/token/refresh` | 刷新 access_token |

### 用户信息端点

| 方法 | 端点 | Scope | 描述 |
|------|------|-------|------|
| GET | `/api/secondme/user/info` | `user.info` | 获取授权用户的基本信息 |
| GET | `/api/secondme/user/shades` | `user.info` | 获取用户的兴趣标签 |
| GET | `/api/secondme/user/softmemory` | `user.info` | 获取用户的软记忆数据（个人知识库） |

### 笔记与记忆端点

| 方法 | 端点 | Scope | 描述 |
|------|------|-------|------|
| POST | `/api/secondme/note/add` | `note.add` | 创建一条笔记或记忆（文本或链接） |

### 聊天与对话端点

| 方法 | 端点 | Scope | 描述 |
|------|------|-------|------|
| POST | `/api/secondme/chat/stream` | `chat` | 以用户的 AI 分身进行流式对话 |
| GET | `/api/secondme/chat/session/list` | `chat` | 获取用户的聊天会话列表 |
| GET | `/api/secondme/chat/session/messages` | `chat` | 获取指定会话的消息历史 |

### 响应格式

所有 API 返回标准化 JSON 响应：
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}

---

## 开发进度

### ✅ MVP v1 - 已完成
- [x] Next.js 项目初始化
- [x] SecondMe OAuth2 登录集成
- [x] 用户信息 + 兴趣标签展示
- [x] 赛博朋克 UI 设计
- [x] Session 管理 (HTTP-only cookies)

### 🚧 MVP v2 - 待开发
- [ ] 数据库集成 (Prisma + SQLite)
- [ ] 需求发布功能
  - [ ] 需求表单 UI
  - [ ] 调用 SecondMe Chat API 分析需求
  - [ ] 存储需求到数据库
- [ ] Agent 分析模块
  - [ ] 获取用户 softmemory
  - [ ] 分析用户资源和意愿
  - [ ] 生成匹配建议

### 🔮 MVP v3 - 规划中
- [ ] Offer 生成与展示
- [ ] 多用户 Agent 网络模拟
- [ ] 实时匹配通知
- [ ] Chat 流式对话界面

---

## 数据库模型 (待实现)

```prisma
model User {
  id            String   @id @default(cuid())
  secondmeId    String   @unique
  name          String?
  avatar        String?
  accessToken   String
  refreshToken  String
  tokenExpiry   DateTime
  createdAt     DateTime @default(now())
  requests      Request[]
  offers        Offer[]
}

model Request {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  content     String   // 需求描述
  budget      Float?
  deadline    DateTime?
  status      String   @default("pending")
  createdAt   DateTime @default(now())
  offers      Offer[]
}

model Offer {
  id          String   @id @default(cuid())
  requestId   String
  request     Request  @relation(fields: [requestId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  content     String   // Offer 内容
  reasoning   String?  // Agent 分析理由
  status      String   @default("pending")
  createdAt   DateTime @default(now())
}
```

---

## 环境变量

```env
SECONDME_CLIENT_ID=your_client_id
SECONDME_CLIENT_SECRET=your_client_secret
SECONDME_REDIRECT_URI=http://localhost:3000/api/auth/callback
```
