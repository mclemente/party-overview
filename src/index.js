import config from "./config.js";
import App from "./app/index.js";
import Tooltip from "./tooltip/index.js";

Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

let party;
let tooltip;

Hooks.once("canvasInit", (canvas) => {
  tooltip = new Tooltip();
  canvas.stage.addChild(tooltip);
});

Hooks.once("init", () => {
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
    {
      name: "EnableTooltip",
      scope: "world",
      default: true,
      type: Boolean,
    },
    {
      name: "EnablePlayerAccessTooltip",
      scope: "world",
      default: false,
      type: Boolean,
    },
  ].forEach((setting) => {
    let options = {
      name: game.i18n.localize(`vtta-party.${setting.name}.Name`),
      hint: game.i18n.localize(`vtta-party.${setting.name}.Hint`),
      scope: setting.scope,
      config: true,
      default: setting.default,
      type: setting.type,
    };
    if (setting.choices) options.choices = setting.choices;
    game.settings.register("vtta-party", setting.name, options);
  });
});

Hooks.on("ready", () => {
  // main window
  party = new App();
  party.setTooltip(tooltip);
});

Hooks.on("renderActorDirectory", (app, html, data) => {
  if (!game.user.isGM && !game.settings.get("vtta-party", "EnablePlayerAccess"))
    return;

  let button = $(
    '<button id="vtta-party-button"><i class="fas fa-info-circle"></i></button>'
  );
  button.on("click", (e) => {
    party.render(true);
  });

  $(html).find("header.directory-header").prepend(button);
});

Hooks.on("deleteActor", (actor, ...rest) => {
  if (actor.isPC) {
    party.update();
    party.render(false);
  }
});

Hooks.on("updateActor", (actor, ...rest) => {
  if (actor.isPC) {
    party.update();
    party.render(false);
  }
});

Hooks.on("createToken", (scene, sceneId, token, ...rest) => {
  let actor = game.actors.entities.find((actor) => actor.id === token.actorId);
  if (actor && actor.isPC) {
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
