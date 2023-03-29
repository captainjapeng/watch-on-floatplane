<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MainLayout',
  setup() {
    return {}
  }
})
</script>

<style lang="sass">
html
  min-width: 350px
  min-height: 496px
</style>
