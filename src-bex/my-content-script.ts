// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks

import { bexContent } from 'quasar/wrappers'
import { CHANNELS } from './channels'
import { debounce } from 'quasar'
import { getMatch } from 'src/components/backend'

const CHANNEL_ELEMENT_SELECTOR = '#meta-contents #channel-name a'

const watchButton = (function() {
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

  const button = document.createElement('div')
  button.style.cursor = 'pointer'
  button.append(textEl)
  button.append(imgEl)

  return button
}())

const loadingButton = (function() {
  const textEl = document.createElement('span')
  textEl.innerText = ' • Loading'
  textEl.style.fontSize = '13px'

  const button = document.createElement('div')
  button.append(textEl)

  return button
}())

const notFoundButton = (function() {
  const textEl = document.createElement('span')
  textEl.innerText = ' • Not Found'
  textEl.style.fontSize = '13px'

  const button = document.createElement('div')
  button.append(textEl)

  return button
}())

export default bexContent((bridge) => {
  const injectWatchButton = debounce(async function(channelName: string) {
    const creatorId = CHANNELS[channelName]
    if (!creatorId) {
      return
    }

    const chapterSection = document.querySelector('.ytp-chapter-container')
    const controlBar = document.querySelector('.ytp-left-controls')
    controlBar?.insertBefore(loadingButton, chapterSection)

    const videoUrl = document.location.toString()
    const matches = await getMatch(creatorId, videoUrl)

    loadingButton.remove()
    if (matches.length > 0) {
      watchButton.onclick = function() {
        const player = document.querySelector<HTMLVideoElement>('video.video-stream')
        player?.pause()
        window.open(matches[0].link)
      }
      controlBar?.insertBefore(watchButton, chapterSection)
    } else {
      controlBar?.insertBefore(notFoundButton, chapterSection)
    }
  }, 500)

  bridge.on('watchable-on-floatplane', async () => {
    const channelNameEl = await waitForElement<HTMLDivElement>(CHANNEL_ELEMENT_SELECTOR)
    watchElement(channelNameEl, () => {
      // Clean up button for next video
      cleanup()

      const channelName = channelNameEl.innerText || ''
      injectWatchButton(channelName)
    })

    const channelName = channelNameEl.innerText || ''
    if (!channelName && !CHANNELS[channelName]) return

    // Clean up button for next video
    cleanup()
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

function cleanup() {
  loadingButton.remove()
  notFoundButton.remove()
  watchButton.remove()
}

function sleep(t: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, t)
  })
}
