import { BexBridge } from '@quasar/app-vite'
import { watchForElement, watchLocationChange } from './utils'
import { throttle } from 'quasar'
import { getSync } from 'src/components/backend'
import { Settings } from 'src/components/settings'

const VIDEO_ELEMENT = 'video.vjs-tech'
const FEED_ELEMENT = 'div.ReactVideoFeed'

let observer: MutationObserver,
  videoFeedObserver: MutationObserver,
  videoElementObserver: MutationObserver

export default function(bridge: BexBridge) {
  return function() {
    if (observer) return
    observer = watchLocationChange(async (url) => {
      const settings = await getSync('settings', bridge) as Settings
      videoElementObserver?.disconnect()
      videoFeedObserver?.disconnect()

      if (isVideoPage(url)) {
        // Video Page Handler
        videoElementObserver = watchForElement<HTMLVideoElement>(
          VIDEO_ELEMENT,
          async (videoEl) => {
            if (!videoEl) return

            // Feature toggle
            if (!settings.progressTracking) return
            const videoId = getVideoId(url)

            const currProgress = await bridge.send('video.getprogress', { videoId })
            videoEl.currentTime = currProgress.data?.progress || 0

            const saveTime = throttle(async () => {
              const progress = Math.floor(videoEl.currentTime)
              if (progress < 5) return
              await bridge.send('video.updateprogress', { videoId, progress })
            }, 2500)

            videoEl.addEventListener('timeupdate', saveTime)
          }
        )
      } else if (isChannelPage(url)) {
        // Channel Page Handler
        const progressdata = (await bridge.send('video.getprogress'))?.data || {}
        videoFeedObserver = watchForElement<HTMLDivElement>(
          FEED_ELEMENT,
          async (videoFeedEl) => {
            if (!settings.progressTracking || !videoFeedEl) return

            const items = videoFeedEl.querySelectorAll('div.ReactElementGridItem')
            items.forEach((itemEl) => {
              const linkEl = itemEl.querySelector<HTMLAnchorElement>('div.PostTileWrapper > a')
              if (!linkEl) return

              const videoId = getVideoId(linkEl.href)
              const videoProgress = progressdata[videoId]

              // Skip item if we've already injected the watch indicator
              if (!videoProgress || itemEl.classList.contains('watched')) {
                return
              }

              const thumbEl = itemEl.querySelector<HTMLDivElement>('div.PostTileThumbnail')
              const durationEl = itemEl.querySelector<HTMLDivElement>('div.duration > .text')
              if (!thumbEl || !durationEl) return

              const duration = parseDuration(durationEl.textContent || '')
              thumbEl.appendChild(createProgressBar(videoProgress.progress / duration))
              itemEl.classList.add('watched')

              if (videoProgress.progress / duration >= 0.95) {
                itemEl.classList.add('watched-fully')
              }
            })
          }
        )
      }
    })
  }
}

function isVideoPage(url: string) {
  return /^https:\/\/(www|beta)\.floatplane.com\/post/.test(url)
}

function getVideoId(url: string) {
  const match = /^https:\/\/(www|beta)\.floatplane.com\/post\/(.*)$/.exec(url)
  return (match && match[2]) || ''
}

function isChannelPage(url: string) {
  return /^https:\/\/(www|beta)\.floatplane.com\/channel/.test(url)
}

function parseDuration(durationStr: string): number {
  if (!durationStr) return 0

  const parts = durationStr.split(':')
  if (parts.length === 3) {
    return (parseInt(parts[0]) * 60 * 60) +
      (parseInt(parts[1]) * 60) +
      parseInt(parts[2])
  } else if (parts.length === 2) {
    return (parseInt(parts[0]) * 60) +
      parseInt(parts[1])
  } else {
    return parseInt(durationStr)
  }
}

function createProgressBar(progress: number): HTMLDivElement {
  const backgroundEl = document.createElement('div')
  backgroundEl.style.position = 'absolute'
  backgroundEl.style.height = '8px'
  backgroundEl.style.background = 'rgba(0, 0, 0, 0.35)'
  backgroundEl.style.bottom = '0'
  backgroundEl.style.left = '0'
  backgroundEl.style.right = '0'
  backgroundEl.style.zIndex = '1'

  const progressEl = document.createElement('div')
  progressEl.style.width = `${Math.round(progress * 100)}%`
  progressEl.style.height = '100%'
  progressEl.style.background = '#0085ff'

  backgroundEl.appendChild(progressEl)
  return backgroundEl
}
