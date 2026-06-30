'use client'

import { BaseNode } from './BaseNode'

export function CacheNode(props: React.ComponentProps<typeof BaseNode>) {
  return <BaseNode {...props} />
}
