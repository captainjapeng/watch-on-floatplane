# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Add tooltip to search results' title
- Automatically resume video from where the user left off
- Display watch progress on Channel Page
- Add support for cloud based sync for watch progress

### Fixed
- Handle posts without thumbnail properly
- Prevent horizontal scrolling on search results

### Changed
- Do not wait for channels sync to finish before returning channel list

## [0.2.0] - 2023-03-30

### Added
- Add search functionality through popup

## [0.1.1] - 2023-03-12

### Added
- Add exact matching of  phash before falling back to partial matches

### Fixed
- Make the return value of the phash server be fixed at 64 characters
- Set videos_phash_idx creator_ids' when back filling

## [0.1.0] - 2023-03-12

### Added
- Add `Loading` and `Not Found` display (fix #1, fix #2)

### Fixed

- Do not send request to backend when the current channel does not have a Floatplane equiavalent.
- YouTube URL's with `-` character not parsed properly
- Fix YouTube player resuming when on pause and the watch button is pressed (fix #3)
- Handle error when phash server is unable to fetch the image.

## [0.0.3] - 2023-03-07

### Added

- Add "Watch button" on YouTube control bar when the video is available on Floatplane
