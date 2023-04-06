# Watch on Floatplane

| Watch on Floatplane button | Searching |
| --- | --- |
| ![wofp-screnshot](https://user-images.githubusercontent.com/26142675/228764977-f9b0f09d-7aaf-4c09-ac95-5578ebfd00b9.jpg) | ![wofp-search](https://user-images.githubusercontent.com/26142675/228764031-614c1fc3-1cb1-445c-8ed7-1c8e067e38c3.jpg) |


Watch on Floatplane is a browser extension for notifying you that a video is available on Floatplane.

It does this by adding a small icon to the YouTube video player that shows you if the video is also available on Floatplane. If it is, you can click on the icon and watch it there with no ads and at higher quality.

# TODO
- [x] `Watch on Floatplane` button
- [x] Popup Search
- [x] Watch Queue
- [ ] Live Stream View Counter
- [ ] Watched Video Indicator
- [ ] Resume Watching

# Disclaimer

> ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠
>
> Watch on Floatplane browser extension is not affiliated with YouTube or Floatplane, and requires a valid Floatplane account to watch the videos.
>
> ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠

# Data Collection and Privacy
> ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠
>
> I've added a metric recording in order to have backend observability which will help in understanding how the users are using this browser extension and when identifying backend performance issues.
>
> The following data are collected and stored only for [92 days](https://blog.cloudflare.com/using-analytics-engine-to-improve-analytics-engine/#:~:text=We%E2%80%99ve%20recently%20extended%20our%20retention%20from%2031%20to%2092%20days%2C%20and%20we%20will%20keep%20an%20eye%20on%20this%20to%20see%20if%20we%20should%20offer%20further%20extension) from the moment it was recorded.
>
> - Endpoint: `/channels`
> - Country: `PH`
> - City: `San Juan`
> - Path: `/channels`
> - VisitorID: `sha256(ipAddr + country + city + userAgent)`
> - Est. Runtime: `100ms`
>
> ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠ ⚠


# Installation

You may install this browser extension officially from the [Chrome Web Store](https://chrome.google.com/webstore/detail/watch-on-floatplane/pnndepepinedmjikpjnpibfldojmoapa) or by downloading from the [Release page](https://github.com/captainjapeng/watch-on-floatplane/releases) and following the [manual installation](https://github.com/captainjapeng/watch-on-floatplane/edit/master/README.md#manual-installation) process.


# Manual Installation

1. Download the last zip file from the [release page](https://github.com/captainjapeng/watch-on-floatplane/releases).
2. Go to Chrome's extension page by pasting `chrome://extensions` on a new tab.
3. Locate the zip file and drag it onto the extension page.


# For development

## Install the dependencies
```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev -m bex
```

### Lint the files
```bash
yarn lint
# or
npm run lint
```

### Build the app for production
```bash
quasar dev -m bex
```
