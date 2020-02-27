/**
 * Application initialization
 */
Hooks.once("init", () => {
  /**
   * Register settings
   */
  VTTAParty.settings().forEach(setting => {
    let options = {
      name: game.i18n.localize(
        `${VTTAParty.name()}.${setting.name}.Name`
      ),
      hint: game.i18n.localize(
        `${VTTAParty.name()}.${setting.name}.Hint`
      ),
      scope: setting.scope,
      config: true,
      default: setting.default,
      type: setting.type
    };
    if (setting.choices) options.choices = setting.choices;

    game.settings.register(VTTAParty.name(), setting.name, options);
  });
});
