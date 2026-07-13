const stateAbbreviations = new Map([
  ['Alabama', 'AL'],
  ['Alaska', 'AK'],
  ['Arizona', 'AZ'],
  ['Arkansas', 'AR'],
  ['California', 'CA'],
  ['Colorado', 'CO'],
  ['Connecticut', 'CT'],
  ['Delaware', 'DE'],
  ['Florida', 'FL'],
  ['Georgia', 'GA'],
  ['Hawaii', 'HI'],
  ['Idaho', 'ID'],
  ['Illinois', 'IL'],
  ['Indiana', 'IN'],
  ['Iowa', 'IA'],
  ['Kansas', 'KS'],
  ['Kentucky', 'KY'],
  ['Louisiana', 'LA'],
  ['Maine', 'ME'],
  ['Maryland', 'MD'],
  ['Massachusetts', 'MA'],
  ['Michigan', 'MI'],
  ['Minnesota', 'MN'],
  ['Mississippi', 'MS'],
  ['Missouri', 'MO'],
  ['Montana', 'MT'],
  ['Nebraska', 'NE'],
  ['Nevada', 'NV'],
  ['New Hampshire', 'NH'],
  ['New Jersey', 'NJ'],
  ['New Mexico', 'NM'],
  ['New York', 'NY'],
  ['North Carolina', 'NC'],
  ['North Dakota', 'ND'],
  ['Ohio', 'OH'],
  ['Oklahoma', 'OK'],
  ['Oregon', 'OR'],
  ['Pennsylvania', 'PA'],
  ['Rhode Island', 'RI'],
  ['South Carolina', 'SC'],
  ['South Dakota', 'SD'],
  ['Tennessee', 'TN'],
  ['Texas', 'TX'],
  ['Utah', 'UT'],
  ['Vermont', 'VT'],
  ['Virginia', 'VA'],
  ['Washington', 'WA'],
  ['West Virginia', 'WV'],
  ['Wisconsin', 'WI'],
  ['Wyoming', 'WY'],
])

const stateNamesByAbbreviation = new Map(
  [...stateAbbreviations.entries()].map(([state, abbreviation]) => [
    abbreviation.toLowerCase(),
    state,
  ]),
)

const cityAliases = {
  'New York City': ['nyc', 'new york city', 'مدينة نيويورك', 'نيويورك سيتي'],
  Brooklyn: ['بروكلين'],
  Queens: ['كوينز'],
  'The Bronx': ['bronx', 'برونكس', 'ذا برونكس'],
  Chicago: ['شيكاغو', 'شيكاگو'],
  Tampa: ['تامبا'],
  Miami: ['ميامي'],
  Dearborn: ['ديربورن', 'ديربورن هايتس'],
  'San Francisco': ['سان فرانسيسكو'],
  'Los Angeles': ['la', 'l.a.', 'los angeles', 'لوس أنجلوس', 'لوس انجلس'],
  'San Diego': ['سان دييغو', 'سان دييجو'],
  Raleigh: ['رالي'],
  Atlanta: ['أتلانتا', 'اتلانتا'],
  Houston: ['هيوستن'],
  Dallas: ['دالاس'],
  Columbus: ['كولومبوس', 'كولمبوس', 'كولومبس'],
}

const stateAliases = {
  California: ['كاليفورنيا'],
  Florida: ['فلوريدا'],
  Michigan: ['ميشيغان', 'مشغن'],
  Illinois: ['إلينوي', 'الينوي', 'إلينويز'],
  'New York': ['نيويورك', 'نيو يورك'],
  'North Carolina': ['كارولاينا الشمالية', 'نورث كارولاينا'],
  Georgia: ['جورجيا'],
  Texas: ['تكساس'],
  Ohio: ['أوهايو', 'اوهايو'],
}

const detectedCityAliases = {
  Columbus: ['columbus', 'كولومبوس', 'كولمبوس', 'كولومبس'],
  Dublin: ['dublin'],
  Hilliard: ['hilliard'],
  Marysville: ['marysville'],
  Reynoldsburg: ['reynoldsburg'],
  Cleveland: ['cleveland'],
  Cincinnati: ['cincinnati'],
  Toledo: ['toledo'],
  Dayton: ['dayton'],
  Akron: ['akron'],
}

const roadWords = [
  'street',
  'st',
  'avenue',
  'ave',
  'road',
  'rd',
  'boulevard',
  'blvd',
  'drive',
  'dr',
  'lane',
  'ln',
  'court',
  'ct',
  'highway',
  'hwy',
  'suite',
  'ste',
  'شارع',
  'العنوان',
  'عنوان',
]

