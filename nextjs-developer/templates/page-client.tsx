/**
 * Client Component Page Template
 *
 * This template demonstrates a Client Component page with:
 * - Interactive state management
 * - Event handlers
 * - Client-side data fetching
 * - Form handling
 * - Browser APIs
 *
 * Usage:
 * 1. Copy to app/[route]/page.tsx
 * 2. Replace PAGE_NAME with your page name
 * 3. Implement your interactive logic
 *
 * Note: Only use Client Components when you need:
 * - useState, useEffect, or other hooks
 * - Event handlers (onClick, onChange, etc.)
 * - Browser APIs (window, localStorage, etc.)
 *
 * Location: app/[route-name]/page.tsx
 */

"use client"

import { useState, useEffect, useCallback, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// ============================================================================
// TYPES
// ============================================================================

interface Item {
  id: string
  title: string
  completed: boolean
}

interface FormData {
  title: string
  description: string
}

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Custom hook for managing items with localStorage persistence
 */
function useItems(initialItems: Item[] = []) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [isLoading, setIsLoading] = useState(true)

  // Load items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("items")
    if (stored) {
      setItems(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  // Save items to localStorage when changed
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("items", JSON.stringify(items))
    }
  }, [items, isLoading])

  const addItem = useCallback((title: string) => {
    const newItem: Item = {
      id: crypto.randomUUID(),
      title,
      completed: false,
    }
    setItems((prev) => [...prev, newItem])
  }, [])

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return { items, isLoading, addItem, toggleItem, removeItem }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Form component for adding new items
 */
function AddItemForm({
  onSubmit,
}: {
  onSubmit: (title: string) => void
}) {
  const [title, setTitle] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onSubmit(title.trim())
      setTitle("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add new item..."
        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={!title.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Add
      </button>
    </form>
  )
}

/**
 * Item list component
 */
function ItemList({
  items,
  onToggle,
  onRemove,
}: {
  items: Item[]
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items yet. Add one above!
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
        >
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => onToggle(item.id)}
            className="w-5 h-5 rounded"
          />
          <span
            className={`flex-1 ${
              item.completed ? "line-through text-gray-400" : ""
            }`}
          >
            {item.title}
          </span>
          <button
            onClick={() => onRemove(item.id)}
            className="px-2 py-1 text-red-500 hover:bg-red-50 rounded"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * Filter tabs component
 */
function FilterTabs({
  filter,
  onFilterChange,
  counts,
}: {
  filter: "all" | "active" | "completed"
  onFilterChange: (filter: "all" | "active" | "completed") => void
  counts: { all: number; active: number; completed: number }
}) {
  const tabs = [
    { key: "all" as const, label: "All", count: counts.all },
    { key: "active" as const, label: "Active", count: counts.active },
    { key: "completed" as const, label: "Completed", count: counts.completed },
  ]

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onFilterChange(tab.key)}
          className={`px-4 py-2 rounded-lg ${
            filter === tab.key
              ? "bg-blue-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * Main page component (Client Component)
 *
 * Use Client Components when you need:
 * - Interactivity (event handlers)
 * - State (useState, useReducer)
 * - Effects (useEffect)
 * - Browser APIs
 * - Custom hooks with state/effects
 */
export default function PAGE_NAMEPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State management
  const { items, isLoading, addItem, toggleItem, removeItem } = useItems()
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all")
  const [isPending, startTransition] = useTransition()

  // Filtered items
  const filteredItems = items.filter((item) => {
    if (filter === "active") return !item.completed
    if (filter === "completed") return item.completed
    return true
  })

  // Item counts
  const counts = {
    all: items.length,
    active: items.filter((i) => !i.completed).length,
    completed: items.filter((i) => i.completed).length,
  }

  // Handle filter change with URL update
  const handleFilterChange = (newFilter: "all" | "active" | "completed") => {
    setFilter(newFilter)
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("filter", newFilter)
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  // Initialize filter from URL
  useEffect(() => {
    const urlFilter = searchParams.get("filter")
    if (urlFilter === "active" || urlFilter === "completed") {
      setFilter(urlFilter)
    }
  }, [searchParams])

  // Loading state
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-12 bg-gray-200 rounded mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold">PAGE_NAME</h1>
        <p className="text-gray-600 mt-2">
          Interactive page with client-side state management
        </p>
      </header>

      {/* Add Item Form */}
      <section className="mb-6">
        <AddItemForm onSubmit={addItem} />
      </section>

      {/* Filter Tabs */}
      <section className="mb-4">
        <FilterTabs
          filter={filter}
          onFilterChange={handleFilterChange}
          counts={counts}
        />
      </section>

      {/* Item List */}
      <section>
        <ItemList
          items={filteredItems}
          onToggle={toggleItem}
          onRemove={removeItem}
        />
      </section>

      {/* Status */}
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
          Updating...
        </div>
      )}
    </main>
  )
}
