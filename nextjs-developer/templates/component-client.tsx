/**
 * Client Component Template
 *
 * This template demonstrates a Client Component with:
 * - State management (useState, useReducer)
 * - Side effects (useEffect)
 * - Event handlers
 * - Form handling
 * - Custom hooks
 * - Composition with Server Components
 *
 * Use Client Components when you need:
 * - Interactivity (onClick, onChange, etc.)
 * - State (useState, useReducer)
 * - Effects (useEffect, useLayoutEffect)
 * - Browser APIs (window, localStorage, etc.)
 * - Custom hooks that use state/effects
 *
 * Usage:
 * 1. Copy to components/[name].tsx
 * 2. Replace COMPONENT_NAME with your component name
 * 3. Implement your interactive logic
 *
 * Location: components/[component-name].tsx
 */

"use client"

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useTransition,
  forwardRef,
  type FormEvent,
  type ChangeEvent,
  type KeyboardEvent,
} from "react"
import { useRouter, useSearchParams } from "next/navigation"

// ============================================================================
// TYPES
// ============================================================================

interface Item {
  id: string
  name: string
  completed: boolean
  priority: "low" | "medium" | "high"
}

interface COMPONENT_NAMEProps {
  initialItems?: Item[]
  onItemsChange?: (items: Item[]) => void
  className?: string
  disabled?: boolean
}

type FilterType = "all" | "active" | "completed"
type SortType = "name" | "priority" | "none"

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Custom hook for managing local storage
 */
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue] as const
}

/**
 * Custom hook for debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Custom hook for keyboard shortcuts
 */
function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      const matchesKey = event.key.toLowerCase() === key.toLowerCase()
      const matchesCtrl = modifiers.ctrl ? event.ctrlKey || event.metaKey : true
      const matchesShift = modifiers.shift ? event.shiftKey : true
      const matchesAlt = modifiers.alt ? event.altKey : true

      if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [key, callback, modifiers])
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Input component for adding items
 */
const ItemInput = forwardRef<
  HTMLInputElement,
  {
    value: string
    onChange: (value: string) => void
    onSubmit: () => void
    disabled?: boolean
    placeholder?: string
  }
>(function ItemInput({ value, onChange, onSubmit, disabled, placeholder }, ref) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <input
      ref={ref}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={placeholder || "Add new item..."}
      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
    />
  )
})

/**
 * Priority select component
 */
