import { useState, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function NotionRenderer({ pageId }) {
  const [html, setHtml] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setHtml(null)
    setError(null)

    // Check sessionStorage cache first
    const cached = sessionStorage.getItem(`notion-${pageId}`)
    if (cached) {
      setHtml(cached)
      setLoading(false)
      return
    }

    fetch(`/api/notion-fetch?id=${pageId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        sessionStorage.setItem(`notion-${pageId}`, data.html)
        setHtml(data.html)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [pageId])

  if (loading) return <LoadingSpinner text="Loading content from Notion..." />
  if (error) return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
      <p className="text-red-600 font-medium mb-1">Failed to load content</p>
      <p className="text-red-400 text-sm">{error}</p>
    </div>
  )

  return (
    <div
      className="notion-content max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
