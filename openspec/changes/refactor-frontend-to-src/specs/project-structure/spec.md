## ADDED Requirements

### Requirement: Monorepo Directory Structure
项目 SHALL 采用 monorepo 结构，前后端代码分别位于 `client/` 和 `server/` 目录。

#### Scenario: 标准 Monorepo 布局
- **WHEN** 查看项目根目录
- **THEN** 目录结构如下：
  ```
  together/
  ├── client/              # 前端应用
  │   ├── src/
  │   │   ├── App.tsx
  │   │   ├── index.tsx
  │   │   ├── index.css
  │   │   ├── pages/
  │   │   ├── components/
  │   │   ├── features/
  │   │   └── shared/
  │   ├── tests/           # 前端测试
  │   ├── index.html
  │   ├── vite.config.ts
  │   ├── vitest.config.ts
  │   ├── tsconfig.json
  │   └── package.json
  ├── server/              # 后端服务
  │   ├── src/
  │   ├── tests/
  │   └── package.json
  ├── package.json         # Workspace 根配置
  └── openspec/            # 规范文档
  ```

#### Scenario: Workspace 配置
- **WHEN** 查看根目录 `package.json`
- **THEN** SHALL 包含 workspaces 配置
- **AND** workspaces 包含 `["client", "server"]`

### Requirement: Client Path Alias Configuration
前端路径别名 `@/` SHALL 解析到 `client/src/` 目录。

#### Scenario: 路径别名解析
- **WHEN** 在前端源码中使用 `@/shared/api/client`
- **THEN** 别名 SHALL 解析为 `client/src/shared/api/client`
- **AND** TypeScript、Vite、Vitest 配置保持一致

### Requirement: Independent Package Management
前端和后端 SHALL 各自拥有独立的 `package.json` 管理各自依赖。

#### Scenario: Client 依赖独立
- **WHEN** 安装前端依赖
- **THEN** 前端依赖定义在 `client/package.json`
- **AND** 包含 React、Vite、Tailwind 等前端相关依赖

#### Scenario: Server 依赖独立
- **WHEN** 安装后端依赖
- **THEN** 后端依赖定义在 `server/package.json`
- **AND** 包含 Express、SQLite、JWT 等后端相关依赖

### Requirement: Test Isolation
前后端测试 SHALL 独立运行，互不影响。

#### Scenario: 前端测试独立运行
- **WHEN** 运行前端测试
- **THEN** 可通过 `npm run test -w client` 或 `cd client && npm test` 执行
- **AND** 测试覆盖 `client/src/` 和 `client/tests/` 下的代码

#### Scenario: 后端测试独立运行
- **WHEN** 运行后端测试
- **THEN** 可通过 `npm run test -w server` 或 `cd server && npm test` 执行
- **AND** 测试覆盖 `server/src/` 和 `server/tests/` 下的代码
