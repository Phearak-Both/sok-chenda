export default function Loading() {
  return (
    <div className="container-x pb-24 pt-16" aria-busy="true">
      <div className="mx-auto h-12 w-64 skeleton" />
      <div className="mt-16 grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] skeleton" />
            <div className="mt-4 h-5 w-3/4 skeleton" />
            <div className="mt-2 h-4 w-1/3 skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}
