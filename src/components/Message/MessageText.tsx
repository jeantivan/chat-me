export function MessageText({ content }: { content: string }) {
  return (
    <div className="py-1 px-2">
      <div className="whitespace-pre-wrap break-all leading-tight">
        {content}
      </div>
    </div>
  );
}