const normalizeArabic = (value) =>
  value
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')

export const normalizeLocationText = (value = '') =>
  normalizeArabic(String(value))
    .replace(/[–—]/g, '-')
    .replace(/[،]/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const hasTerm = (haystack, term) => {
  const normalizedTerm = normalizeLocationText(term)
  if (!normalizedTerm) return false
  if (/^[a-z0-9 .-]+$/.test(normalizedTerm)) {
    return new RegExp(
      `(^|[^a-z0-9])${escapeRegex(normalizedTerm)}([^a-z0-9]|$)`,
      'i',
    ).test(haystack)
  }

  return haystack.includes(normalizedTerm)
}

const aliasesForCity = (city) => [city, ...(cityAliases[city] ?? [])]

const aliasesForState = (state) =>
  [state, stateAbbreviations.get(state), ...(stateAliases[state] ?? [])].filter(
    Boolean,
  )

const canonicalStateName = (value = '') => {
  const normalized = String(value).trim()
  if (!normalized) return ''
  const normalizedText = normalizeLocationText(normalized)

  const stateName = [...stateAbbreviations.keys()].find(
    (state) => normalizeLocationText(state) === normalizedText,
  )
  if (stateName) return stateName

  const aliasState = Object.entries(stateAliases).find(([, aliases]) =>
    aliases.some((alias) => normalizeLocationText(alias) === normalizedText),
  )?.[0]
  if (aliasState) return aliasState

  return stateNamesByAbbreviation.get(normalizedText) ?? ''
}

const canonicalCityName = (value = '') => {
  const normalizedText = normalizeLocationText(value)
  if (!normalizedText) return ''

  const aliasCity = Object.entries(detectedCityAliases).find(
    ([city, aliases]) =>
      [city, ...aliases].some(
        (alias) => normalizeLocationText(alias) === normalizedText,
      ),
  )?.[0]
  if (aliasCity) return aliasCity

  return String(value)
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const distanceMiles = (a, b) => {
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const earthRadiusMiles = 3958.8
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h))
}

const placeMatcher = (places) =>
  places.map((place) => ({
    ...place,
    cityAliases: aliasesForCity(place.city),
    stateAliases: aliasesForState(place.state),
  }))

const stateOnlyMatch = (text, places) => {
  const states = [...new Set(places.map((place) => place.state))]
  const matchedState = states.find((state) =>
    aliasesForState(state).some((alias) => hasTerm(text, alias)),
  )

  return matchedState
    ? {
        matchedText: matchedState,
        city: '',
        state: matchedState,
        source: 'description-state-match',
        confidence: 0.55,
      }
    : null
}

export const inferKnownPlaceFromText = (input, places) => {
  const text = normalizeLocationText(input)
  const matchablePlaces = placeMatcher(places)

  for (const place of matchablePlaces) {
    const cityAlias = place.cityAliases.find((alias) => hasTerm(text, alias))
    const stateAlias = place.stateAliases.find((alias) => hasTerm(text, alias))

    if (cityAlias && stateAlias) {
      return {
        matchedText: `${cityAlias}, ${stateAlias}`,
        city: place.city,
        state: place.state,
        latitude: place.latitude,
        longitude: place.longitude,
        source: 'description-place-match',
        confidence: 0.95,
      }
    }
  }

  const cityMatches = matchablePlaces.filter((place) =>
    place.cityAliases.some((alias) => hasTerm(text, alias)),
  )

  if (cityMatches.length === 1) {
    return {
      matchedText: cityMatches[0].city,
      city: cityMatches[0].city,
      state: cityMatches[0].state,
      latitude: cityMatches[0].latitude,
      longitude: cityMatches[0].longitude,
      source: 'description-city-match',
      confidence: 0.8,
    }
  }

  const stateMatch = stateOnlyMatch(text, places)
  if (!stateMatch) return null

  const placeInState = cityMatches.find(
    (place) => place.state === stateMatch.state,
  )
  if (placeInState) {
    return {
      matchedText: `${placeInState.city}, ${stateMatch.state}`,
      city: placeInState.city,
      state: placeInState.state,
      latitude: placeInState.latitude,
      longitude: placeInState.longitude,
      source: 'description-city-state-context',
      confidence: 0.75,
    }
  }

  return stateMatch
}

