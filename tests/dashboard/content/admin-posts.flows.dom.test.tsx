import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn()
}))

import { apiFetch } from '@/lib/api'
vi.mock('@/components/PermissionGate', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</>, PermissionGate: ({ children }: any) => <>{children}</> }))
import AdminPostsPage from '@/app/admin/posts/page'

function mockJson(data: any) { return { ok: true, json: async () => data } }

describe('Admin Posts CRUD flows', () => {
  beforeEach(() => { (apiFetch as unknown as vi.Mock).mockReset() })

  it('creates a new post via modal', async () => {
    ;(apiFetch as any)
      .mockResolvedValueOnce(mockJson({ posts: [] })) // initial load
      .mockResolvedValueOnce(mockJson({})) // POST /api/posts
      .mockResolvedValueOnce(mockJson({ posts: [{ id: '1', title: 'My Post', slug: 'my-post', content: 'hello world content with enough length to pass validation '.repeat(5), excerpt: '', published: false, featured: false, tags: [], status: 'DRAFT', priority: 'LOW', updatedAt: new Date().toISOString(), version: 1 }] })) // reload

    const { container, unmount } = render(<AdminPostsPage />)
    try {
      // open create modal
      const createBtn = screen.getByText('Create Post')
      fireEvent.click(createBtn)

      // fill form
      const title = screen.getByPlaceholderText('Enter post title...') as HTMLInputElement
      const slug = screen.getByPlaceholderText('post-url-slug') as HTMLInputElement
      const content = screen.getByPlaceholderText(/Write your professional blog content/i) as HTMLTextAreaElement

      fireEvent.change(title, { target: { value: 'My Post' } })
      fireEvent.change(slug, { target: { value: 'my-post' } })
      fireEvent.change(content, { target: { value: 'hello world content with enough length to pass validation '.repeat(5) } })

      const createButtons = screen.getAllByText('Create Post')
      fireEvent.click(createButtons[createButtons.length - 1])

      // assertions
      const calls = (apiFetch as any).mock.calls.map((c: any[]) => c[0])
      expect(calls[0]).toContain('/api/posts') // initial GET
      expect(calls.some((u: string) => u === '/api/posts')).toBeTruthy() // POST uses same path, but with method; ensure at least two calls
      expect(calls.filter((u: string) => u === '/api/posts').length).toBeGreaterThan(1)
    } finally { unmount() }
  })

  it('edits an existing post', async () => {
    const existing = { id: '1', title: 'Original', slug: 'original', content: 'original content content content content content', excerpt: '', published: false, featured: false, tags: [], status: 'DRAFT', priority: 'LOW', updatedAt: new Date().toISOString(), version: 1 }
    ;(apiFetch as any)
      .mockResolvedValueOnce(mockJson({ posts: [existing] })) // initial load
      .mockResolvedValueOnce(mockJson({})) // PUT
      .mockResolvedValueOnce(mockJson({ posts: [{ ...existing, title: 'Updated' }] })) // reload

    const { container, unmount } = render(<AdminPostsPage />)
    try {
      const editBtn = screen.getByText('Edit')
      fireEvent.click(editBtn)

      const title = screen.getByDisplayValue('Original') as HTMLInputElement
      fireEvent.change(title, { target: { value: 'Updated' } })

      const update = Array.from(container.querySelectorAll('button')).find(b => (b.textContent || '').includes('Update Post')) as HTMLButtonElement
      fireEvent.click(update)

      const calls = (apiFetch as any).mock.calls
      const putCall = calls.find(([, init]: any[]) => init && init.method === 'PUT')
      expect(putCall && putCall[0]).toContain('/api/posts/original')
    } finally { unmount() }
  })

  it('deletes an existing post', async () => {
    const existing = { id: '1', title: 'To Delete', slug: 'to-delete', content: 'content '.repeat(50), excerpt: '', published: false, featured: false, tags: [], status: 'DRAFT', priority: 'LOW', updatedAt: new Date().toISOString(), version: 1 }
    ;(apiFetch as any)
      .mockResolvedValueOnce(mockJson({ posts: [existing] })) // initial
      .mockResolvedValueOnce(mockJson({})) // DELETE
      .mockResolvedValueOnce(mockJson({ posts: [] })) // reload

    const { container, unmount } = render(<AdminPostsPage />)
    try {
      const deleteBtn = screen.getByLabelText('Delete post')
      fireEvent.click(deleteBtn)

      const confirmDelete = screen.getByText('Delete Post')
      fireEvent.click(confirmDelete)

      const calls = (apiFetch as any).mock.calls
      const delCall = calls.find(([, init]: any[]) => init && init.method === 'DELETE')
      expect(delCall && delCall[0]).toContain('/api/posts/to-delete')
    } finally { unmount() }
  })
})
