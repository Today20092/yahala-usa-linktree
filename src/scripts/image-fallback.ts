const FALLBACK_ATTR = 'data-fallback-src'
const BOUND_ATTR = 'data-fallback-bound'
const FALLBACKED_ATTR = 'data-fallback-applied'

function applyFallback(image: HTMLImageElement) {
  if (image.dataset.fallbackApplied === 'true') return

  const fallbackSrc = image.getAttribute(FALLBACK_ATTR)?.trim()
  if (!fallbackSrc || image.src === fallbackSrc) return

  image.dataset.fallbackApplied = 'true'
  image.src = fallbackSrc
}

function enhanceImage(image: HTMLImageElement) {
  if (image.getAttribute(BOUND_ATTR) === 'true') return

  image.setAttribute(BOUND_ATTR, 'true')
  image.addEventListener('error', () => applyFallback(image), { once: true })

  if (image.complete && image.naturalWidth === 0) {
    applyFallback(image)
  }
}

function initImageFallbacks() {
  document.querySelectorAll<HTMLImageElement>(`img[${FALLBACK_ATTR}]`).forEach(
    enhanceImage,
  )
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initImageFallbacks, {
    once: true,
  })
} else {
  initImageFallbacks()
}
