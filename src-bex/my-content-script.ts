// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks

import { bexContent } from 'quasar/wrappers'
import { CHANNELS } from './channels'
import { debounce } from 'quasar'

const BASE_URL = 'https://wofp.jasperagrante.com'
// const BASE_URL = 'http://localhost:8787'
const CHANNEL_ELEMENT_SELECTOR = '#meta-contents #channel-name a'

const textEl = document.createElement('span')
textEl.innerText = ' • Watch on'
textEl.style.fontSize = '13px'

const imgEl = document.createElement('img')
imgEl.src = chrome.runtime.getURL('assets/fp-icon-white.svg')
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
  const injectWatchButton = debounce(async function(channelName: string) {
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
  }, 500)

  bridge.on('watchable-on-floatplane', async () => {
    const channelNameEl = await waitForElement<HTMLDivElement>(CHANNEL_ELEMENT_SELECTOR)
    watchElement(channelNameEl, () => {
      // Clean up button for next video
      watchButton.remove()

      const channelName = channelNameEl.innerText || ''
      injectWatchButton(channelName)
    })

    const channelName = channelNameEl.innerText || ''
    if (!channelName && !CHANNELS[channelName]) return

    // Clean up button for next video
    watchButton.remove()
    injectWatchButton(channelName)
  })
})

async function waitForElement<T>(selector: string) {
  await sleep(500)
  return new Promise<T>(resolve => {
    let selectedEl = document.querySelector(selector)
    if (selectedEl) {
      return resolve(selectedEl as any)
    }

    const observer = new MutationObserver(() => {
      selectedEl = document.querySelector(selector)
      if (selectedEl) {
        resolve(selectedEl as any)
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  })
}

async function watchElement(element: HTMLElement, cb: () => void) {
  const observer = new MutationObserver(() => {
    observer.disconnect()
    cb()
  })

  observer.observe(element, {
    childList: true,
    subtree: true
  })

  return observer
}

function sleep(t: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, t)
  })
}
