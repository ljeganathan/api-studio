export default function ResponseBody({ body }) {
  let pretty = body
  try {
    pretty = JSON.stringify(JSON.parse(body), null, 2)
  } catch {
    // not JSON — show raw text
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <pre className="font-mono text-sm text-green-300 whitespace-pre-wrap break-all">{pretty}</pre>
    </div>
  )
}
