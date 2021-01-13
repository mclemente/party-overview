import config from "./config.js";
import PartyOverviewApp from "./app/index.js";

Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

let party;


Hooks.once("init", () => {
  party = new PartyOverviewApp();
  /**
   * Register settings
   */
   [
    {
      name: "EnablePlayerAccess",
      scope: "world",
      default: true,
      type: Boolean,
    },
  ].forEach((setting) => {
    let options = {
      name: game.i18n.localize(`party-overview.${setting.name}.Name`),
      hint: game.i18n.localize(`party-overview.${setting.name}.Hint`),
      scope: setting.scope,
      config: true,
      default: setting.default,
      type: setting.type,
    };
    if (setting.choices) options.choices = setting.choices;
    game.settings.register("party-overview", setting.name, options);
  });
});

Hooks.on("ready", () => {
  if (party) party.update();
  else party = new PartyOverviewApp();
});

Hooks.on("renderActorDirectory", (app, html, data) => {
  if (!game.user.isGM && !game.settings.get("party-overview", "EnablePlayerAccess"))
    return;

  let button = $(
    `<button id="party-overview-button" class="${game.system.id}">Party Overview</button>`
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
