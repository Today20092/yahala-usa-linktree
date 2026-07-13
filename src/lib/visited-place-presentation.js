const normalizeKey = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()

/**
 * @param {import('./site-config').VisitedPlace[]} places
 * @param {import('./site-config').StateVideoGroup[]} stateVideos
 * @param {number} maxVideosPerGroup
 * @returns {{ stateGroups: import('./site-config').VisitedStateGroup[], mapPlaces: import('./site-config').VisitedMapPlace[] }}
 */
export const buildVisitedPlacePresentation = (
  places,
  stateVideos,
  maxVideosPerGroup = 3,
) => {
  const videosByState = new Map(
    stateVideos.map((group) => [normalizeKey(group.state), group.videos ?? []]),
  )
  const groups = new Map()

  places.forEach((place, index) => {
    const stateKey = normalizeKey(place.state)
    const group = groups.get(stateKey) ?? {
      id: stateKey,
      state: place.state.trim(),
      label: place.state.trim(),
      abbreviation: place.stateAbbreviation ?? place.state,
      places: [],
      stateVideos: (videosByState.get(stateKey) ?? []).slice(
        0,
        maxVideosPerGroup,
      ),
      videoCount: videosByState.get(stateKey)?.length ?? 0,
      firstIndex: index,
    }

    group.places.push({
      ...place,
      id: `${stateKey}:${normalizeKey(place.city)}:${index}`,
      videos: place.videos?.slice(0, maxVideosPerGroup),
    })
    group.videoCount += place.videos?.length ?? 0
    groups.set(stateKey, group)
  })

  return {
    stateGroups: [...groups.values()].sort(
      (a, b) => b.videoCount - a.videoCount || a.firstIndex - b.firstIndex,
    ),
    mapPlaces: places
      .filter(
        (place) =>
          (place.videos?.length ?? 0) > 0 &&
          typeof place.latitude === 'number' &&
          typeof place.longitude === 'number',
      )
      .map((place, index) => ({
        id: `${normalizeKey(place.state)}:${normalizeKey(place.city)}:${index}`,
        city: place.city,
        state: place.state.trim(),
        label: place.label ?? `${place.city}, ${place.state}`,
        latitude: place.latitude,
        longitude: place.longitude,
      })),
  }
}
