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
              <q-item-label>Enable Cloud Sync</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle v-model="cloudSyncEnabled" />
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
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view @settings="settingsVisible = !settingsVisible" />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { QInput, useQuasar } from 'quasar'
import { defineComponent, onMounted, ref, watch } from 'vue'
import short from 'short-uuid'
import { getSync, saveSync } from 'src/components/backend'

export default defineComponent({
  name: 'MainLayout',
  setup() {
    const settingsVisible = ref(false)
    const userIdRef = ref<QInput>(null as any)
    const userIdEditable = ref(false)
    const userId = ref('')

    const cloudSyncEnabled = ref(false)
    watch(cloudSyncEnabled, (val) => {
      saveSync('cloudSyncEnabled', val)
    })

    const { bex } = useQuasar()
    onMounted(async () => {
      let [_userId, _cloudSyncEnabled] = await Promise.all([
        getSync('userId', bex),
        getSync('cloudSyncEnabled', bex)
      ])

      if (!_userId) {
        _userId = short.generate()
        await saveSync('userId', _userId, bex)
      }

      userId.value = _userId
      cloudSyncEnabled.value = _cloudSyncEnabled
    })

    async function toggleEditUserId() {
      const value = userIdEditable.value = !userIdEditable.value

      if (value) {
        // Edit mode activated
        userIdRef.value.focus()
      } else {
        // Persist data
        await saveSync('userId', userId.value, bex)
      }
    }

    return {
      settingsVisible,
      cloudSyncEnabled,
      userId,
      userIdRef,
      userIdEditable,
      toggleEditUserId
    }
  }
})
</script>

<style lang="sass">
html
  min-width: 350px
  min-height: 496px
</style>
