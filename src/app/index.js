import Tooltip from "../tooltip/index.js";

const DISPLAY_MODE = {
  SHOW_ALL: "SHOW_ALL",
  SHOW_HIDDEN: "SHOW_HIDDEN",
  SHOW_VISIBLE: "SHOW_VISIBLE"
};

class App extends Application {
  constructor(options) {
    super(options);

    this.hiddenActors = [];
    this.state = {};
    this.displayMode = DISPLAY_MODE.SHOW_VISIBLE;
    this.activeTab = "general";

    this.tooltip = new Tooltip();
    Hooks.on("hoverToken", this.onHoverToken.bind(this));
  }

  static get defaultOptions() {
    return {
      width: 500,
      height: 300,
      resizable: true,
      title: "VTTA Party",
      template: "/modules/vtta-party/templates/main.hbs",
      classes: ["vtta", "party"]
    };
  }

  getData() {
    let actors = game.actors.entities
      .filter(a => a.isPC)
      .map(playerActor => playerActor.getActiveTokens(true))
      .flat(1)
      .map(token => token.actor);

    // remove duplicates if an actors has multiple tokens on scene
    actors = actors.reduce(
      (actors, actor) =>
        actors.map(a => a.id).includes(actor.id) ? actors : [...actors, actor],
      []
    );

    switch (this.displayMode) {
      case DISPLAY_MODE.SHOW_HIDDEN:
        actors = actors.filter(actor => this.hiddenActors.includes(actor.id));
        break;
      case DISPLAY_MODE.SHOW_VISIBLE:
        actors = actors.filter(actor => !this.hiddenActors.includes(actor.id));
        break;
    }

    actors = actors.map(actor => {
      const data = actor.data.data;
      return this.getActorDetails(actor);
    });

    // restructure the languages a bit so rendering gets easier
    let languages = actors
      .reduce(
        (languages, actor) => [...new Set(languages.concat(actor.languages))],
        []
      )
      .sort();
    actors = actors.map(actor => {
      return {
        ...actor,
        languages: languages.map(language => actor.languages.includes(language))
      };
    });

    console.log("########### GET DATA");
    this.state = {
      activeTab: this.activeTab,
      mode: this.displayMode,
      name: "Sebastian",
      actors: actors,
      languages: languages
    };
    console.log(this.state);

    return this.state;
  }

  getActorDetails(actor) {
    const data = actor.data.data;
    return {
      id: actor.id,
      isHidden: this.hiddenActors.includes(actor.id),
      name: actor.name,
      shortName: actor.name.split(/\s/).shift(),
      shortestName:
        actor.name.split(/\s/).shift().length > 10
          ? actor.name
              .split(/\s/)
              .shift()
              .substr(0, 10) + "…"
          : actor.name
              .split(/\s/)
              .shift()
              .substr(0, 10),
      hp: {
        value: data.attributes.hp.value,
        max: data.attributes.hp.max
      },
      ac: data.attributes.ac.value ? data.attributes.ac.value : 10,
      spellDC: data.attributes.spelldc,
      speed: data.attributes.speed.value,

      // passive stuff
      passives: {
        perception: data.skills.prc.passive,
        investigation: data.skills.inv.passive,
        insight: data.skills.ins.passive,
        stealth: data.skills.ste.passive
      },

      // details
      languages: data.traits.languages.value.map(
        code => CONFIG.DND5E.languages[code]
      ),
      alignment: data.details.alignment
    };
  }

  activateListeners(html) {
    console.log("Activating listeners");
    let nav = $('.tabs[data-group="party"]');
    nav.find(".tab[data-tab='" + this.activeTab + "']").addClass("active");
    new Tabs(nav, {
      initial: this.activeTab ? this.activeTab : "General",
      callback: tab => {
        console.log(tab.attr("data-tab"));
        this.activeTab = tab.attr("data-tab");
      }
    });

    $(".btn-toggle-visibility").on("click", event => {
      const actorId = event.currentTarget.dataset.actor;
      this.hiddenActors = this.hiddenActors.includes(actorId)
        ? this.hiddenActors.filter(id => id !== actorId)
        : [...this.hiddenActors, actorId];
      this.render(false);
    });

    $(".btn-filter").on("click", event => {
      this.displayMode =
        this.displayMode === DISPLAY_MODE.SHOW_ALL
          ? DISPLAY_MODE.SHOW_VISIBLE
          : this.displayMode === DISPLAY_MODE.SHOW_VISIBLE
          ? DISPLAY_MODE.SHOW_HIDDEN
          : DISPLAY_MODE.SHOW_ALL;
      this.render(false);
    });
  }

  onHoverToken(token, hovered) {
    console.log("HOVERED: " + hovered);

    if (!token || !token.actor) return;

    if (hovered) {
      this.tooltip.show();
    } else {
      this.tooltip.hide();
    }

    // Tooltips enabled/ disabled?
    if (!game.settings.get("vtta-party", "EnableTooltip")) return;
    if (
      !game.settings.get("vtta-party", "EnablePlayerAccessTooltip") &&
      !game.user.isGM
    )
      return;

    let data;
    let seenBy;
    console.log(token.actor.isPC);
    if (token.actor.isPC) {
      data = this.state.actors.find(actor => actor.id === token.actor.id);
      if (data) {
        console.log(data);
      }
    } else {
      // could be a mob
      data = this.getActorDetails(token.actor);
      seenBy = "No-one";
      if (token.data.hidden) {
        seenBy = this.state.actors
          .filter(actor => actor.passives.perception >= data.passives.stealth)
          .map(actor => actor.name)
          .join(", ");
      }
    }

    let template = `
      <div class="section">
        <div class="value"><i class="fas fa-shield-alt"></i> ${data.ac}</div>
        ${
          token.data.hidden && seenBy
            ? `<div class="value"><i class="fas fa-eye-slash"></i> ${data.passives.stealth}</div><div class="value">Can be seen by: ${seenBy}</div>`
            : ""
        }
      </div>
      <div class="section">
        <div class="value"><i class="far fa-eye"></i><span>${
          data.passives.perception
        }</span></div>
        <div class="value"><i class="fas fa-search"></i><span>${
          data.passives.investigation
        }</span></div>
        <div class="value"><i class="fas fa-brain"></i><span>${
          data.passives.insight
        }</span></div>
      </div>
    `;
    console.log(data);
    this.tooltip.setContent(template);
  }
}

export default App;
