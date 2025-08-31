export default function MessageBubble({ m, mine }: { m: any, mine?: boolean }) {
return (
<div className={`max-w-xs p-2 rounded-lg my-1 ${mine ? 'self-end bg-indigo-600' : 'self-start bg-slate-700'}`}>
<div className="text-sm font-semibold">{m.username ?? 'anon'}</div>
<div className="text-sm mt-1">{m.content}</div>
</div>
)
}