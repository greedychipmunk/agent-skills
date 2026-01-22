/**
 * Page Test Template
 *
 * This template demonstrates testing patterns for Next.js pages:
 * - Server Component testing
 * - Client Component testing
 * - API route testing
 * - Server Action testing
 * - Mocking patterns
 * - Integration tests
 *
 * Frameworks: Jest + React Testing Library
 *
 * Usage:
 * 1. Copy to __tests__/[page-name].test.tsx or app/[route]/page.test.tsx
 * 2. Replace PAGE_NAME with your page name
 * 3. Implement your test cases
 *
 * Location: __tests__/[page-name].test.tsx or colocate with page
 */

import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { notFound, redirect } from "next/navigation"

// ============================================================================
// MOCKS
// ============================================================================

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
  usePathname: () => "/test-path",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "123" }),
  notFound: jest.fn(),
  redirect: jest.fn(),
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

// Mock data fetching functions
jest.mock("@/lib/api", () => ({
  getItems: jest.fn(),
  getItemById: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
}))

// Import after mocks
import { getItems, getItemById } from "@/lib/api"

// ============================================================================
// TEST DATA
// ============================================================================

const mockItems = [
  {
    id: "1",
    title: "First Item",
    description: "Description of first item",
    status: "published",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    title: "Second Item",
    description: "Description of second item",
    status: "draft",
    createdAt: "2024-01-02T00:00:00Z",
  },
]

const mockItem = mockItems[0]

// ============================================================================
// SERVER COMPONENT TESTS
// ============================================================================

describe("ItemsPage (Server Component)", () => {
  // Import the actual page component
  // In real tests, import from: import ItemsPage from "@/app/items/page"

  // Mock Server Component for testing
  async function ItemsPage() {
    const items = await getItems()

    return (
      <main>
        <h1>Items</h1>
        <ul>
          {items.map((item: typeof mockItem) => (
            <li key={item.id} data-testid={`item-${item.id}`}>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </li>
          ))}
        </ul>
      </main>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders items from API", async () => {
    ;(getItems as jest.Mock).mockResolvedValue(mockItems)

    // For async Server Components, we need to await the component
    const PageComponent = await ItemsPage()
    render(PageComponent)

    expect(screen.getByRole("heading", { name: "Items" })).toBeInTheDocument()
    expect(screen.getByText("First Item")).toBeInTheDocument()
    expect(screen.getByText("Second Item")).toBeInTheDocument()
  })

  it("renders empty state when no items", async () => {
    ;(getItems as jest.Mock).mockResolvedValue([])

    const PageComponent = await ItemsPage()
    render(PageComponent)

    expect(screen.getByRole("heading", { name: "Items" })).toBeInTheDocument()
    expect(screen.queryByTestId(/item-/)).not.toBeInTheDocument()
  })

  it("handles fetch error gracefully", async () => {
    ;(getItems as jest.Mock).mockRejectedValue(new Error("API Error"))

    await expect(ItemsPage()).rejects.toThrow("API Error")
  })
})

// ============================================================================
// DYNAMIC ROUTE PAGE TESTS
// ============================================================================

describe("ItemDetailPage (Dynamic Route)", () => {
  // Mock dynamic page component
  async function ItemDetailPage({ params }: { params: { id: string } }) {
    const item = await getItemById(params.id)

    if (!item) {
      notFound()
    }

    return (
      <main>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
        <span>Status: {item.status}</span>
      </main>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders item details", async () => {
    ;(getItemById as jest.Mock).mockResolvedValue(mockItem)

    const PageComponent = await ItemDetailPage({ params: { id: "1" } })
    render(PageComponent)

    expect(screen.getByRole("heading", { name: "First Item" })).toBeInTheDocument()
    expect(screen.getByText("Description of first item")).toBeInTheDocument()
    expect(screen.getByText("Status: published")).toBeInTheDocument()
  })

  it("calls notFound for non-existent item", async () => {
    ;(getItemById as jest.Mock).mockResolvedValue(null)

    await ItemDetailPage({ params: { id: "999" } })

    expect(notFound).toHaveBeenCalled()
  })
})

// ============================================================================
// CLIENT COMPONENT TESTS
// ============================================================================

describe("ItemForm (Client Component)", () => {
  // Mock Client Component
  function ItemForm({
    onSubmit,
    initialData,
  }: {
    onSubmit: (data: { title: string; description: string }) => void
    initialData?: { title: string; description: string }
  }) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          onSubmit({
            title: formData.get("title") as string,
            description: formData.get("description") as string,
          })
        }}
      >
        <label>
          Title
          <input
            name="title"
            defaultValue={initialData?.title}
            required
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            defaultValue={initialData?.description}
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    )
  }

  it("submits form data", async () => {
    const user = userEvent.setup()
    const handleSubmit = jest.fn()

    render(<ItemForm onSubmit={handleSubmit} />)

    await user.type(screen.getByLabelText("Title"), "New Item")
    await user.type(screen.getByLabelText("Description"), "New description")
    await user.click(screen.getByRole("button", { name: "Submit" }))

    expect(handleSubmit).toHaveBeenCalledWith({
      title: "New Item",
      description: "New description",
    })
  })

  it("pre-fills form with initial data", () => {
    render(
      <ItemForm
        onSubmit={jest.fn()}
        initialData={{ title: "Existing", description: "Existing desc" }}
      />
    )

    expect(screen.getByLabelText("Title")).toHaveValue("Existing")
    expect(screen.getByLabelText("Description")).toHaveValue("Existing desc")
  })

  it("validates required fields", async () => {
    const user = userEvent.setup()
    const handleSubmit = jest.fn()

    render(<ItemForm onSubmit={handleSubmit} />)

    // Try to submit without filling required fields
    await user.click(screen.getByRole("button", { name: "Submit" }))

    // Form should not submit due to HTML validation
    expect(handleSubmit).not.toHaveBeenCalled()
  })
})

