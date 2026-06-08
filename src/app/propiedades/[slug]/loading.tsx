export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="h-[420px] w-full bg-muted rounded-2xl"></div>
        </div>
    </div>
  </div>
  )
}
