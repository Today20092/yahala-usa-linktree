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
  ogImages?: Partial<Record<OgPage, string>>
}

export type OgPage = 'index' | 'about' | 'stories' | 'contact'

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

export type AboutPageContent = {
  pageTitle: string
  pageDescription: string
  name: string
  role: string
  heroStatement: string
  story: string[]
  mission: string[]
  viewerValue: string[]
  selectionPrinciples: {
    title: string
    description: string
  }[]
  viewerCtaLabel: string
  partnerCtaLabel: string
}

export type CityVideo = {
  videoId?: string
  title?: string
  url?: string
  thumbnail?: string
  published?: string
}

export type VisitedPlace = {
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
  state: string
  abbreviation: string
  places: VisitedPlace[]
  stateVideos: CityVideo[]
  videoCount: number
  firstIndex: number
}

export type VisitedMapPlace = {
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
  partnership: { email: string; turnstileSiteKey?: string }
  analytics?: { cloudflareBeaconToken?: string }
  site: SiteInfo
  about: AboutPageContent
  socialLinks: SocialLink[]
  youtubeChannels: YoutubeChannel[]
  featuredEpisodes: FeaturedEpisode[]
  visitedPlaces: VisitedPlaces
  socialReach: SocialReach
  videoSearch: VideoSearchCopy
  collaborationBrands: {
    name: string
    logo?: string
  }[]
}

export const siteConfig = parse(siteYaml) as SiteConfig

// PUBLIC_CF_BEACON_TOKEN overrides site.yaml per build (preview vs production).
export const cloudflareBeaconToken = (
  import.meta.env.PUBLIC_CF_BEACON_TOKEN ||
  siteConfig.analytics?.cloudflareBeaconToken ||
  ''
).trim()

export const getBaseUrl = (baseUrl: string) =>
  baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`

export const resolveSiteAsset = (baseUrl: string, assetPath: string) => {
  const normalizedBaseUrl = getBaseUrl(baseUrl)
  return `${normalizedBaseUrl}${assetPath.replace(/^\/+/, '')}`
}

// Absolute URL of a page's share image, falling back to the site-wide ogImage.
export const getPageOgImage = (page: OgPage, baseUrl: string, origin?: URL) => {
  const { ogImage, ogImages } = siteConfig.site
  return new URL(
    resolveSiteAsset(baseUrl, ogImages?.[page] ?? ogImage),
    origin,
  ).toString()
}

// openGraph + twitter props for astro-seo on pages that only need a share image.
export const socialSeo = (
  page: OgPage,
  props: {
    title: string
    description: string
    url: string
    alt: string
    baseUrl: string
    origin?: URL
  },
) => {
  const { siteName, twitterHandle } = siteConfig.site
  const image = getPageOgImage(page, props.baseUrl, props.origin)
  return {
    openGraph: {
      basic: {
        title: props.title,
        type: 'website',
        image,
        url: props.url,
      },
      optional: {
        description: props.description,
        siteName,
        locale: 'en_US',
      },
      image: { width: 1200, height: 630, alt: props.alt },
    },
    twitter: {
      card: 'summary_large_image' as const,
      site: twitterHandle,
      creator: twitterHandle,
      title: props.title,
      description: props.description,
      image,
      imageAlt: props.alt,
    },
  }
}
