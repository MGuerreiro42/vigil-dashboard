import { PageLayout } from '@/components/layout/PageLayout'
import { NewsWidget } from '@/widgets/news/NewsWidget'

export function NewsPage() {
  return (
    <PageLayout>
      <NewsWidget isFocused />
    </PageLayout>
  )
}
