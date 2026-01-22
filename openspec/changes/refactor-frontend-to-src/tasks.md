# Tasks: Refactor to Monorepo Structure

## 1. 准备工作
- [x] 1.1 确认当前测试全部通过（前端和后端）
- [x] 1.2 备份当前 `package.json` 依赖信息

## 2. 创建 client 目录结构
- [x] 2.1 创建 `client/` 和 `client/src/` 目录
- [x] 2.2 移动 `index.html` 到 `client/index.html`

## 3. 移动前端源码到 client/src/
- [x] 3.1 移动 `App.tsx` 到 `client/src/App.tsx`
- [x] 3.2 移动 `index.tsx` 到 `client/src/index.tsx`
- [x] 3.3 移动 `index.css` 到 `client/src/index.css`
- [x] 3.4 移动 `pages/` 目录到 `client/src/pages/`
- [x] 3.5 移动 `components/` 目录到 `client/src/components/`
- [x] 3.6 移动 `features/` 目录到 `client/src/features/`
- [x] 3.7 移动 `shared/` 目录到 `client/src/shared/`

## 4. 移动前端测试和配置
- [x] 4.1 移动 `tests/` 目录到 `client/tests/`
- [x] 4.2 移动 `vite.config.ts` 到 `client/vite.config.ts`
- [x] 4.3 移动 `vitest.config.ts` 到 `client/vitest.config.ts`
- [x] 4.4 移动 `tsconfig.json` 到 `client/tsconfig.json`
- [x] 4.5 移动 `postcss.config.js` 到 `client/postcss.config.js`

## 5. 配置 package.json
- [x] 5.1 创建 `client/package.json`（从根目录提取前端依赖）
- [x] 5.2 更新根目录 `package.json` 为 workspace 配置
- [x] 5.3 移动前端 `.env*` 文件到 `client/`

## 6. 更新配置文件路径
- [x] 6.1 更新 `client/vite.config.ts` - 修改 `@` 别名指向 `client/src/`
- [x] 6.2 更新 `client/vitest.config.ts` - 修改别名和测试路径
- [x] 6.3 更新 `client/tsconfig.json` - 修改 paths 配置
- [x] 6.4 更新 `client/index.html` - 修改 CSS 和 JS 入口路径

## 7. 更新源码中的导入路径
- [x] 7.1 更新所有 `@/` 别名路径确保正确解析
- [x] 7.2 检查并修复任何相对路径问题

## 8. 安装依赖
- [x] 8.1 删除根目录 `node_modules/`
- [x] 8.2 在根目录运行 `npm install` 安装 workspace 依赖

## 9. 验证测试通过
- [x] 9.1 运行前端测试 `npm run test -w client` 或 `cd client && npm test`
- [x] 9.2 运行后端测试 `npm run test -w server` 或 `cd server && npm test`
- [x] 9.3 验证前端开发服务器正常启动
- [x] 9.4 验证后端开发服务器正常启动

## 10. 更新文档
- [x] 10.1 更新 `README.md` - 反映 monorepo 结构和新命令
- [x] 10.2 更新 `openspec/project.md` - 更新目录结构说明

## 依赖关系
- 任务 1.x 必须最先完成
- 任务 2.x, 3.x, 4.x 可并行执行
- 任务 5.x, 6.x 依赖 2-4 完成
- 任务 7.x 依赖 6.x 完成
- 任务 8.x 依赖 5.x, 7.x 完成
- 任务 9.x 依赖 8.x 完成
- 任务 10.x 依赖 9.x 完成（测试通过后才更新文档）
