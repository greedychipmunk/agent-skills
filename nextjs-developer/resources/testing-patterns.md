# Next.js Testing Patterns

## Overview

This guide covers testing strategies for Next.js applications using Jest, React Testing Library, and Playwright.

---

## Setup

### Jest Configuration
```typescript
// jest.config.js
const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Jest Setup
```typescript
// jest.setup.js
import "@testing-library/jest-dom"
```

### Package Installation
```bash
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
```

---

## Component Testing

### Basic Component Test
```typescript
// components/button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { Button } from "./button"

describe("Button", () => {
  it("renders button with text", () => {
    render(<Button>Click me</Button>)

    expect(screen.getByRole("button")).toHaveTextContent("Click me")
  })

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole("button"))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>)

    expect(screen.getByRole("button")).toBeDisabled()
  })
})
```

### Testing with User Events
```typescript
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SearchInput } from "./search-input"

describe("SearchInput", () => {
  it("updates value on user input", async () => {
    const user = userEvent.setup()
    const handleSearch = jest.fn()

    render(<SearchInput onSearch={handleSearch} />)

    const input = screen.getByRole("textbox")
    await user.type(input, "hello")

    expect(input).toHaveValue("hello")
  })

  it("submits on enter key", async () => {
    const user = userEvent.setup()
    const handleSearch = jest.fn()

    render(<SearchInput onSearch={handleSearch} />)

    await user.type(screen.getByRole("textbox"), "test{enter}")

    expect(handleSearch).toHaveBeenCalledWith("test")
  })
})
```

---

## Testing Async Components

### Server Component Testing
```typescript
// app/posts/page.test.tsx
import { render, screen } from "@testing-library/react"
import PostsPage from "./page"

// Mock the data fetching
jest.mock("@/lib/db", () => ({
  db: {
    post: {
      findMany: jest.fn().mockResolvedValue([
        { id: "1", title: "Post 1" },
        { id: "2", title: "Post 2" },
      ]),
    },
  },
}))

describe("PostsPage", () => {
  it("renders posts from database", async () => {
    const PostsPageComponent = await PostsPage()
    render(PostsPageComponent)

    expect(screen.getByText("Post 1")).toBeInTheDocument()
    expect(screen.getByText("Post 2")).toBeInTheDocument()
  })
})
```

### Testing with Suspense
```typescript
import { render, screen, waitFor } from "@testing-library/react"
import { Suspense } from "react"
import { PostList } from "./post-list"

describe("PostList", () => {
  it("shows loading state then content", async () => {
    render(
      <Suspense fallback={<div>Loading...</div>}>
        <PostList />
      </Suspense>
    )

    expect(screen.getByText("Loading...")).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText("Post 1")).toBeInTheDocument()
    })
  })
})
```

---

## Testing Hooks

### Custom Hook Testing
```typescript
// hooks/use-counter.test.ts
import { renderHook, act } from "@testing-library/react"
import { useCounter } from "./use-counter"

describe("useCounter", () => {
  it("initializes with default value", () => {
    const { result } = renderHook(() => useCounter())

    expect(result.current.count).toBe(0)
  })

  it("initializes with custom value", () => {
    const { result } = renderHook(() => useCounter(10))

    expect(result.current.count).toBe(10)
  })

  it("increments count", () => {
    const { result } = renderHook(() => useCounter())

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })

  it("decrements count", () => {
    const { result } = renderHook(() => useCounter(5))

    act(() => {
      result.current.decrement()
    })

    expect(result.current.count).toBe(4)
  })
})
```

---

## API Route Testing

### Route Handler Testing
```typescript
// app/api/posts/route.test.ts
import { GET, POST } from "./route"
import { NextRequest } from "next/server"

