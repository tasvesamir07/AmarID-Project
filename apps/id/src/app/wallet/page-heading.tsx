export function PageHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="max-w-2xl space-y-1.5">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {body && <p className="text-ink-2">{body}</p>}
    </div>
  );
}
