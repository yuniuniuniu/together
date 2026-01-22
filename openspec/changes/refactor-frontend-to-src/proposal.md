# Change: Refactor to Monorepo Structure (client/server)

## Why
当前项目结构中前端源码散落在根目录，后端在 `server/` 目录有独立的 `package.json`，但没有使用标准的 monorepo 结构管理。采用 `client/` + `server/` 分离的 monorepo 结构可以：
- 清晰分离前后端代码
- 使用 npm workspaces 统一管理依赖
- 符合现代全栈项目规范

## What Changes
- **创建 monorepo 结构：**
  - 创建 `client/` 目录，包含前端所有代码
  - `server/` 目录保持现有结构
  - 根目录 `package.json` 改为 workspace 配置

- **移动前端文件到 `client/`：**
  - `App.tsx` → `client/src/App.tsx`
  - `index.tsx` → `client/src/index.tsx`
  - `index.css` → `client/src/index.css`
  - `pages/` → `client/src/pages/`
  - `components/` → `client/src/components/`
  - `features/` → `client/src/features/`
  - `shared/` → `client/src/shared/`
  - `tests/` → `client/src/tests/` 或 `client/tests/`
  - `index.html` → `client/index.html`

- **配置文件调整：**
  - 根目录 `package.json` 改为 workspace 根配置
  - 创建 `client/package.json` 包含前端依赖
  - `vite.config.ts` → `client/vite.config.ts`
  - `vitest.config.ts` → `client/vitest.config.ts`
  - `tsconfig.json` → `client/tsconfig.json`
  - 更新所有路径别名

- **更新文档：**
  - `README.md` - 更新项目结构和运行说明
  - `openspec/project.md` - 更新架构说明

## Impact
- Affected specs: project-structure (新建)
- Affected code:
  - 所有前端源码文件（路径变更）
  - 所有配置文件
  - `package.json`（重大变更）
- **BREAKING**: 依赖安装和启动命令可能变化
- 测试必须在重构后全部通过
