# Design: Frontend Architecture Refactor

## Context

Sanctuary 是一个情侣记忆分享应用，当前为原型阶段，代码结构简单但缺乏可扩展性。随着功能增加，需要建立清晰的架构范式。

**约束条件**：
- 保持应用在重构过程中可运行
- 不引入过多依赖，保持 bundle 体积小
- 移动端优先的设计需要保持

## Goals / Non-Goals

### Goals
- 建立可复用的组件体系
- 实现跨组件的状态共享
- 提高代码可维护性和可测试性
- 统一 API 调用模式

### Non-Goals
- 不引入复杂状态管理库（如 Redux）
- **不进行任何 UI/UX 改动** - 所有视觉效果、交互行为、动画必须与重构前完全一致
- 不添加新功能
- 不修改任何样式值（颜色、间距、字体大小等）

## Decisions

### 1. 目录结构：Feature-Based Organization

```
src/
├── features/                    # 功能模块
│   ├── auth/                    # 认证模块
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── types.ts
│   ├── memory/                  # 记忆模块
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── milestone/               # 里程碑模块
│   ├── space/                   # 空间管理模块
│   └── settings/                # 设置模块
├── shared/                      # 共享代码
│   ├── components/              # 通用UI组件
│   │   ├── layout/              # Header, BottomNav, MobileWrapper
│   │   ├── feedback/            # Modal, BottomSheet, Toast
│   │   ├── form/                # Input, Button, Checkbox
│   │   └── display/             # Card, Avatar, Badge
│   ├── hooks/                   # 通用hooks
│   │   └── useApi.ts
│   ├── types/                   # 全局类型定义
│   │   └── index.ts
│   └── utils/                   # 工具函数
├── pages/                       # 路由页面（薄层，组合 features）
├── App.tsx
└── index.tsx
```

**Rationale**: Feature-based 结构使相关代码聚集，便于理解和修改单个功能，优于按类型分层的扁平结构。

### 2. 状态管理：React Context + Custom Hooks

```typescript
// shared/context/AuthContext.tsx
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// features/auth/hooks/useAuth.ts
export function useAuth() {
  const context = useContext(AuthContext);
  // 封装登录、登出、获取用户信息等方法
  return { ...context, login, logout, updateProfile };
}
```

**Rationale**: React Context 足以满足中小型应用的状态管理需求，无需引入额外依赖。配合 Custom Hooks 可以提供清晰的 API。

**Alternatives considered**:
- Zustand: 更简洁，但对于当前规模不必要
- Redux Toolkit: 过于复杂

### 3. 组件设计模式：Composition over Inheritance

```typescript
// 组合模式示例
<PageLayout>
  <PageLayout.Header title="New Memory" />
  <PageLayout.Content>
    {/* 页面内容 */}
  </PageLayout.Content>
  <PageLayout.FloatingBar>
    {/* 底部操作栏 */}
  </PageLayout.FloatingBar>
</PageLayout>
```

**Rationale**: 组合模式提供灵活性，允许页面自定义布局的各个部分。

### 4. API 调用：Custom Hooks with async/await

```typescript
// shared/hooks/useApi.ts
export function useApi<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // ...
}

// features/memory/hooks/useMemories.ts
export function useMemories() {
  return useApi(() => api.get('/memories'));
}
```

**Rationale**: 自定义 hooks 足以满足需求，无需引入 React Query 等重型库。

### 5. 样式方案：Tailwind Config File

将 index.html 中的配置迁移到 `tailwind.config.ts`，并安装 Tailwind 作为开发依赖。

```typescript
// tailwind.config.ts
export default {
  content: ['./**/*.{tsx,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#eb6347',
        // ...现有颜色配置
      }
    }
  }
}
```

### 6. 类型定义

```typescript
// shared/types/index.ts
export interface User {
  id: string;
  phone?: string;
  nickname: string;
  avatar?: string;
}

export interface Space {
  id: string;
  createdAt: Date;
  anniversaryDate: Date;
  partners: [User, User];
}

export interface Memory {
  id: string;
  spaceId: string;
  content: string;
  mood?: MoodType;
  photos: string[];
  location?: Location;
  createdAt: Date;
  createdBy: string;
}

export interface Milestone {
  id: string;
  spaceId: string;
  title: string;
  date: Date;
  type: MilestoneType;
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 重构过程中引入bug | 渐进式迁移，每次只重构一个模块 |
| 学习曲线 | 新结构遵循 React 最佳实践，文档化模式 |
| 迁移时间较长 | 新旧代码可共存，不阻塞新功能开发 |
| **UI/UX 意外改变** | 每个页面迁移后必须与原版视觉对比验证，保留所有原有 className |

## Migration Plan

### Phase 1: 基础设施
1. 安装并配置 Tailwind CSS
2. 创建目录结构
3. 定义核心类型
4. 创建 Context providers

### Phase 2: 共享组件
1. 抽取 Layout 组件（Header, BottomNav, MobileWrapper）
2. 抽取 Form 组件（Input, Button）
3. 抽取 Feedback 组件（Modal, BottomSheet）

### Phase 3: 逐页迁移
按优先级迁移页面，从简单页面开始：
1. Login → 验证 auth feature 结构
2. Dashboard → 验证 space feature 结构
3. NewMemory → 验证 memory feature 和复杂组件拆分
4. 其他页面...

## Open Questions

1. 是否需要引入 CSS-in-JS 方案来处理动态样式？（当前判断：不需要，Tailwind 足够）
2. API 层是否需要统一的错误处理？（建议在 Phase 3 时根据实际需求决定）
