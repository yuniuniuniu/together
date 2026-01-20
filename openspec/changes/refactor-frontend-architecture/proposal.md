# Change: Refactor Frontend Architecture

## Why

当前项目存在以下问题：
1. **组件臃肿** - 页面组件包含大量内联UI逻辑（如 NewMemory.tsx 有 380+ 行，包含3个完整的 overlay 组件）
2. **无状态管理** - 所有状态都在组件内部，无法跨组件共享用户、空间等数据
3. **无代码复用** - 相似的 UI 模式（header、底部导航、卡片、表单输入）在多个页面重复实现
4. **样式分散** - Tailwind 配置通过 CDN 引入，自定义颜色和样式散落在 index.html 的 script 标签中
5. **缺乏类型安全** - 没有定义业务实体的 TypeScript 类型

建立清晰的设计范式将提高代码可维护性、减少重复、并为后续功能开发打下基础。

## What Changes

### 目录结构重组
- 引入 `features/` 按功能模块组织代码
- 创建 `shared/` 存放通用组件、hooks、类型
- 将 Tailwind 配置迁移到 `tailwind.config.ts`

### 状态管理
- 使用 React Context 实现全局状态管理
- 创建 `AuthContext` 管理用户认证状态
- 创建 `SpaceContext` 管理情侣空间数据

### 组件抽象
- 抽取通用 UI 组件（Header、BottomNav、Card、FormInput、Modal/BottomSheet）
- 创建自定义 hooks 封装 API 调用和业务逻辑

### 类型系统
- 定义核心业务类型（User、Partner、Memory、Milestone、Space）

## Critical Constraint

**UI/UX 必须保持完全一致** - 此次重构仅涉及代码结构和组织方式，不改变任何用户可见的界面和交互行为。重构前后：
- 所有页面视觉效果必须完全相同
- 所有交互行为必须完全相同
- 所有动画效果必须保留
- 所有样式细节（颜色、间距、字体、阴影等）必须保持一致

## Impact

- **Affected specs**: 新建 `frontend-architecture` 规范
- **Affected code**:
  - 所有 `pages/*.tsx` 文件将逐步重构
  - `components/` 将扩展为完整组件库
  - `index.html` 中的 Tailwind 配置将迁移
- **Breaking changes**: 无，采用渐进式迁移策略
- **Visual changes**: 无，UI/UX 保持完全一致
