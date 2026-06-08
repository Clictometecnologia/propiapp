export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg"></div>
      <div className="h-4 w-32 bg-muted rounded-md mt-2"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[1,2,3,4].map((i) => (
          <div key={i} className="h-24 bg-card border border-border rounded-2xl p-5">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-8 bg-muted rounded-lg w-full mt-3"></div>
          </div>
        ))}
      </div>
    </div>
  )
}