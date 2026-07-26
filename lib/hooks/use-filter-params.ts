"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"

const SEARCH_DEBOUNCE_MS = 350

/**
 * Shared filter-bar behaviour for the list screens.
 *
 * Two things matter for perceived speed here:
 *  - the search box is debounced, so a 12-character query costs one server
 *    round-trip instead of twelve (each one re-runs the list query);
 *  - navigation runs inside a transition, so `pending` can dim the current
 *    results instead of the screen sitting frozen with stale rows.
 *
 * Current values are read straight from the URL rather than passed down from the
 * server, which keeps the filter bar renderable before any query resolves.
 */
export function useFilterParams(basePath: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const urlQuery = searchParams.get("q") ?? ""
  const [query, setQuery] = useState(urlQuery)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The last value this component itself put into the URL. Used to tell our own
  // debounced push apart from an external URL change. State, not a ref, because
  // it is read during render.
  const [ownedQuery, setOwnedQuery] = useState(urlQuery)
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery)

  // Adjust state during render (not in an effect) when the URL changes from
  // outside — back/forward, or a link carrying ?q=. Our own debounced push is
  // skipped, otherwise a slow round-trip would overwrite newer keystrokes.
  if (seenUrlQuery !== urlQuery) {
    setSeenUrlQuery(urlQuery)
    if (urlQuery !== ownedQuery) {
      setOwnedQuery(urlQuery)
      setQuery(urlQuery)
    }
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const push = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString()
      startTransition(() => {
        router.push(qs ? `${basePath}?${qs}` : basePath)
      })
    },
    [basePath, router],
  )

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      push(params)
    },
    [push, searchParams],
  )

  const toggleParam = useCallback(
    (key: string, value: string) => {
      setParam(key, searchParams.get(key) === value ? "all" : value)
    },
    [searchParams, setParam],
  )

  const setSearch = useCallback(
    (value: string) => {
      setQuery(value)
      setOwnedQuery(value)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setParam("q", value), SEARCH_DEBOUNCE_MS)
    },
    [setParam],
  )

  const clearSearch = useCallback(() => {
    setQuery("")
    setOwnedQuery("")
    if (timer.current) clearTimeout(timer.current)
    setParam("q", "")
  }, [setParam])

  return {
    get: (key: string) => searchParams.get(key) ?? undefined,
    query,
    setSearch,
    clearSearch,
    setParam,
    toggleParam,
    pending,
  }
}