export const inferCityStateCandidates = (input = '') => {
  const text = normalizeLocationText(input)
  const statePattern = [
    ...stateAbbreviations.keys(),
    ...stateAbbreviations.values(),
    ...Object.values(stateAliases).flat(),
  ]
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|')
  const cityPattern =
    "[a-z][a-z .'/-]{1,48}?[a-z]|[\\u0600-\\u06FF][\\u0600-\\u06FF .'/-]{1,48}"
  const patterns = [
    new RegExp(
      `(?:location|address|city|visited|in)?\\s*:?\\s*(${cityPattern})\\s*(?:,|-)\\s*(${statePattern})(?=$|[^a-z])`,
      'gi',
    ),
  ]
  const candidates = []
  const seen = new Set()
  const addCandidate = ({ matchedText, city, state }) => {
    const normalizedCity = normalizeLocationText(city)
    if (roadWords.some((word) => hasTerm(normalizedCity, word))) return

    const canonicalCity = canonicalCityName(city)
    const canonicalState = canonicalStateName(state)
    const key = `${normalizeLocationText(canonicalCity)}:${normalizeLocationText(canonicalState)}`

    if (!canonicalCity || !canonicalState || seen.has(key)) return
    seen.add(key)
    candidates.push({
      matchedText: matchedText.trim(),
      city: canonicalCity,
      state: canonicalState,
    })
  }

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const city = match[1]
        .replace(/^(location|address|city|visited|in)\s+/i, '')
        .trim()
        .replace(/\s+/g, ' ')
      addCandidate({
        matchedText: match[0].trim(),
        city,
        state: match[2],
      })
    }
  }

  for (const [city, aliases] of Object.entries(detectedCityAliases)) {
    const cityPattern = [city, ...aliases]
      .sort((a, b) => b.length - a.length)
      .map((alias) => escapeRegex(normalizeLocationText(alias)))
      .join('|')
    const cityTermPattern = `(?:^|[^a-z0-9])(${cityPattern})(?=$|[^a-z0-9])`

    for (const state of stateAbbreviations.keys()) {
      const statePattern = aliasesForState(state)
        .sort((a, b) => b.length - a.length)
        .map((alias) => escapeRegex(normalizeLocationText(alias)))
        .join('|')
      const stateTermPattern = `(?:^|[^a-z0-9])(${statePattern})(?=$|[^a-z0-9])`
      const nearbyPattern = new RegExp(
        `${cityTermPattern}.{0,40}${stateTermPattern}|${stateTermPattern}.{0,40}${cityTermPattern}`,
        'giu',
      )

      for (const match of text.matchAll(nearbyPattern)) {
        addCandidate({
          matchedText: match[0].trim(),
          city,
          state,
        })
      }
    }
  }

  return candidates.slice(0, 5)
}

export const sanitizeAddressCandidate = (input = '') =>
  String(input)
    .replace(/^[^\p{L}\p{N}]*/u, '')
    .replace(/^(?:address|location|العنوان|عنوان)\s*:\s*/i, '')
    .trim()

