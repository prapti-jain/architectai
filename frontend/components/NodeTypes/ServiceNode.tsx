'use client'

import { BaseNode } from './BaseNode'

export function ServiceNode(props: React.ComponentProps<typeof BaseNode>) {
  return <BaseNode {...props} />
}
