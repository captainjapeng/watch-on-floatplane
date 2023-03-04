// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks

import { bexContent } from 'quasar/wrappers'

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
  // Hook into the bridge to listen for events sent from the client BEX.
  /*
  bridge.on('some.event', event => {
    if (event.data.yourProp) {
      // Access a DOM element from here.
      // Document in this instance is the underlying website the contentScript runs on
      const el = document.getElementById('some-id')
      if (el) {
        el.value = 'Quasar Rocks!'
      }
    }
  })
  */

  bridge.on('watchable-on-floatplane', event => {
    console.log({ event })
    const controlBar = document.querySelector('.ytp-left-controls')
    const chapterSection = document.querySelector('.ytp-chapter-container')
    controlBar?.insertBefore(watchButton, chapterSection)
  })
})
