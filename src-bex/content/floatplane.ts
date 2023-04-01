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