// ============================================================================
// SERVER ACTION TESTS
// ============================================================================

describe("Server Actions", () => {
  // Mock server action
  async function createItem(formData: FormData) {
    "use server"

    const title = formData.get("title") as string
    const description = formData.get("description") as string

    if (!title) {
      return { success: false, error: "Title is required" }
    }

    // Simulate API call
    const item = {
      id: "new-id",
      title,
      description,
      status: "draft",
      createdAt: new Date().toISOString(),
    }

    return { success: true, data: item }
  }

  it("creates item successfully", async () => {
    const formData = new FormData()
    formData.append("title", "New Item")
    formData.append("description", "Description")

    const result = await createItem(formData)

    expect(result.success).toBe(true)
    expect(result.data?.title).toBe("New Item")
  })

  it("returns error for invalid data", async () => {
    const formData = new FormData()
    // Missing required title

    const result = await createItem(formData)

    expect(result.success).toBe(false)
    expect(result.error).toBe("Title is required")
  })
})

// ============================================================================
// API ROUTE TESTS
// ============================================================================

describe("API Route: /api/items", () => {
  // Mock API route handlers
  async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "10"

    return Response.json({
      items: mockItems.slice(0, Number(limit)),
      total: mockItems.length,
    })
  }

  async function POST(request: Request) {
    const body = await request.json()

    if (!body.title) {
      return Response.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    const newItem = {
      id: "new-id",
      ...body,
      createdAt: new Date().toISOString(),
    }

    return Response.json({ item: newItem }, { status: 201 })
  }

  it("GET returns items list", async () => {
    const request = new Request("http://localhost/api/items?limit=10")
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.items).toHaveLength(2)
    expect(data.total).toBe(2)
  })

  it("GET respects limit parameter", async () => {
    const request = new Request("http://localhost/api/items?limit=1")
    const response = await GET(request)
    const data = await response.json()

    expect(data.items).toHaveLength(1)
  })

  it("POST creates new item", async () => {
    const request = new Request("http://localhost/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Item", description: "Desc" }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.item.title).toBe("New Item")
  })

  it("POST returns 400 for invalid data", async () => {
    const request = new Request("http://localhost/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Missing title" }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Title is required")
  })
})

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Items Page Integration", () => {
  // Full page integration test
  function ItemsPageWithForm({
    items,
    onAddItem,
  }: {
    items: typeof mockItems
    onAddItem: (title: string) => void
  }) {
    return (
      <main>
        <h1>Items</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            onAddItem(formData.get("title") as string)
            e.currentTarget.reset()
          }}
        >
          <input name="title" placeholder="New item title" required />
          <button type="submit">Add Item</button>
        </form>

        <ul>
          {items.map((item) => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      </main>
    )
  }

  it("allows adding new items", async () => {
    const user = userEvent.setup()
    const handleAddItem = jest.fn()

    render(<ItemsPageWithForm items={mockItems} onAddItem={handleAddItem} />)

    // Verify initial items are displayed
    expect(screen.getByText("First Item")).toBeInTheDocument()
    expect(screen.getByText("Second Item")).toBeInTheDocument()

    // Add new item
    await user.type(screen.getByPlaceholderText("New item title"), "Third Item")
    await user.click(screen.getByRole("button", { name: "Add Item" }))

    expect(handleAddItem).toHaveBeenCalledWith("Third Item")
  })

  it("filters items based on search", async () => {
    const user = userEvent.setup()

    function FilterableList({ items }: { items: typeof mockItems }) {
      const [search, setSearch] = React.useState("")
      const filtered = items.filter((i) =>
        i.title.toLowerCase().includes(search.toLowerCase())
      )

      return (
        <div>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul>
            {filtered.map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ul>
        </div>
      )
    }

    // Need to import React for this test
    const React = require("react")

    render(<FilterableList items={mockItems} />)

    // Initially shows all items
    expect(screen.getByText("First Item")).toBeInTheDocument()
    expect(screen.getByText("Second Item")).toBeInTheDocument()

    // Search for "First"
    await user.type(screen.getByPlaceholderText("Search..."), "First")

    // Should only show matching item
    expect(screen.getByText("First Item")).toBeInTheDocument()
    expect(screen.queryByText("Second Item")).not.toBeInTheDocument()
  })
})

// ============================================================================
// SNAPSHOT TESTS
// ============================================================================

describe("Snapshot Tests", () => {
  function ItemCard({ item }: { item: typeof mockItem }) {
    return (
      <article className="card">
        <h2>{item.title}</h2>
        <p>{item.description}</p>
        <footer>
          <span className={`status status-${item.status}`}>{item.status}</span>
          <time dateTime={item.createdAt}>
            {new Date(item.createdAt).toLocaleDateString()}
          </time>
        </footer>
      </article>
    )
  }

  it("matches snapshot", () => {
    const { container } = render(<ItemCard item={mockItem} />)
    expect(container).toMatchSnapshot()
  })

  it("matches snapshot for draft status", () => {
    const draftItem = { ...mockItem, status: "draft" }
    const { container } = render(<ItemCard item={draftItem} />)
    expect(container).toMatchSnapshot()
  })
})
