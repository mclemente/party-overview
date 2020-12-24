# Changelog

## [2.3.0] Rising from the Ashes

I am now taking over maintanance of this module (Zamrod#9326). 

### Added
- Foundry 0.7.9 and DnD5e 1.2.0 combatibility. 
- Adds a new tab for background information (thanks @rogerioavsilva). 
- Tool tips appears on top and now display all speeds (thanks @haasn).
- Supports SWADE (thanks @javierriveracastro). 

## [2.2.3] Coins are heavy

The wealth tab now provides a summed up gold value, but also a plain sum of all coins of each type in order to get a feel for the weight the party is carrying. Thanks @Kage for the suggestion.

## [2.2.2] Weight in Gold

A nice suggestion from the VTTA Discord resulted in the addition of a wealth overview of the party. The total is displayed too, and automatically calulated to the highest currency based on the standard exchange rates (1 pp = 10 gp = 20 ep = 100 sp = 1,000 cp)

### Added

- Foundry 0.6.1 compatibility
- Currency overview (DND5e only)

## [2.2.1] Scale all the way

Thanks to kenster, you can now zoom till the end of ... Foundry's capabilities and still be able to decipher the tooltips: Automatic scaling of the font-size was an amazing addition, thanks!

### Fixed

- CSS clash by applying a more specific selector

## [2.2.0] Looking beyond my own nose

This release brings support for two new game systems: Pathfinder 2e and Warhammer Fantasy Roleplay 4th Edition. A big thanks to @AlabasterLeolin (pf2e) and @Moo Man (wfrp4e) for providing help to select the most helpful attributes to display in the tooltip and overview window.

## [2.1.7] Foundry 0.5.5 compatibilty release

**Note**: This release is available for 0.5.5 and up only.

### Fixed

- Tooltip not appearing for players when their ownership was set while they were not in-game yet

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

This release is dedicated to Tim, the patient. Without you poking me all the time I probably would have trashed party-overview someday because I seem to be the only one finding it not that useful ;) At least the code base is now up to some standards again.

Minor new features:

- UI improvements
- Added tabular data, now with languages
- All other restrictions apply:

Only Actors owned by a player (Permission: Owner on said actor) and Actors with a token placed on the currently active scene are shown in the GUI.

Known bugs:

- Both tooltips and the GUI itself haven't received the same restriction-set as the 2.0.0 release, so users will have access to both, GUI and tooltips for the moment.

## [2.0.0]

Feature parity release for the relaunch of VTTAssets