function PrioritySelect({
  value,
  onChange,
}: {
  value: Item["priority"]
  onChange: (priority: Item["priority"]) => void
}) {
  const priorities: { value: Item["priority"]; label: string; color: string }[] = [
    { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-red-100 text-red-800" },
  ]

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Item["priority"])}
      className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {priorities.map((p) => (
        <option key={p.value} value={p.value}>
          {p.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Single item component
 */
function ItemRow({
  item,
  onToggle,
  onDelete,
  onPriorityChange,
}: {
  item: Item
  onToggle: () => void
  onDelete: () => void
  onPriorityChange: (priority: Item["priority"]) => void
}) {
  const priorityColors = {
    low: "border-l-green-500",
    medium: "border-l-yellow-500",
    high: "border-l-red-500",
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg border-l-4 ${priorityColors[item.priority]} hover:shadow-sm transition-shadow`}
    >
      <input
        type="checkbox"
        checked={item.completed}
        onChange={onToggle}
        className="w-5 h-5 rounded border-gray-300"
      />

      <span
        className={`flex-1 ${item.completed ? "line-through text-gray-400" : ""}`}
      >
        {item.name}
      </span>

      <PrioritySelect value={item.priority} onChange={onPriorityChange} />

      <button
        onClick={onDelete}
        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Delete item"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
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
  filter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts: Record<FilterType, number>
}) {
  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ]

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onFilterChange(tab.key)}
          className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filter === tab.key
              ? "bg-white shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab.label} ({counts[tab.key]})
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Interactive item list component (Client Component)
 *
 * Features:
 * - Add, toggle, delete items
 * - Filter by status
 * - Sort by priority or name
 * - Search/filter items
 * - Persist to localStorage
 * - Keyboard shortcuts
 */
export function COMPONENT_NAME({
  initialItems = [],
  onItemsChange,
  className = "",
  disabled = false,
}: COMPONENT_NAMEProps) {
  // State
  const [items, setItems] = useLocalStorage<Item[]>("items", initialItems)
  const [newItemName, setNewItemName] = useState("")
  const [filter, setFilter] = useState<FilterType>("all")
  const [sortBy, setSortBy] = useState<SortType>("none")
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Keyboard shortcut: Ctrl+N to focus input
  useKeyboardShortcut("n", () => inputRef.current?.focus(), { ctrl: true })

  // Sync filter with URL
  useEffect(() => {
    const urlFilter = searchParams.get("filter") as FilterType | null
    if (urlFilter && ["all", "active", "completed"].includes(urlFilter)) {
      setFilter(urlFilter)
    }
  }, [searchParams])

  // Notify parent of changes
  useEffect(() => {
    onItemsChange?.(items)
  }, [items, onItemsChange])

  // Computed values
  const counts = useMemo(
    () => ({
      all: items.length,
      active: items.filter((i) => !i.completed).length,
      completed: items.filter((i) => i.completed).length,
    }),
    [items]
  )

  const filteredItems = useMemo(() => {
    let result = items

    // Apply status filter
    if (filter === "active") {
      result = result.filter((i) => !i.completed)
    } else if (filter === "completed") {
      result = result.filter((i) => i.completed)
    }

    // Apply search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      result = result.filter((i) => i.name.toLowerCase().includes(query))
    }

    // Apply sorting
    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      result = [...result].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      )
    }

    return result
  }, [items, filter, debouncedSearch, sortBy])

  // Handlers
  const handleAddItem = useCallback(() => {
    if (!newItemName.trim() || disabled) return

    const newItem: Item = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      completed: false,
      priority: "medium",
    }

    setItems((prev) => [...prev, newItem])
    setNewItemName("")
    inputRef.current?.focus()
  }, [newItemName, disabled, setItems])

  const handleToggleItem = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      )
    },
    [setItems]
  )

  const handleDeleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id))
    },
    [setItems]
  )

  const handlePriorityChange = useCallback(
    (id: string, priority: Item["priority"]) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, priority } : item))
      )
    },
    [setItems]
  )

  const handleFilterChange = useCallback(
    (newFilter: FilterType) => {
      setFilter(newFilter)
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.set("filter", newFilter)
        router.push(`?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  const handleClearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((item) => !item.completed))
  }, [setItems])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Items</h2>
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="none">No sorting</option>
            <option value="name">Sort by name</option>
            <option value="priority">Sort by priority</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search items..."
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Add Item */}
      <div className="flex gap-2">
        <ItemInput
          ref={inputRef}
          value={newItemName}
          onChange={setNewItemName}
          onSubmit={handleAddItem}
          disabled={disabled}
        />
        <button
          onClick={handleAddItem}
          disabled={disabled || !newItemName.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Filters */}
      <FilterTabs
        filter={filter}
        onFilterChange={handleFilterChange}
        counts={counts}
      />

      {/* Item List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            {searchQuery
              ? "No items match your search"
              : filter === "completed"
                ? "No completed items"
                : filter === "active"
                  ? "No active items"
                  : "No items yet. Add one above!"}
          </p>
        ) : (
          filteredItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              onToggle={() => handleToggleItem(item.id)}
              onDelete={() => handleDeleteItem(item.id)}
              onPriorityChange={(priority) =>
                handlePriorityChange(item.id, priority)
              }
            />
          ))
        )}
      </div>

      {/* Footer */}
      {counts.completed > 0 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-sm text-gray-500">
            {counts.completed} completed item{counts.completed !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleClearCompleted}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Clear completed
          </button>
        </div>
      )}

      {/* Pending indicator */}
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Updating...
        </div>
      )}
    </div>
  )
}

// Export as default
export default COMPONENT_NAME
