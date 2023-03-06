// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks

import { bexContent } from 'quasar/wrappers'
import { CHANNELS } from './channels'

const BASE_URL = 'https://watch-on-floatplane.jasperagrante.workers.dev'
const CHANNEL_ELEMENT_SELECTOR = '#top-row.ytd-watch-metadata .ytd-channel-name yt-formatted-string'

const textEl = document.createElement('span')
textEl.innerText = ' • Watch on'
textEl.style.fontSize = '13px'

const imgEl = document.createElement('img')
imgEl.src = chrome.extension.getURL('assets/fp-icon-white.svg')
imgEl.style.display = 'inline-block'
imgEl.style.verticalAlign = 'sub'
imgEl.style.width = '22px'
imgEl.style.marginLeft = '4px'
imgEl.style.marginRight = '8px'

const watchButton = document.createElement('div')
watchButton.style.cursor = 'pointer'
watchButton.append(textEl)
watchButton.append(imgEl)

export default bexContent((bridge) => {
  bridge.on('watchable-on-floatplane', async () => {
    const channelNameEl = await waitForElement(CHANNEL_ELEMENT_SELECTOR)
    const channelName = (channelNameEl as HTMLDivElement)?.innerText || ''

    console.log({ channelName })
    if (!channelName && !CHANNELS[channelName]) return

    const creatorId = CHANNELS[channelName]
    const url = new URL('/match', BASE_URL)
    url.searchParams.set('creatorId', creatorId)
    url.searchParams.set('videoUrl', document.location.toString())

    const resp = await fetch(url)
    if (resp.status === 200) {
      const matches = await resp.json()
      if (matches.length > 0) {
        watchButton.onclick = function() {
          document.querySelector<HTMLDivElement>('.video-stream')?.click()
          window.open(matches[0].link)
        }

        const controlBar = document.querySelector('.ytp-left-controls')
        const chapterSection = document.querySelector('.ytp-chapter-container')
        controlBar?.insertBefore(watchButton, chapterSection)
      }
    }
  })
})

function waitForElement(selector: string) {
  return new Promise<Element>(resolve => {
    let selectedEl = document.querySelector(selector)
    if (selectedEl) {
      return resolve(selectedEl)
    }

    const observer = new MutationObserver(() => {
      selectedEl = document.querySelector(selector)
      if (selectedEl) {
        resolve(selectedEl)
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  })
}
