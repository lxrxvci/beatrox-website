'use client'

import React, { useCallback, useState } from 'react'
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type EditorState,
  type LexicalEditor,
  type LexicalNode as BaseLexicalNode,
  type SerializedEditorState,
} from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $isHeadingNode,
} from '@lexical/rich-text'
import {
  ListNode,
  ListItemNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import {
  LinkNode,
  AutoLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import {
  UploadNode,
  RelationshipNode,
  BlockNode,
  InlineBlockNode,
} from '@payloadcms/richtext-lexical/client'

export type LexicalNode = BaseLexicalNode

const theme = {
  paragraph: 'mb-4',
  heading: {
    h2: 'heading-lg mb-4',
    h3: 'heading-md mb-3',
    h4: 'heading-sm mb-3 text-[var(--accent)]',
  },
  list: {
    ul: 'list-disc pl-6 mb-4',
    ol: 'list-decimal pl-6 mb-4',
    listitem: 'mb-2',
  },
  quote: 'border-l-2 border-[var(--accent)] pl-5 italic my-8 text-white',
  link: 'text-[var(--accent)] hover:underline',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'font-mono text-sm bg-white/10 px-1 rounded',
  },
}

function onError(error: Error) {
  console.error('Inline Lexical editor error:', error)
}

interface ToolbarProps {
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

function Toolbar({ onSave, onCancel, isSaving }: ToolbarProps) {
  const [editor] = useLexicalComposerContext()

  const toggleFormat = useCallback(
    (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
    },
    [editor],
  )

  const insertLink = useCallback(() => {
    const url = window.prompt('Enter URL')
    if (!url) return
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
      url,
      target: '_blank',
      rel: 'noopener noreferrer',
    })
  }, [editor])

  const insertList = useCallback(
    (type: 'bullet' | 'number') => {
      editor.dispatchCommand(
        type === 'bullet' ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
        undefined,
      )
    },
    [editor],
  )

  const toggleHeading = useCallback(
    (tag: 'h2' | 'h3' | 'h4') => {
      editor.update(() => {
        const selection = $getSelection()
        if (!$isRangeSelection(selection)) return
        const anchorNode = selection.anchor.getNode()
        const element = anchorNode.getTopLevelElementOrThrow()
        if ($isHeadingNode(element)) {
          const paragraph = $createParagraphNode()
          paragraph.append(...element.getChildren())
          element.replace(paragraph)
        } else {
          const heading = $createHeadingNode(tag)
          heading.append(...element.getChildren())
          element.replace(heading)
        }
      })
    },
    [editor],
  )

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--bg-elevated)] border border-white/10 rounded-sm mb-3">
      <ToolbarButton onClick={() => toggleFormat('bold')} label="B" />
      <ToolbarButton onClick={() => toggleFormat('italic')} label="I" italic />
      <ToolbarButton onClick={() => toggleFormat('underline')} label="U" underline />
      <ToolbarButton onClick={() => toggleFormat('strikethrough')} label="S" strike />
      <div className="w-px h-5 bg-white/20 mx-1" />
      <div className="w-px h-5 bg-white/20 mx-1" />
      <ToolbarButton onClick={() => toggleHeading('h2')} label="H2" />
      <ToolbarButton onClick={() => toggleHeading('h3')} label="H3" />
      <ToolbarButton onClick={() => toggleHeading('h4')} label="H4" />
      <div className="w-px h-5 bg-white/20 mx-1" />
      <ToolbarButton onClick={() => insertList('bullet')} label="• List" />
      <ToolbarButton onClick={() => insertList('number')} label="1. List" />
      <ToolbarButton onClick={insertLink} label="Link" />
      <div className="flex-1" />
      <button
        onClick={onCancel}
        disabled={isSaving}
        className="px-3 py-1.5 text-sm text-white hover:text-white transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-4 py-1.5 text-sm bg-[var(--accent)] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

function ToolbarButton({
  onClick,
  label,
  italic,
  underline,
  strike,
}: {
  onClick: () => void
  label: string
  italic?: boolean
  underline?: boolean
  strike?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-sm border border-white/20 text-white hover:bg-white/10 transition-colors ${
        italic ? 'italic' : ''
      } ${underline ? 'underline' : ''} ${strike ? 'line-through' : ''}`}
    >
      {label}
    </button>
  )
}

interface InlineLexicalEditorProps {
  initialValue: unknown
  onSave: (value: { root: LexicalNode }) => Promise<void>
  onCancel: () => void
}

export default function InlineLexicalEditor({
  initialValue,
  onSave,
  onCancel,
}: InlineLexicalEditorProps) {
  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const initialConfig = {
    namespace: 'InlineEditor',
    theme,
    onError,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      HorizontalRuleNode,
      UploadNode,
      RelationshipNode,
      BlockNode,
      InlineBlockNode,
    ],
    editorState: (editor: LexicalEditor) => {
      const rootValue = (initialValue as { root?: unknown } | null)?.root
      if (rootValue && typeof rootValue === 'object') {
        try {
          const state = editor.parseEditorState(JSON.stringify({ root: rootValue }))
          editor.setEditorState(state)
          return
        } catch (error) {
          console.error('Failed to parse initial Lexical state:', error)
        }
      }
      editor.update(() => {
        const root = $getRoot()
        const paragraph = $createParagraphNode()
        paragraph.append($createTextNode(''))
        root.append(paragraph)
      })
    },
  }

  const handleSave = useCallback(async () => {
    if (!editorState) return
    try {
      setIsSaving(true)
      const json = editorState.toJSON() as unknown as { root: LexicalNode }
      await onSave(json)
    } finally {
      setIsSaving(false)
    }
  }, [editorState, onSave])

  return (
    <div className="relative">
      <LexicalComposer initialConfig={initialConfig}>
        <Toolbar onSave={handleSave} onCancel={onCancel} isSaving={isSaving} />
        <div className="min-h-[120px] p-4 bg-black/40 border border-[var(--accent)]/50 rounded-sm">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="outline-none prose prose-invert max-w-none" />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <LinkPlugin />
          <ListPlugin />
          <OnChangePlugin onChange={setEditorState} />
        </div>
      </LexicalComposer>
    </div>
  )
}

function LexicalErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
