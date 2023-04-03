import { bexBackground } from 'quasar/wrappers'
import { BASE_URL } from 'src/components/config'
import { Settings } from 'src/components/settings'

chrome.runtime.onInstalled.addListener(() => {
  syncProgressData()
})

setInterval(() => {
  chrome.storage.local.get(['shouldSyncProgressData'], async items => {
    if (items.shouldSyncProgressData) {
      syncProgressData()
    }
  })
}, 60 * 1000)

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
    chrome.storage.local.get('progressData', (items) => {
      const progressData = items.progressData || {}
      progressData[data.videoId] = {
        progress: data.progress,
        lastUpdate: Date.now()
      }
      chrome.storage.local.set({
        progressData,
        shouldSyncProgressData: true
      }, () => respond())
    })
  })
  // Usage:
  // await bridge.send('video.updateprogress', { videoId, progress })

  bridge.on('video.getprogress', ({ data, respond }) => {
    chrome.storage.local.get('progressData', (items) => {
      const progressData = items.progressData || {}
      if (data && 'videoId' in data) {
        respond(progressData[data.videoId])
      } else {
        respond(progressData)
      }
    })
  })
  // Usage:
  // await bridge.send('video.getprogress', { videoId })

  bridge.on('sync.progressdata', ({ respond }) => {
    syncProgressData()
    respond()
  })
  // Usage:
  // await bridge.send('sync.progressdata')

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

function syncProgressData() {
  chrome.storage.sync.get(['userId', 'settings'], async syncItems => {
    const { userId, settings } = syncItems
    if (!(settings as Settings)?.cloudSyncEnabled) return

    chrome.storage.local.get(['progressData'], async localItems => {
      const { progressData } = localItems
      if (userId) {
        const url = new URL('/user/sync/progress', BASE_URL)
        const resp = await fetch(url, {
          method: 'POST',
          headers: { authorization: `Bearer ${userId}` },
          body: JSON.stringify(progressData || {})
        })

        chrome.storage.local.set({
          progressData: await resp.json(),
          shouldSyncProgressData: false
        })
      }
    })
  })
}
