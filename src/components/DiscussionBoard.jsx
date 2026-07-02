import { useState, useEffect, useContext, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../App'

const ROLE_LABELS = {
  admin: 'Admin',
  fellow: 'Fellow',
  partner: 'Partner',
  team_member: 'Team Member',
}

const ROLE_COLORS = {
  admin: 'bg-navy text-white',
  fellow: 'bg-blue-600 text-white',
  partner: 'bg-amber-500 text-white',
  team_member: 'bg-emerald-600 text-white',
}

const TYPE_CONFIG = {
  story: { label: 'Experience', emoji: '💬', color: 'bg-purple-100 text-purple-700' },
  question: { label: 'Question', emoji: '❓', color: 'bg-amber-100 text-amber-700' },
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Avatar({ name, role }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const bg = {
    admin: '#0f172a', fellow: '#2563eb', partner: '#f59e0b', team_member: '#059669'
  }[role] || '#6b7280'
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  )
}

// ── Post composer ────────────────────────────────────────────────────────────
function PostComposer({ pageId, parentId = null, onPosted, onCancel, placeholder, autoFocus }) {
  const { userAccess } = useContext(AuthContext)
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState('story')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const textRef = useRef(null)

  useEffect(() => {
    if (autoFocus && textRef.current) textRef.current.focus()
  }, [autoFocus])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return
    if (!userAccess) return
    setSubmitting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('nook_discussions').insert({
      page_id: pageId,
      parent_id: parentId || null,
      user_id: user.id,
      author_name: userAccess.full_name || user.email,
      author_role: userAccess.nook_role || 'fellow',
      post_type: parentId ? 'story' : postType,
      content: content.trim(),
    })

    if (err) {
      setError('Could not post. Please try again.')
    } else {
      setContent('')
      onPosted?.()
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {!parentId && (
        <div className="flex gap-2">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
            <button
              key={type}
              type="button"
              onClick={() => setPostType(type)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all border
                ${postType === type
                  ? `${cfg.color} border-transparent`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
            >
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={textRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder || (postType === 'question'
          ? 'Ask a question about this SOP…'
          : 'Share how you used this SOP — what worked, what didn\'t…')}
        rows={3}
        maxLength={2000}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          placeholder:text-gray-400"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{content.length}/2000</span>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="text-xs bg-navy text-white px-4 py-1.5 rounded-lg font-medium
              hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Posting…' : parentId ? 'Reply' : 'Post'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Single post (recursive for thread) ──────────────────────────────────────
function Post({ post, allPosts, likedIds, onLike, onDelete, onRefresh, pageId, depth = 0 }) {
  const { userAccess, session } = useContext(AuthContext)
  const [showReply, setShowReply] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const isAdmin = userAccess?.nook_role === 'admin'
  const isOwn = session?.user?.id === post.user_id
  const canDelete = isAdmin || isOwn
  const liked = likedIds.has(post.id)

  const children = allPosts.filter(p => p.parent_id === post.id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const typeConf = TYPE_CONFIG[post.post_type] || TYPE_CONFIG.story

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100' : ''}`}>
      <div className="flex gap-3 py-3">
        <Avatar name={post.author_name} role={post.author_role} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-navy">{post.author_name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium
              ${ROLE_COLORS[post.author_role] || 'bg-gray-100 text-gray-600'}`}>
              {ROLE_LABELS[post.author_role] || post.author_role}
            </span>
            {depth === 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeConf.color}`}>
                {typeConf.emoji} {typeConf.label}
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{timeAgo(post.created_at)}</span>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2">
            {/* Like */}
            <button
              onClick={() => onLike(post.id, liked)}
              className={`flex items-center gap-1 text-xs transition-colors
                ${liked ? 'text-blue-600 font-medium' : 'text-gray-400 hover:text-blue-500'}`}
            >
              <svg className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.like_count > 0 && <span>{post.like_count}</span>}
            </button>

            {/* Reply */}
            <button
              onClick={() => setShowReply(r => !r)}
              className="text-xs text-gray-400 hover:text-navy transition-colors"
            >
              {showReply ? 'Cancel' : 'Reply'}
            </button>

            {/* Collapse thread */}
            {children.length > 0 && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-xs text-gray-400 hover:text-navy transition-colors ml-1"
              >
                {expanded ? `▾ ${children.length} repl${children.length === 1 ? 'y' : 'ies'}` : `▸ ${children.length} repl${children.length === 1 ? 'y' : 'ies'}`}
              </button>
            )}

            {/* Delete */}
            {canDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-xs text-gray-300 hover:text-red-500 transition-colors ml-auto"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply composer */}
          {showReply && (
            <div className="mt-3">
              <PostComposer
                pageId={pageId}
                parentId={post.id}
                autoFocus
                placeholder={`Reply to ${post.author_name.split(' ')[0]}…`}
                onPosted={() => { setShowReply(false); onRefresh() }}
                onCancel={() => setShowReply(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && children.map(child => (
        <Post
          key={child.id}
          post={child}
          allPosts={allPosts}
          likedIds={likedIds}
          onLike={onLike}
          onDelete={onDelete}
          onRefresh={onRefresh}
          pageId={pageId}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

// ── Main board ───────────────────────────────────────────────────────────────
export default function DiscussionBoard({ pageId }) {
  const { session } = useContext(AuthContext)
  const [posts, setPosts] = useState([])
  const [likedIds, setLikedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'story' | 'question'

  useEffect(() => {
    if (pageId) load()
  }, [pageId])

  async function load() {
    setLoading(true)

    // Fetch posts with like counts
    const { data: rawPosts } = await supabase
      .from('nook_discussions')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: true })

    if (!rawPosts) { setLoading(false); return }

    // Fetch like counts for all posts
    const postIds = rawPosts.map(p => p.id)
    const { data: likeCounts } = await supabase
      .from('nook_discussion_likes')
      .select('post_id')
      .in('post_id', postIds.length ? postIds : ['none'])

    const countMap = {}
    ;(likeCounts || []).forEach(l => {
      countMap[l.post_id] = (countMap[l.post_id] || 0) + 1
    })

    // Fetch which ones the current user liked
    const { data: { user } } = await supabase.auth.getUser()
    const { data: myLikes } = await supabase
      .from('nook_discussion_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds.length ? postIds : ['none'])

    setLikedIds(new Set((myLikes || []).map(l => l.post_id)))
    setPosts(rawPosts.map(p => ({ ...p, like_count: countMap[p.id] || 0 })))
    setLoading(false)
  }

  async function handleLike(postId, currentlyLiked) {
    const { data: { user } } = await supabase.auth.getUser()

    if (currentlyLiked) {
      await supabase.from('nook_discussion_likes')
        .delete().eq('post_id', postId).eq('user_id', user.id)
      setLikedIds(prev => { const s = new Set(prev); s.delete(postId); return s })
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: Math.max(0, p.like_count - 1) } : p))
    } else {
      await supabase.from('nook_discussion_likes')
        .insert({ post_id: postId, user_id: user.id })
      setLikedIds(prev => new Set([...prev, postId]))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, like_count: p.like_count + 1 } : p))
    }
  }

  async function handleDelete(postId) {
    if (!confirm('Delete this post?')) return
    await supabase.from('nook_discussions').delete().eq('id', postId)
    load()
  }

  if (!session) return null

  const rootPosts = posts.filter(p => !p.parent_id)
  const filtered = filter === 'all' ? rootPosts : rootPosts.filter(p => p.post_type === filter)
  const storyCount = rootPosts.filter(p => p.post_type === 'story').length
  const questionCount = rootPosts.filter(p => p.post_type === 'question').length

  return (
    <div className="mt-10 pt-8 border-t border-gray-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base font-bold text-navy">Community Notes</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Share how you've used this SOP in practice, or ask a question
          </p>
        </div>

        {/* Filter tabs */}
        {rootPosts.length > 0 && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: `All (${rootPosts.length})` },
              { key: 'story', label: `💬 Experiences (${storyCount})` },
              { key: 'question', label: `❓ Questions (${questionCount})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`text-xs px-3 py-1 rounded-md font-medium transition-all
                  ${filter === tab.key
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New post composer */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6">
        <PostComposer pageId={pageId} onPosted={load} />
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-sm">
            {rootPosts.length === 0
              ? 'No posts yet. Be the first to share an experience or ask a question.'
              : 'No posts in this category.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map(post => (
            <Post
              key={post.id}
              post={post}
              allPosts={posts}
              likedIds={likedIds}
              onLike={handleLike}
              onDelete={handleDelete}
              onRefresh={load}
              pageId={pageId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