export const extractAddressCandidates = (input = '') => {
  const lines = String(input)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return [
    ...new Set(
      lines
        .filter((line) => {
          const normalized = normalizeLocationText(line)
          const hasNumber = /\d{2,}/.test(normalized)
          const hasRoadWord = roadWords.some((word) =>
            hasTerm(normalized, word),
          )
          const hasState = [...stateAbbreviations.keys()].some((state) =>
            aliasesForState(state).some((alias) => hasTerm(normalized, alias)),
          )

          return (
            normalized.length <= 180 && hasNumber && (hasRoadWord || hasState)
          )
        })
        .slice(0, 3),
    ),
  ]
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let lastGeocodeAt = 0

export const geocodeAddress = async (query, geocodeCache) => {
  if (geocodeCache[query]) return geocodeCache[query]

  const elapsed = Date.now() - lastGeocodeAt
  if (elapsed < 1100) await wait(1100 - elapsed)

  lastGeocodeAt = Date.now()
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('q', query)

  const response = await fetch(url, {
    headers: {
      'user-agent':
        'YaHalaLocationBot/1.0 (GitHub Actions static site updater)',
    },
  })

  if (!response.ok) return null
  const [result] = await response.json()
  if (!result?.lat || !result?.lon) return null

  const address = result.address ?? {}
  const geocoded = {
    query,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    city:
      address.city ??
      address.town ??
      address.village ??
      address.hamlet ??
      address.suburb ??
      '',
    state: address.state ?? '',
  }

  geocodeCache[query] = geocoded
  return geocoded
}

export const geocodeCityState = async (city, state, geocodeCache) => {
  const canonicalState = canonicalStateName(state) || state
  const query = `${String(city).trim()}, ${canonicalState}`
  const geocoded = await geocodeAddress(query, geocodeCache)
  if (!geocoded) return null

  const normalized = normalizeDetectedCityState({
    ...geocoded,
    query,
    city: geocoded.city || city,
    state: geocoded.state || canonicalState,
  })

  if (
    normalizeLocationText(normalized.state) !==
    normalizeLocationText(canonicalState)
  ) {
    return null
  }

  geocodeCache[query] = normalized
  return normalized
}

export const normalizeDetectedCityState = (result) => ({
  query: result?.query,
  latitude: Number(result?.latitude),
  longitude: Number(result?.longitude),
  city: String(result?.city ?? '').trim(),
  state:
    canonicalStateName(result?.state) || String(result?.state ?? '').trim(),
})

export const isConfidentNewPlace = (result) =>
  Boolean(
    result?.city &&
    result?.state &&
    Number.isFinite(Number(result?.latitude)) &&
    Number.isFinite(Number(result?.longitude)) &&
    Number(result?.confidence) >= 0.85,
  )

export const nearestKnownPlace = (point, places) => {
  if (
    typeof point?.latitude !== 'number' ||
    typeof point?.longitude !== 'number'
  ) {
    return null
  }

  const candidates = places
    .filter(
      (place) =>
        typeof place.latitude === 'number' &&
        typeof place.longitude === 'number',
    )
    .map((place) => ({
      place,
      distanceMiles: distanceMiles(point, place),
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)

  return candidates[0] ?? null
}

const placeKey = ({ city, state }) =>
  `${normalizeLocationText(city)}:${normalizeLocationText(state)}`

const rankLocationCandidates = (text, places) => {
  const knownKeys = new Set(places.map(placeKey))
  const candidates = inferCityStateCandidates(text)
  const knownPlace = inferKnownPlaceFromText(text, places)
  const ranked = candidates.map((candidate) => ({
    candidate,
    isKnown: knownKeys.has(placeKey(candidate)),
  }))

  return {
    knownPlace,
    ranked: [
      ...ranked.filter(({ isKnown }) => !isKnown),
      ...(knownPlace ? [{ knownPlace }] : []),
      ...ranked.filter(({ isKnown }) => isKnown),
    ],
  }
}

export const inferLocationForVideo = async ({
  title = '',
  description = '',
  places,
  geocodeCache,
}) => {
  const text = `${title}\n${description}`
  const { knownPlace, ranked } = rankLocationCandidates(text, places)
  const addressCandidates = extractAddressCandidates(description)

  for (const item of ranked) {
    if (item.knownPlace?.city) return item.knownPlace
    if (!item.candidate) continue

    const { candidate } = item
    const geocoded = await geocodeCityState(
      candidate.city,
      candidate.state,
      geocodeCache,
    )
    if (!geocoded) continue

    return {
      matchedText: candidate.matchedText,
      city: geocoded.city || candidate.city,
      state: geocoded.state || candidate.state,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      source: 'description-city-geocode',
      confidence: 0.9,
    }
  }

  for (const address of addressCandidates) {
    const sanitizedAddress = sanitizeAddressCandidate(address)
    const geocoded = await geocodeAddress(sanitizedAddress, geocodeCache)
    const normalized = normalizeDetectedCityState(geocoded)
    if (!normalized.city || !normalized.state) continue

    return {
      matchedText: sanitizedAddress,
      city: normalized.city,
      state: normalized.state,
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      source: 'description-address-geocode',
      confidence: 0.85,
    }
  }

  return knownPlace ?? null
}

export const testLocationUtils = async () => {
  const places = [
    {
      city: 'Brooklyn',
      state: 'New York',
      latitude: 40.6782,
      longitude: -73.9442,
    },
    {
      city: 'New York City',
      state: 'New York',
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      city: 'The Bronx',
      state: 'New York',
      latitude: 40.8448,
      longitude: -73.8648,
    },
    {
      city: 'Dearborn',
      state: 'Michigan',
      latitude: 42.3223,
      longitude: -83.1763,
    },
    { city: 'Tampa', state: 'Florida', latitude: 27.9506, longitude: -82.4572 },
    {
      city: 'Chicago',
      state: 'Illinois',
      latitude: 41.8781,
      longitude: -87.6298,
    },
    {
      city: 'Los Angeles',
      state: 'California',
      latitude: 34.0522,
      longitude: -118.2437,
    },
  ]
  const cases = [
    ['Brooklyn - New York', 'Brooklyn', 'New York'],
    ['Brooklyn, NY', 'Brooklyn', 'New York'],
    ['New York City', 'New York City', 'New York'],
    ['The Bronx', 'The Bronx', 'New York'],
    ['Dearborn, Michigan', 'Dearborn', 'Michigan'],
    ['زرنا بروكلين – نيويورك اليوم', 'Brooklyn', 'New York'],
    ['Florida', '', 'Florida'],
  ]

  for (const [input, city, state] of cases) {
    const result = inferKnownPlaceFromText(input, places)
    if (result?.city !== city || result?.state !== state) {
      throw new Error(
        `Expected ${input} => ${city}/${state}, got ${result?.city}/${result?.state}`,
      )
    }
  }

  const nearest = nearestKnownPlace(
    { latitude: 40.68, longitude: -73.95 },
    places,
  )
  if (nearest?.place.city !== 'Brooklyn') {
    throw new Error('Expected nearby geocode result to map to Brooklyn')
  }

  const geocodeCache = {
    'Columbus, Ohio': {
      query: 'Columbus, Ohio',
      latitude: 39.9612,
      longitude: -82.9988,
      city: 'Columbus',
      state: 'Ohio',
    },
    'Dublin, Ohio': {
      query: 'Dublin, Ohio',
      latitude: 40.0996009,
      longitude: -83.1135563,
      city: 'Dublin',
      state: 'Ohio',
    },
    '5837 Sawmill Rd. Dublin, OH 43017': {
      query: '5837 Sawmill Rd. Dublin, OH 43017',
      latitude: 40.1091109,
      longitude: -83.0910391,
      city: 'Dublin',
      state: 'Ohio',
    },
  }

  const columbusFull = await inferLocationForVideo({
    title: '',
    description: 'Location: Columbus, Ohio',
    places,
    geocodeCache,
  })
  if (
    columbusFull?.city !== 'Columbus' ||
    columbusFull?.state !== 'Ohio' ||
    columbusFull?.source !== 'description-city-geocode' ||
    typeof columbusFull.latitude !== 'number' ||
    typeof columbusFull.longitude !== 'number'
  ) {
    throw new Error('Expected Columbus, Ohio to geocode as a new place')
  }

  const columbusAbbrev = await inferLocationForVideo({
    title: '',
    description: 'Columbus, OH',
    places,
    geocodeCache,
  })
  if (columbusAbbrev?.city !== 'Columbus' || columbusAbbrev?.state !== 'Ohio') {
    throw new Error('Expected Columbus, OH to geocode as a new place')
  }

  const columbusArabic = await inferLocationForVideo({
    title: '',
    description:
      'من بغداد إلى كولومبوس اوهايو. حاصل على شهادة من Buffalo College في ولاية نيويورك.',
    places,
    geocodeCache: {
      ...geocodeCache,
      'Columbus, New York': {
        query: 'Columbus, New York',
        latitude: 42.6839611,
        longitude: -75.3726723,
        city: 'Town of Columbus',
        state: 'New York',
      },
    },
  })
  if (columbusArabic?.city !== 'Columbus' || columbusArabic?.state !== 'Ohio') {
    throw new Error(
      `Expected nearby Columbus/Ohio to win over unrelated New York mention, got ${columbusArabic?.city}/${columbusArabic?.state}`,
    )
  }

  const chicago = await inferLocationForVideo({
    title: '',
    description: 'Chicago, Illinois',
    places,
    geocodeCache,
  })
  if (
    chicago?.city !== 'Chicago' ||
    chicago?.source !== 'description-place-match'
  ) {
    throw new Error('Expected existing Chicago to match the known place')
  }

  const california = await inferLocationForVideo({
    title: '',
    description: 'California',
    places,
    geocodeCache,
  })
  if (california?.city || california?.state !== 'California') {
    throw new Error('Expected California to remain a state-only match')
  }

  const ohioAddress = await inferLocationForVideo({
    title: '',
    description: '5837 Sawmill Rd. Dublin, OH 43017',
    places,
    geocodeCache,
  })
  if (ohioAddress?.city !== 'Dublin' || ohioAddress?.state !== 'Ohio') {
    throw new Error('Expected Ohio address to map to its geocoded city/state')
  }
}
