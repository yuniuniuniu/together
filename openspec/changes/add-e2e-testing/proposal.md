# Change: 前后端交互 E2E 测试计划

## Why
需要使用 Playwright MCP 对 Sanctuary 情侣应用进行完整的前后端交互测试，验证两个用户（User A 和 User B）的完整用户流程和交互逻辑。

## What Changes
- 使用 Playwright 浏览器自动化测试前后端交互
- 测试两个用户的完整注册/登录流程
- 测试用户配对（创建 Space + 加入 Space）
- 测试记忆和里程碑的创建功能

## 测试范围

### 1. 用户 A 流程（创建空间的用户）
| 步骤 | 页面 | 测试内容 | API 交互 |
|------|------|----------|----------|
| 1 | Login | 输入手机号，获取验证码，登录 | `POST /api/auth/send-code`, `POST /api/auth/verify` |
| 2 | ProfileSetup | 设置昵称和头像 | `PUT /api/auth/profile` |
| 3 | Sanctuary | 选择"Create Couple Space" | - |
| 4 | DateSelection | 选择纪念日日期 | - |
| 5 | CreateSpace | 创建空间，获取邀请码 | `POST /api/spaces` |
| 6 | Dashboard | 等待伙伴加入后进入主页 | `GET /api/spaces/my` |

### 2. 用户 B 流程（加入空间的用户）
| 步骤 | 页面 | 测试内容 | API 交互 |
|------|------|----------|----------|
| 1 | Login | 输入手机号，获取验证码，登录 | `POST /api/auth/send-code`, `POST /api/auth/verify` |
| 2 | ProfileSetup | 设置昵称和头像 | `PUT /api/auth/profile` |
| 3 | Sanctuary | 选择"Join Existing Space" | - |
| 4 | JoinSpace | 输入用户A分享的邀请码 | - |
| 5 | ConfirmPartner | 确认配对伙伴 | `POST /api/spaces/join` |
| 6 | Celebration | 配对成功庆祝页面 | - |
| 7 | Dashboard | 进入共享空间主页 | `GET /api/spaces/my` |

### 3. 共享功能测试
| 功能 | 页面 | 测试内容 | API 交互 |
|------|------|----------|----------|
| 创建记忆 | NewMemory | 用户A创建记忆 | `POST /api/memories` |
| 查看记忆 | MemoryTimeline | 用户B可以看到A创建的记忆 | `GET /api/memories` |
| 创建里程碑 | NewMilestone | 用户B创建里程碑 | `POST /api/milestones` |
| 查看里程碑 | Dashboard | 用户A可以看到B创建的里程碑 | `GET /api/milestones` |

## 测试数据

### 用户 A
- 手机号: `+1234567890`
- 昵称: `Honey`

### 用户 B
- 手机号: `+1987654321`
- 昵称: `Sweetie`

## 测试步骤详解

### Phase 1: 启动服务
1. 启动后端服务器 (port 3001)
2. 启动前端开发服务器 (port 5173)

### Phase 2: 用户 A 完整流程
1. 打开 Login 页面
2. 输入手机号 `+1234567890`
3. 点击 "Get SMS Code" 获取验证码
4. 输入验证码
5. 点击 "Sign In"
6. 在 ProfileSetup 页面输入昵称 "Honey"
7. 点击 "Save & Continue"
8. 在 Sanctuary 页面点击 "Create Couple Space"
9. 在 DateSelection 选择日期
10. 记录生成的邀请码（供用户B使用）
11. 等待在 CreateSpace 页面

### Phase 3: 用户 B 加入流程
1. 新标签页打开 Login 页面
2. 使用手机号 `+1987654321` 登录
3. 设置昵称 "Sweetie"
4. 在 Sanctuary 页面点击 "Join Existing Space"
5. 在 JoinSpace 页面输入用户A的邀请码
6. 点击 "Find My Partner"
7. 在 ConfirmPartner 页面确认
8. 进入 Celebration 庆祝页面
9. 跳转到 Dashboard

### Phase 4: 验证双用户数据同步
1. 用户A创建一条记忆
2. 验证用户B可以看到该记忆
3. 用户B创建一个里程碑
4. 验证用户A可以看到该里程碑

## Impact
- 这是测试计划，不修改代码
- 使用 Playwright MCP 进行实时浏览器自动化测试
