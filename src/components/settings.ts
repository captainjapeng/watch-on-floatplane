export interface Settings {
  progressTracking: boolean
  cloudSyncEnabled: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  progressTracking: true,
  cloudSyncEnabled: false
}
