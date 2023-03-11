export function arrayParameters(numParams: number, startIdx = 1): string {
  const endIdx = (startIdx + numParams)
  let result = ''
  for (let i = startIdx; i < endIdx; i++) {
    result += `?${i}`
    if (i < (endIdx - 1)) result += ', '
  }
  return result
}
