import { bexBackground } from 'quasar/wrappers'

export default bexBackground((bridge /* , allActiveConnections */) => {
  bridge.on('log', ({ data, respond }) => {
    console.log(`[BEX] ${data.message}`, ...(data.data || []))
    respond()
  })

  bridge.on('getTime', ({ respond }) => {
    respond(Date.now())
  })

  bridge.on('storage.get', ({ data, respond }) => {
    const { key } = data
    if (key === null) {
      chrome.storage.local.get(null, items => {
        // Group the values up into an array to take advantage of the bridge's chunk splitting.
        respond(Object.values(items))
      })
    } else {
      chrome.storage.local.get([key], items => {
        respond(items[key])
      })
    }
  })
  // Usage:
  // const { data } = await bridge.send('storage.get', { key: 'someKey' })

  bridge.on('storage.set', ({ data, respond }) => {
    chrome.storage.local.set({ [data.key]: data.value }, () => {
      respond()
    })
  })
  // Usage:
  // await bridge.send('storage.set', { key: 'someKey', value: 'someValue' })

  bridge.on('storage.remove', ({ data, respond }) => {
    chrome.storage.local.remove(data.key, () => {
      respond()
    })
  })
  // Usage:
  // await bridge.send('storage.remove', { key: 'someKey' })

  bridge.on('sync.get', ({ data, respond }) => {
    const { key } = data
    if (key === null) {
      chrome.storage.sync.get(null, items => {
        // Group the values up into an array to take advantage of the bridge's chunk splitting.
        respond(Object.values(items))
      })
    } else {
      chrome.storage.sync.get([key], items => {
        respond(items[key])
      })
    }
  })
  // Usage:
  // const { data } = await bridge.send('sync.get', { key: 'someKey' })

  bridge.on('sync.set', ({ data, respond }) => {
    chrome.storage.sync.set({ [data.key]: data.value }, () => {
      respond()
    })
  })
  // Usage:
  // await bridge.send('sync.set', { key: 'someKey', value: 'someValue' })

  bridge.on('sync.remove', ({ data, respond }) => {
    chrome.storage.sync.remove(data.key, () => {
      respond()
    })
  })
  // Usage:
  // await bridge.send('sync.remove', { key: 'someKey' })

  bridge.on('video.updateprogress', ({ data, respond }) => {
    chrome.storage.local.get('progressdata', (items) => {
      const progressdata = items.progressdata || {}
      progressdata[data.videoId] = {
        progress: data.progress,
        lastUpdate: Date.now()
      }
      chrome.storage.local.set({ progressdata }, () => respond())
    })
  })
  // Usage:
  // await bridge.send('video.updateprogress', { videoId, progress })

  bridge.on('video.getprogress', ({ data, respond }) => {
    chrome.storage.local.get('progressdata', (items) => {
      const progressdata = items.progressdata || {}
      if (data && 'videoId' in data) {
        respond(progressdata[data.videoId])
      } else {
        respond(progressdata)
      }
    })
  })
  // Usage:
  // await bridge.send('video.getprogress', { videoId })

  if (!chrome.tabs.onUpdated.hasListeners()) {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status !== 'complete') return
      if (isYoutubeVideoUrl(tab.url)) {
        bridge.send('watchable-on-floatplane', { tab, changeInfo })
      } else if (isFloatplane(tab.url)) {
        bridge.send('on-floatplane', { tab, changeInfo })
      }
    })
  }
})

function isYoutubeVideoUrl(url?: string) {
  return url?.startsWith('https://www.youtube.com/watch')
}

function isFloatplane(url?: string) {
  return /^https:\/\/(www|beta)\.floatplane.com\//.test(url || '')
}
