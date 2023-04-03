<template>
  <q-header elevated>
    <q-toolbar class="bg-primary q-py-sm q-px-xs q-col-gutter-xs">
      <div class="col-auto">
        <q-btn
          icon="menu"
          round
          flat
          dense
          @click="$emit('settings')"
        />
      </div>
      <div class="col">
        <q-input
          v-model.trim="search"
          placeholder="Search"
          debounce="500"
          rounded
          standout
          dark
          dense
          clearable
          autofocus
        >
          <template #append>
            <!-- Component for channel popup -->
            <q-select
              ref="channelSelectorRef"
              v-model.trim="channelFilter"
              :loading="channelsloading"
              :options="channelOpts"
              :options-dark="false"
              option-label="fp_name"
              option-value="fp_id"
              behavior="dialog"
              rounded
              standout
              dark
              dense
              use-input
              map-options
              emit-value
              class="hidden"
              @filter="filterFn"
            >
              <template #selected-item="props">
                <span class="ellipsis inline">
                  {{ props.opt.fp_name }}
                </span>
              </template>
            </q-select>

            <!-- Channel popup button -->
            <div
              class="text-caption ellipsis cursor-pointer q-mr-xs"
              style="max-width: 30vw"
              @click.stop="channelSelectorRef.showPopup()"
            >
              {{ getChannelName(channelFilter) }}
            </div>

            <q-icon
              v-if="!loading"
              name="search"
            />
          </template>
        </q-input>
      </div>
    </q-toolbar>
  </q-header>

  <q-page clas>
    <q-scroll-area style="height: 440px">
      <div
        v-if="loading"
        class="absolute-center"
      >
        <q-spinner
          size="96px"
          color="primary"
        />
      </div>
      <div
        v-else-if="result?.error === `No words detected`"
        class="absolute-center hint text-h5"
      >
        Come on, give me more than that!
      </div>
      <div
        v-else-if="result?.items.length === 0"
        class="absolute-center hint text-h5"
      >
        Sorry but I cannot find what you're looking for.
      </div>
      <q-list
        v-if="result"
        separator
        style="width: 100vw"
      >
        <q-item
          v-for="item in result.items"
          :key="item.id"
          clickable
          @click="onClick(item)"
        >
          <q-item-section side>
            <q-img
              :src="item.thumbnail"
              width="125px"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label class="video-title text-bold">
              {{ item.title }}
              <q-tooltip
                class="bg-white text-black shadow-2 q-pa-xs"
                :offset="[0, 4]"
                style="font-size: 10px"
              >
                {{ item.title }}
              </q-tooltip>
            </q-item-label>
            <q-item-label class="text-caption">
              <span class="text-bold">
                {{ item.channel_name }}
              </span>
            </q-item-label>
            <q-item-label class="text-caption">
              <strong>
                <q-icon
                  name="hourglass_bottom"
                  style="vertical-align: top;"
                />
                {{ formatDuration(item.video_duration * 1000) }}
              </strong>
              &bullet;
              <span>
                {{ formatUploadDate(item) }}
                <q-tooltip
                  class="bg-white text-black shadow-2 q-pa-xs"
                  :offset="[0, 4]"
                  style="font-size: 10px"
                >
                  {{ formatUploadDateLong(item) }}
                </q-tooltip>
              </span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-page>
</template>

<script lang="ts">
import { Channel, SearchResult, getLocalChannels, getLocal, getSearchResult, saveLocal } from 'src/components/backend'
import { defineComponent, onMounted, ref, watch } from 'vue'
import { formatDistanceStrict, format } from 'date-fns'
import { SearchItem } from 'app/worker/backend/src/types'
import formatDuration from 'format-duration'
import { Platform, QSelect, openURL, useQuasar } from 'quasar'

export default defineComponent({
  name: 'IndexPage',
  emits: ['settings'],
  setup() {
    const channelSelectorRef = ref<QSelect>(null as any)
    const channelsloading = ref(false)
    const channels = ref<Channel[]>([])
    const channelOpts = ref<Channel[]>([])
    const channelFilter = ref('')
    watch(channelFilter, val => {
      saveLocal('lastChannelFilter', val, bex)
    })

    const search = ref('')
    const loading = ref(false)
    const result = ref<SearchResult | null>(null)
    watch([channelFilter, search], async ([creatorId, query]) => {
      if (!creatorId) return

      try {
        loading.value = true
        result.value = null

        const resp = await getSearchResult(creatorId, query || '')
        result.value = resp
      } finally {
        loading.value = false
      }
    })

    function formatUploadDate(item: SearchItem) {
      return formatDistanceStrict(
        new Date(item.upload_date),
        new Date()
      ) + ' ago'
    }

    function formatUploadDateLong(item: SearchItem) {
      return format(
        new Date(item.upload_date),
        'EEEE, MMMM d, yyyy \'at\' h:mm a'
      )
    }

    function onClick(item: SearchItem) {
      if (Platform.is.bex) {
        chrome.tabs.create({ url: item.link })
      } else {
        openURL(item.link)
      }
    }

    const { bex } = useQuasar()
    onMounted(async () => {
      try {
        channelsloading.value = true
        const lastChannel = await getLocal('lastChannelFilter', bex)
        channelFilter.value = lastChannel || ''

        const resp = await getLocalChannels(bex)
        channels.value = resp
        channelOpts.value = resp
        if (!channelFilter.value) {
          channelFilter.value = resp[0].fp_id
        }
      } finally {
        channelsloading.value = false
      }
    })

    function filterFn(val: string, update: any) {
      update(() => {
        if (!val) {
          channelOpts.value = channels.value
          return
        }

        const needle = val.toLowerCase()
        channelOpts.value = channels.value.filter(channel => {
          return [channel.fp_name, channel.yt_name]
            .map(q => q.toLowerCase())
            .some(q => q.indexOf(needle) > -1)
        })
      })
    }

    function getChannelName(id: string) {
      return channels.value.find(el => el.fp_id === id)?.fp_name
    }

    return {
      channelSelectorRef,
      search,
      channelFilter,
      loading,
      channels,
      channelOpts,
      channelsloading,
      result,
      formatUploadDate,
      formatUploadDateLong,
      formatDuration,
      onClick,
      filterFn,
      getChannelName
    }
  }
})
</script>

<style lang="sass" scoped>
.hint
  width: 100%
  text-align: center
  padding: 0 24px
  color: $grey-6

.video-title
  text-overflow: ellipsis
  white-space: normal
  overflow: hidden

.q-select
  :deep(.q-field__native)
    flex-wrap: nowrap
  :deep(.q-field__input)
    min-width: 8px !important
</style>
