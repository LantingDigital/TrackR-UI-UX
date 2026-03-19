import { Suspense } from 'react';
import EditArticlePage from '@/components/EditArticlePage';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl">
        <div className="h-8 w-48 bg-page rounded animate-pulse mb-6" />
        <div className="h-12 w-full bg-page rounded animate-pulse mb-4" />
        <div className="h-64 w-full bg-page rounded animate-pulse" />
      </div>
    }>
      <EditArticlePage />
    </Suspense>
  );
}
