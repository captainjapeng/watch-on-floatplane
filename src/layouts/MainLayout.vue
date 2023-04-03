<template>
  <q-layout view="lHh Lpr lFf">
    <q-drawer
      v-model="settingsVisible"
      no-swipe-close
      no-swipe-open
    >
      <q-scroll-area class="fit">
        <q-list>
          <q-item
            clickable
            @click="settingsVisible = false"
          >
            <q-item-section>
              <q-item-label>Hide Menu</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Watch Progress Tracking</q-item-label>
              <q-item-label caption>
                Automatically resumes the video from where you left off.
              </q-item-label>
            </q-item-section>
            <q-item-section
              side
              top
            >
              <q-toggle v-model="settings.progressTracking" />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Enable Cloud Sync</q-item-label>
              <q-item-label caption>
                Save your data on the cloud to allow your other devices to synchronize data.
              </q-item-label>
            </q-item-section>
            <q-item-section
              side
              top
            >
              <q-toggle v-model="settings.cloudSyncEnabled" />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-input
                ref="userIdRef"
                v-model="userId"
                :rules="[(val: string) => !!val]"
                :readonly="!userIdEditable"
                label="Cloud User ID"
                hide-bottom-space
                class="full-width"
              >
                <template #append>
                  <q-btn
                    :icon="userIdEditable ? `save` : `edit`"
                    flat
                    round
                    dense
                    @click="toggleEditUserId()"
                  />
                </template>
              </q-input>
              <div class="text-caption text-grey-5 non-selectable">
                This ID is used synchronize your data between devices.
                Do not share with others.
              </div>
            </q-item-section>
          </q-item>
          <q-item
            clickable
            @click="deleteCloudData()"
          >
            <q-item-section>
              <q-item-label class="text-negative">
                Delete Cloud Data
              </q-item-label>
              <q-item-label caption>
                This will delete all your data saved in the cloud but will not affect your local data.
                It will also automatically disable cloud sync feature.
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view @settings="toggleSettings" />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { Dialog, QInput, useQuasar } from 'quasar'
import { defineComponent, onMounted, reactive, ref, watch, toRaw } from 'vue'
import short from 'short-uuid'
import {
  getSync,
  saveSync,
  deleteCloudData as _deleteCloudData
} from 'src/components/backend'
import { DEFAULT_SETTINGS, Settings } from 'src/components/settings'

export default defineComponent({
  name: 'MainLayout',
  setup() {
    const { bex: bridge } = useQuasar()
    const settingsVisible = ref(false)
    const userIdRef = ref<QInput>(null as any)
    const userIdEditable = ref(false)
    const userId = ref('')

    const settings = reactive<Settings>(DEFAULT_SETTINGS)
    watch(settings, async (val) => {
      await saveSync('settings', toRaw(val), bridge)
      await bridge?.send('sync.progressdata')
    })

    onMounted(async () => {
      let [_userId, _settings] = await Promise.all([
        getSync('userId', bridge),
        getSync('settings', bridge)
      ])

      if (!_userId) {
        _userId = short.generate()
        await saveSync('userId', _userId, bridge)
      }

      userId.value = _userId
      Object.assign(settings, _settings)
    })

    async function toggleEditUserId() {
      const value = userIdEditable.value = !userIdEditable.value

      if (value) {
        // Edit mode activated
        userIdRef.value.focus()
      } else {
        // Persist data
        await saveSync('userId', userId.value, bridge)
      }
    }

    async function toggleSettings() {
      const _settings = await getSync('settings', bridge)
      Object.assign(settings, _settings)

      settingsVisible.value = !settingsVisible.value
    }

    function deleteCloudData() {
      Dialog.create({
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed with your cloud data deletion?',
        ok: { color: 'negative', flat: true },
        cancel: true
      }).onOk(() => {
        settings.cloudSyncEnabled = false
        return _deleteCloudData(bridge)
      })
    }

    return {
      settingsVisible,
      settings,
      userId,
      userIdRef,
      userIdEditable,
      toggleEditUserId,
      toggleSettings,
      deleteCloudData
    }
  }
})
</script>

<style lang="sass">
html
  min-width: 350px
  min-height: 496px
</style>
