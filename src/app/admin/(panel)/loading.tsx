export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4" aria-busy="true">
      <div className="h-9 w-56 rounded skeleton" />
      <div className="h-40 rounded-xl skeleton" />
      <div className="h-64 rounded-xl skeleton" />
    </div>
  );
}
