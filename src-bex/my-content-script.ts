// Hooks added here have a bridge allowing communication between the BEX Content Script and the Quasar Application.
// More info: https://quasar.dev/quasar-cli/developing-browser-extensions/content-hooks

import { bexContent } from 'quasar/wrappers'

import YoutubeHandler from './content/youtube'

export default bexContent((bridge) => {
  bridge.on('watchable-on-floatplane', YoutubeHandler(bridge))
})
