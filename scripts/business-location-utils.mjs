// Only complete US street addresses qualify; prose and city names do not.
export function extractBusinessAddresses(description = '') {
  const lines = description.split(/\r?\n/).map((line) => line.trim())
  const results = new Map()
  for (const [index, line] of lines.entries()) {
    const clean = line
      .replace(/^[^\p{L}\p{N}]*/u, '')
      .replace(/^(?:address|location|العنوان|عنوان)\s*:\s*/i, '')
    const match = clean.match(
      /^(\d{1,6}(?:-\d+)?\s+[A-Za-z][^\n]{3,140}?,?\s+([A-Z]{2})\s+(\d{5})(?:-\d{4})?)(?:\s|$)/,
    )
    if (
      !match ||
      !/^(?:AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)$/.test(
        match[2],
      )
    )
      continue
    const address = match[1]
    const previous = (lines[index - 1] ?? '').replace(/^[^\p{L}\p{N}]*/u, '')
    const name =
      previous.length > 2 &&
      previous.length < 90 &&
      /[A-Za-z]/.test(previous) &&
      !/https?:|www\.|phone|address|website|@|\d{5}/i.test(previous)
        ? previous
        : address
    results.set(address.toLowerCase(), { name, address, postcode: match[3] })
  }
  return [...results.values()]
}

export function isPreciseAddressMatch(candidate, result) {
  const address = result?.address
  const number = candidate.address.match(/^\S+/)?.[0].toLowerCase()
  const streetKey = (value) =>
    value
      .toLowerCase()
      .replace(/[.,]/g, '')
      .replace(
        /\b(?:north|south|east|west|street|avenue|road|boulevard|drive|lane|parkway|highway|place|court|terrace)\b/g,
        (word) =>
          ({
            north: 'n',
            south: 's',
            east: 'e',
            west: 'w',
            street: 'st',
            avenue: 'ave',
            road: 'rd',
            boulevard: 'blvd',
            drive: 'dr',
            lane: 'ln',
            parkway: 'pkwy',
            highway: 'hwy',
            place: 'pl',
            court: 'ct',
            terrace: 'ter',
          })[word],
      )
      .replace(/\s+/g, ' ')
      .trim()
  return Boolean(
    address?.country_code === 'us' &&
    address.house_number?.toLowerCase() === number &&
    address.postcode?.slice(0, 5) === candidate.postcode &&
    address.road &&
    streetKey(candidate.address.slice(number.length)).startsWith(
      `${streetKey(address.road)} `,
    ) &&
    result.lat != null &&
    result.lon != null &&
    Number.isFinite(Number(result.lat)) &&
    Math.abs(Number(result.lat)) <= 90 &&
    Number.isFinite(Number(result.lon)) &&
    Math.abs(Number(result.lon)) <= 180,
  )
}