// Mock the database
jest.mock("@/lib/db", () => ({
  db: {
    post: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { db } from "@/lib/db"

describe("POST /api/posts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns all posts", async () => {
    const mockPosts = [
      { id: "1", title: "Post 1" },
      { id: "2", title: "Post 2" },
    ]
    ;(db.post.findMany as jest.Mock).mockResolvedValue(mockPosts)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockPosts)
  })

  it("creates a new post", async () => {
    const newPost = { id: "3", title: "New Post" }
    ;(db.post.create as jest.Mock).mockResolvedValue(newPost)

    const request = new NextRequest("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({ title: "New Post" }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toEqual(newPost)
  })
})
```

---

## Server Actions Testing

### Testing Server Actions
```typescript
// app/actions.test.ts
import { createPost, deletePost } from "./actions"
import { revalidatePath } from "next/cache"

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

jest.mock("@/lib/db", () => ({
  db: {
    post: {
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { db } from "@/lib/db"

describe("Server Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("createPost", () => {
    it("creates post and revalidates path", async () => {
      const formData = new FormData()
      formData.append("title", "Test Post")
      formData.append("content", "Test content")

      ;(db.post.create as jest.Mock).mockResolvedValue({
        id: "1",
        title: "Test Post",
      })

      await createPost(formData)

      expect(db.post.create).toHaveBeenCalledWith({
        data: {
          title: "Test Post",
          content: "Test content",
        },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/posts")
    })
  })

  describe("deletePost", () => {
    it("deletes post by id", async () => {
      await deletePost("1")

      expect(db.post.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      })
    })
  })
})
```

---

## Integration Testing

### Testing Page with Router
```typescript
// app/posts/[id]/page.test.tsx
import { render, screen } from "@testing-library/react"
import PostPage from "./page"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({ id: "1" }),
}))

jest.mock("@/lib/api", () => ({
  getPost: jest.fn().mockResolvedValue({
    id: "1",
    title: "Test Post",
    content: "Test content",
  }),
}))

describe("PostPage", () => {
  it("renders post content", async () => {
    const PageComponent = await PostPage({ params: { id: "1" } })
    render(PageComponent)

    expect(screen.getByText("Test Post")).toBeInTheDocument()
    expect(screen.getByText("Test content")).toBeInTheDocument()
  })
})
```

---

## E2E Testing with Playwright

### Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Tests
```typescript
// e2e/posts.spec.ts
import { test, expect } from "@playwright/test"

test.describe("Posts", () => {
  test("displays posts list", async ({ page }) => {
    await page.goto("/posts")

    await expect(page.getByRole("heading", { name: "Posts" })).toBeVisible()
    await expect(page.getByRole("listitem")).toHaveCount(3)
  })

  test("creates new post", async ({ page }) => {
    await page.goto("/posts/new")

    await page.getByLabel("Title").fill("New Post")
    await page.getByLabel("Content").fill("Post content")
    await page.getByRole("button", { name: "Create" }).click()

    await expect(page).toHaveURL(/\/posts\/\d+/)
    await expect(page.getByText("New Post")).toBeVisible()
  })

  test("navigates to post detail", async ({ page }) => {
    await page.goto("/posts")

    await page.getByRole("link", { name: "First Post" }).click()

    await expect(page).toHaveURL("/posts/1")
    await expect(page.getByText("First Post")).toBeVisible()
  })
})
```

---

## Mocking Patterns

### Mocking Next.js Modules
```typescript
// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/current-path",
  useSearchParams: () => new URLSearchParams("q=test"),
  useParams: () => ({ id: "1" }),
}))

// Mock next/headers
jest.mock("next/headers", () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
  headers: () => new Headers(),
}))
```

### Mocking Fetch
```typescript
// Global fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: "mocked" }),
  })
) as jest.Mock

// Per-test mock
beforeEach(() => {
  ;(fetch as jest.Mock).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  )
})
```

---

## Testing Best Practices

### Guidelines
- Test behavior, not implementation
- Use meaningful test descriptions
- Keep tests independent
- Mock external dependencies
- Test error states and edge cases

### File Organization
```
src/
├── components/
│   ├── button.tsx
│   └── button.test.tsx
├── app/
│   └── posts/
│       ├── page.tsx
│       └── page.test.tsx
└── e2e/
    └── posts.spec.ts
```

### Running Tests
```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# E2E tests
npx playwright test
```

---

**Last Updated**: January 2026
