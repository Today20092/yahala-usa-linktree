import { parse } from 'yaml'

import siteYaml from '../data/site.yaml?raw'
import type { VideoSearchCopy } from './video-search'

export type SiteInfo = {
  pageTitle: string
  pageDescription: string
  siteName: string
  profileName: string
  twitterHandle: string
  heroImageAlt: string
  profileImage: string
  ogImage: string
}

export type SocialLink = {
  id: string
  url: string
  icon: string
  label: string
  color: string
  color2: string
  color3: string
  darkColor?: string
  darkColor2?: string
  darkColor3?: string
}

export type ChannelBranding = {
  logoSrc: string
  accentColor: string
  darkAccentColor: string
  cardBackground: string
  darkCardBackground: string
  cardTint: string
  darkCardTint: string
  logoBackgroundColor: string
  darkLogoBackgroundColor?: string
  logoFit?: 'cover' | 'contain'
  logoPaddingClass?: string
}

export type YoutubeChannel = {
  id: string
  channelId: string
  videosUrl: string
  name: string
  description: string
  branding?: ChannelBranding
}

export type FeaturedEpisode = {
  url: string
  category: string
  title?: string
}

export type SocialReachItem = {
  platform: string
  metric: string
  value: number
}

export type SocialReach = {
  updatedAt: string
  items: SocialReachItem[]
}

export type CityVideo = {
  videoId?: string
  title?: string
  url?: string
  thumbnail?: string
}

export type VisitedPlace = {
  id?: string
  city: string
  state: string
  label?: string
  stateAbbreviation?: string
  latitude?: number
  longitude?: number
  x?: number
  y?: number
  videos?: CityVideo[]
  featured?: boolean
}

export type StateVideoGroup = {
  state: string
  label?: string
  abbreviation?: string
  videos: CityVideo[]
}

export type VisitedStateGroup = {
  id: string
  state: string
  label: string
  abbreviation: string
  places: VisitedPlace[]
  stateVideos: CityVideo[]
  videoCount: number
  firstIndex: number
}

export type VisitedMapPlace = {
  id: string
  city: string
  state: string
  label: string
  latitude: number
  longitude: number
}

export type VisitedPlaces = {
  title: string
  eyebrow?: string
  description?: string
  stateVideos?: StateVideoGroup[]
  places: VisitedPlace[]
  stateGroups?: VisitedStateGroup[]
  mapPlaces?: VisitedMapPlace[]
}

export type SiteConfig = {
  site: SiteInfo
  socialLinks: SocialLink[]
  youtubeChannels: YoutubeChannel[]
  featuredEpisodes: FeaturedEpisode[]
  visitedPlaces: VisitedPlaces
  socialReach: SocialReach
  videoSearch: VideoSearchCopy
}

export const siteConfig = parse(siteYaml) as SiteConfig

export const getBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

export const resolveSiteAsset = (baseUrl: string, assetPath: string) => {
  const normalizedBaseUrl = getBaseUrl(baseUrl)
  return `${normalizedBaseUrl}${assetPath.replace(/^\/+/, '')}`
}
