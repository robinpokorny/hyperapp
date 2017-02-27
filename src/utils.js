export function isPrimitive(type) {
  return type === "string" || type === "number" || type === "boolean"
}

export function merge(a, b) {
  var obj = {}, key

  if (isPrimitive(typeof b) || Array.isArray(b)) {
    return b
  }

  for (key in a) {
    obj[key] = a[key]
  }
  for (key in b) {
    obj[key] = b[key]
  }

  return obj
}
