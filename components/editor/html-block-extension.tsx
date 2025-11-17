'use client'

import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'

// Custom HTML Block Node - Preserves inline styles
export const HTMLBlock = Node.create({
  name: 'htmlBlock',

  group: 'block',

  atom: true, // Treat as single unit (non-editable)

  addAttributes() {
    return {
      html: {
        default: '',
        parseHTML: element => element.getAttribute('data-html-content') || '',
        renderHTML: attributes => {
          return {
            'data-html-content': attributes.html,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-html-block]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-html-block': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(HTMLBlockComponent)
  },
})

// React component to render HTML block
function HTMLBlockComponent({ node }: any) {
  return (
    <NodeViewWrapper className="html-block-wrapper">
      <div
        className="html-block-content"
        dangerouslySetInnerHTML={{ __html: node.attrs.html }}
      />
    </NodeViewWrapper>
  )
}

