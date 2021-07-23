import {getDefaultSystemProvider, initApi, updateSystemProvider} from "./module/api.js"
import PartyOverviewApp from "./module/logic.js";
import { registerSettings } from "./module/settings.js"

Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

let party;

Hooks.once("init", () => {
  registerSettings();
  initApi();
  party = new PartyOverviewApp();

  return loadTemplates([
    "modules/party-overview/templates/parts/FilterButton.html",
    "modules/party-overview/templates/parts/Languages.html"
  ]);
});

Hooks.on("ready", () => {
  if (party) party.update();
  else party = new PartyOverviewApp();
});

Hooks.on("renderActorDirectory", (app, html, data) => {
  if (!game.user.isGM && !game.settings.get("party-overview", "EnablePlayerAccess"))
    return;

  let button = $(
    `<button id="party-overview-button" class="${game.system.id}"><i class="fas fa-users"></i> Party Overview</button>`
  );
  button.on("click", (e) => {
    party.render(true);
  });

  $(html).find("header.directory-header").prepend(button);
});

Hooks.on("deleteActor", (actor, ...rest) => {
  if (actor.hasPlayerOwner) {
    party.update();
    party.render(false);
  }
});

Hooks.on("updateActor", (actor, ...rest) => {
  if (actor.hasPlayerOwner) {
    party.update();
    party.render(false);
  }
});

Hooks.on("createToken", (scene, sceneId, token, ...rest) => {
  let actor = game.actors.entities.find((actor) => actor.id === token.actorId);
  if (actor && actor.hasPlayerOwner) {
    party.update();
    party.render(false);
  }
});

Hooks.on("deleteToken", (...rest) => {
  party.update();
  party.render(false);
});

Hooks.on("updateScene", (scene, changes, ...rest) => {
  if (changes.active) {
    // what a hack! the hook is fired when the scene switch is not yet activated, so we need
    // to wait a tiny bit. The combat tracker is rendered last, so the scene should be available
    Hooks.once("renderCombatTracker", (...rest) => {
      party.update();
      party.render(false);
    });
  }
});
