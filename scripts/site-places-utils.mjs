import { readFile, writeFile } from 'node:fs/promises'
import { parse, stringify } from 'yaml'

export const siteConfigPath = new URL('../src/data/site.yaml', import.meta.url)

export const normalizePlaceKeyPart = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

export const visitedPlaceKey = (place) =>
  `${normalizePlaceKeyPart(place?.city)}:${normalizePlaceKeyPart(place?.state)}`

export const readSiteConfig = async () => {
  const source = await readFile(siteConfigPath, 'utf8')
  return parse(source) ?? {}
}

export const getVisitedPlaceKeys = (siteConfig) =>
  new Set((siteConfig.visitedPlaces?.places ?? []).map(visitedPlaceKey))

export const addVisitedPlaces = (siteConfig, placesToAdd) => {
  siteConfig.visitedPlaces ??= {}
  siteConfig.visitedPlaces.places ??= []

  const existingKeys = getVisitedPlaceKeys(siteConfig)
  const added = []

  for (const place of placesToAdd) {
    const nextPlace = {
      city: String(place?.city ?? '').trim(),
      state: String(place?.state ?? '').trim(),
      latitude: Number(place?.latitude),
      longitude: Number(place?.longitude),
    }
    const key = visitedPlaceKey(nextPlace)

    if (
      !nextPlace.city ||
      !nextPlace.state ||
      !Number.isFinite(nextPlace.latitude) ||
      !Number.isFinite(nextPlace.longitude) ||
      existingKeys.has(key)
    ) {
      continue
    }

    siteConfig.visitedPlaces.places.push(nextPlace)
    existingKeys.add(key)
    added.push(nextPlace)
  }

  return added
}

const formatSiteYaml = (source) =>
  source
    .replace(
      /\n(?=(socialLinks|youtubeChannels|featuredEpisodes|visitedPlaces|socialReach):)/g,
      '\n\n',
    )
    .replace(/^(\s*updatedAt: )(\d{4}-\d{2}-\d{2})$/m, '$1"$2"')

export const writeSiteConfig = async (siteConfig) => {
  await writeFile(siteConfigPath, formatSiteYaml(stringify(siteConfig, { lineWidth: 0 })))
}
