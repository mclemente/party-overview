# Changelog

## [2.1.6] Hotfix

- Recreating the tooltip on scene switch/ update to make it reliably available 

## [2.1.5] Internal changes

### Changed

- Switched to TabsV2

## [2.1.4] Foundry 0.5.4 compatibilty release

### Fixed

- No more flickering when using the tooltip together with night mode

## [2.1.3] Foundry 0.5.3 compatability release

### Added

- Health added to Tooltip

### Changed

- Set compatibleCoreVersion to 0.5.3

## [2.1.2] Minor fixes

This is a compatibility release for Foundry 0.5.2

## [2.1.1] Trippin' Tooltips

Along with some minor bugfixes, I switched from HTML tooltips to rendered PIXI tooltips. While they look nice and it was a great learning experience, I am not quite sure if I like them being subject to the token's vision settings. Feedback is appreciated!

### Fixed

- Removed the debug setting to automatically display the window on startup
- Switched from HTML tooltips to PIXI-rendered ones, which leave no fragments at all

## [2.1.0] Loads of Love

This release is dedicated to Tim, the patient. Without you poking me all the time I probably would have trashed vtta-party someday because I seem to be the only one finding it not that useful ;) At least the code base is now up to some standards again.

Minor new features:

- UI improvements
- Added tabular data, now with languages
- All other restrictions apply:

Only Actors owned by a player (Permission: Owner on said actor) and Actors with a token placed on the currently active scene are shown in the GUI.

Known bugs:

- Both tooltips and the GUI itself haven't received the same restriction-set as the 2.0.0 release, so users will have access to both, GUI and tooltips for the moment.

## [2.0.0]

Feature parity release for the relaunch of VTTAssets
