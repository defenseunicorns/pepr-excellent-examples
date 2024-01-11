// Refs:
// - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates

export function heredoc(strings, ...values) {
  // shuffle strings & expression values back together
  const zipped = strings.reduce((acc, cur, idx) => {
    acc.push(cur, values[idx] || '')
    return acc
  }, []).filter(x => x)

  // rebuild as line-oriented
  const asLines = zipped.join('').split(/[\r\n]+/)

  // strip whitespace-only first & last lines 
  asLines[0].trim().length === 0 ? asLines.shift() : null
  asLines.slice(-1)[0].trim().length === 0 ? asLines.pop() : null

  // find smallest indent
  const indent = asLines.reduce((acc, cur) => {
    const firstAt = cur.search(/\S/)
    return Math.min(firstAt !== -1 ? firstAt : Number.POSITIVE_INFINITY, acc)
   }, Number.POSITIVE_INFINITY)

  // de-indent all lines
  const snipped = asLines.map(line => {
    if (line.length < indent) { return "" }
    return line.slice(indent)
  })

  // rejoin into multiline string
  return snipped.join("\n")
}