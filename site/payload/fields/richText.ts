import type { RichTextField } from 'payload'
import {
  lexicalEditor,
  ParagraphFeature,
  HeadingFeature,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  InlineCodeFeature,
  SuperscriptFeature,
  SubscriptFeature,
  AlignFeature,
  UnorderedListFeature,
  OrderedListFeature,
  ChecklistFeature,
  BlockquoteFeature,
  HorizontalRuleFeature,
  LinkFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

export interface RichTextFieldOptions {
  name?: string
  required?: boolean
  label?: string
  admin?: RichTextField['admin']
  minimal?: boolean
}

export function createRichTextField(options: RichTextFieldOptions = {}): RichTextField {
  const { name = 'body', required = false, label, admin, minimal = false } = options

  const baseFeatures = () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature({
      enabledCollections: ['pages', 'projects', 'services', 'case-studies'],
    }),
  ]

  const fullFeatures = () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    InlineCodeFeature(),
    SuperscriptFeature(),
    SubscriptFeature(),
    AlignFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    ChecklistFeature(),
    BlockquoteFeature(),
    HorizontalRuleFeature(),
    LinkFeature({
      enabledCollections: ['pages', 'projects', 'services', 'case-studies'],
      fields: [
        {
          name: 'rel',
          type: 'select',
          options: ['nofollow', 'noopener', 'noreferrer'],
        },
      ],
    }),
    UploadFeature({
      collections: {
        media: {
          fields: [
            {
              name: 'caption',
              type: 'text',
            },
          ],
        },
      },
    }),
  ]

  return {
    name,
    type: 'richText',
    label,
    required,
    editor: lexicalEditor({
      features: minimal ? baseFeatures : fullFeatures,
    }),
    admin,
  }
}
