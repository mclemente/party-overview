# party-overview

This is a League of Extraordinary Foundry Developers stewarded module fork of [vtta-party](https://github.com/VTTAssets/vtta-party). The original author indicated after some time of this not being updated that he was open to having a new maintainer and so we stepped in to steward it. In the process we made the call to remove some functionality as it was badly outdated and superceded by other, newer modules.

The plan at the moment is to remove the Tooltip functionality from the module, keeping instead only the party overview Application. In our opinion, the [Token Tooltip Alt](https://github.com/bmarian/token-tooltip-alt) module enables all of its functionality and more.

A quick overview about the players that have tokens placed on the currently active scene. At a glance, you will see

- Current and maximum hitpoints
- Armor Class
- Passives: Perception, Investigation and Insight
- On a second tab: All languages your players might know and which one of them can speak said language

Using filters, you can hide and show players to your hearts desire, to quickly get the information you need in the heat of the battle.

~~Futhermore, you can enable or disable tooltips showing those vital stats (besides the HP) when hovering over a token. Granulary access
controls can define if this module and/or the tooltips are available for GMs and assistants only, or of player can use the overview
to plan ahead, too. If you are enabling tooltips for your players, it will only be shown for tokens that they own, not for NPCs nor the rest of the party.~~

### Caveats and additional information

- Only tokens that are owned by players will appear in the list: Assign those permissions by right-clicking on the Actor in the sidebar, then select "Permissions" and set "Owner"-role to one of the configured players
- When switching scenes, the list will automatically update to show only the currently active players

## Configuration

You can set three options for this module, which define who can use the two parts of this module: The overview window and the tooltips.

- You can grant players the access to the overview window
~~- You can enable or disable tooltips globally
- You can allow players to have the tooltips, too, but right now, they can only see the tooltips on tokens that they own.~~

# Requirements

None
