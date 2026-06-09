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
    return new RegExp(`(^|[^a-z0-9])${escapeRegex(normalizedTerm)}([^a-z0-9]|$)`, 'i').test(
      haystack,
    )
  }

  return haystack.includes(normalizedTerm)
}

const aliasesForCity = (city) => [city, ...(cityAliases[city] ?? [])]

const aliasesForState = (state) => [
  state,
  stateAbbreviations.get(state),
  ...(stateAliases[state] ?? []),
].filter(Boolean)

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
      source: 'description-city-match',
      confidence: 0.8,
    }
  }

  const stateMatch = stateOnlyMatch(text, places)
  if (!stateMatch) return null

  const placeInState = cityMatches.find((place) => place.state === stateMatch.state)
  if (placeInState) {
    return {
      matchedText: `${placeInState.city}, ${stateMatch.state}`,
      city: placeInState.city,
      state: placeInState.state,
      source: 'description-city-state-context',
      confidence: 0.75,
    }
  }

  return stateMatch
}

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
          const hasRoadWord = roadWords.some((word) => hasTerm(normalized, word))
          const hasState = [...stateAbbreviations.keys()].some((state) =>
            aliasesForState(state).some((alias) => hasTerm(normalized, alias)),
          )

          return normalized.length <= 180 && hasNumber && (hasRoadWord || hasState)
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
      'user-agent': 'YaHalaLocationBot/1.0 (GitHub Actions static site updater)',
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

export const nearestKnownPlace = (point, places) => {
  if (typeof point?.latitude !== 'number' || typeof point?.longitude !== 'number') {
    return null
  }

  const candidates = places
    .filter(
      (place) =>
        typeof place.latitude === 'number' && typeof place.longitude === 'number',
    )
    .map((place) => ({
      place,
      distanceMiles: distanceMiles(point, place),
    }))
    .sort((a, b) => a.distanceMiles - b.distanceMiles)

  return candidates[0] ?? null
}

export const inferLocationForVideo = async ({
  title = '',
  description = '',
  places,
  geocodeCache,
}) => {
  const text = `${title}\n${description}`
  const knownPlace = inferKnownPlaceFromText(text, places)
  if (knownPlace) return knownPlace

  for (const address of extractAddressCandidates(description)) {
    const geocoded = await geocodeAddress(address, geocodeCache)
    const nearest = nearestKnownPlace(geocoded, places)
    if (!nearest) continue

    geocodeCache[address] = {
      ...geocoded,
      matchedPlace: {
        city: nearest.place.city,
        state: nearest.place.state,
        distanceMiles: Number(nearest.distanceMiles.toFixed(2)),
      },
    }

    return {
      matchedText: address,
      city: nearest.place.city,
      state: nearest.place.state,
      source: 'description-address-geocode',
      confidence: nearest.distanceMiles <= 25 ? 0.85 : 0.65,
    }
  }

  return null
}

export const testLocationUtils = () => {
  const places = [
    { city: 'Brooklyn', state: 'New York', latitude: 40.6782, longitude: -73.9442 },
    { city: 'New York City', state: 'New York', latitude: 40.7128, longitude: -74.006 },
    { city: 'The Bronx', state: 'New York', latitude: 40.8448, longitude: -73.8648 },
    { city: 'Dearborn', state: 'Michigan', latitude: 42.3223, longitude: -83.1763 },
    { city: 'Tampa', state: 'Florida', latitude: 27.9506, longitude: -82.4572 },
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
}
