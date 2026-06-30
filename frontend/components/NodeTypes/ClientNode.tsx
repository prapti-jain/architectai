'use client'

import { BaseNode } from './BaseNode'

export function ClientNode(props: React.ComponentProps<typeof BaseNode>) {
  return <BaseNode {...props} />
}
