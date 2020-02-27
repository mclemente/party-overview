/**
 * Name of this Sub-Application
 */
const APP_VTTA_PARTY = {
  name: 'main',
  title: 'VTTA Party',
};

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});

class VTTAPartyMain extends FormApplication {
  constructor(entity, options) {
    super(entity, options);
    this.log('VTTA Party | Module loaded');

    this.library = new VTTAPartyLibrary();
    this.filter = 'none';

    // prefill it with the current player info
    this.library.updatePlayers();
    if (game.scenes.active !== null) {
      // and update the currently active players
      this.library.update();
    }
  }

  activateListeners(html) {
    super.activateListeners(html);

    // Eventhandler for Filterbutton
    $(html)
      .find('button.btn-filter')
      .click(event => {
        this.filter = this.filter === 'none' ? 'hidden' : this.filter === 'hidden' ? 'visible' : 'none';
        this.render(false);
      });

    // Event Handler for toggling an actors visibility
    $(html)
      .find('button.btn-toggle-visibility')
      .click(event => {
        event.preventDefault();
        this.library.toggleVisibility(event.currentTarget.dataset.actor);
        this.render(false);
      });
  }

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.template = 'modules/' + VTTAParty.name() + '/app/' + APP_VTTA_PARTY.name + '/template.hbs';
    options.width = 520;
    options.height = 520; // should be 'auto', but foundry has problems with dynamic content
    options.title = APP_VTTA_PARTY.title;

    console.log('Options: ');
    console.log(options);
    return options;
  }

  /**
   * Provides data to the form, which then can be rendered using the handlebars templating engine
   */
  getData() {
    let result = {
      name: VTTAParty.name(),
      filter: this.filter,
      data: this.library.getData(this.filter),
    };
    return result;
  }

  // send a formatted log message to console.log
  log = obj => {
    if (typeof obj === 'string') {
      console.log(VTTAParty.name() + ' | ' + obj);
    } else {
      console.log(VTTAParty.name() + ':');
    }
  };

  // try to get
  startScenePolling() {
    this.activeScene = game.scenes.active ? game.scenes.active._id : null;
    this.interval = setInterval(() => {
      if (!game.scenes.active) return;
      if (this.activeScene !== game.scenes.active._id) {
        this.activeScene = game.scenes.active._id;
        this.library.update();
        this.render(false);
      }
    }, 500);
  }

  stopScenePolling() {
    clearInterval(this.interval);
  }
}

/**
 * Implement Hooks to render the Application, e.g.
 */
let vttaPartyMain = undefined;
var tooltip = null;

Hooks.on('ready', () => {
  console.log('Initializing VTTA Party');
  vttaPartyMain = new VTTAPartyMain();
  vttaPartyMain.startScenePolling();

  tooltip = $('<div class="vtta-party-tooltip"></div>');

  function onMouseUpdate(event) {
    tooltip.css('left', event.pageX + 10 + 'px');
    tooltip.css('top', event.pageY + 10 + 'px');
  }

  $('body.game').append(tooltip);
  document.addEventListener('mousemove', onMouseUpdate, false);
  document.addEventListener('mouseenter', onMouseUpdate, false);
});

Hooks.on('renderActorDirectory', (app, html, data) => {
  if (game.user.isGM || game.settings.get('vtta-party', 'EnablePlayerAccess')) {
    let button = $('<button id="vtta-party-button"><i class="fas fa-info-circle"></i></button>');
    button.on('click', e => {
      vttaPartyMain.log('requesting render');
      vttaPartyMain.render(true);
    });

    $(html)
      .find('header.directory-header')
      .prepend(button);

    /*    $(html)
      .children()
      .first()
      .prepend(button);
      */
  }
});

Hooks.on('createToken', token => {
  if (!token.scene.active) return;

  vttaPartyMain.library.updatePlayer(token.actor, true);
  vttaPartyMain.render(false);
});

//Scene<Entity>, sceneId<string>, updateData<Object>, options<Object>, userId <string>
Hooks.on('updateToken', (scene, sceneId, updateData, options, userId) => {
  console.log(params);
  if (!scene.active) return;

  vttaPartyMain.library.updatePlayer(token.actor);
  vttaPartyMain.render(false);
});

Hooks.on('deleteToken', token => {
  if (!token.scene.active) return;

  vttaPartyMain.library.deletePlayer(token.actor);
  vttaPartyMain.render(false);
});

Hooks.on('createActor', actor => {
  vttaPartyMain.library.updatePlayer(actor);
  vttaPartyMain.render(false);
});

Hooks.on('updateActor', actor => {
  vttaPartyMain.library.updatePlayer(actor);
  vttaPartyMain.render(false);
});

Hooks.on('deleteActor', actor => {
  vttaPartyMain.library.deletePlayer(actor);
  vttaPartyMain.render(false);
});

// Tooltip on hover
Hooks.on('hoverToken', (object, hovered) => {
  // Tooltips enabled/ disabled?
  if (!game.settings.get('vtta-party', 'EnableTooltip')) return;
  if (!game.settings.get('vtta-party', 'EnablePlayerAccessTooltip') && !game.user.isGM) return;

  // valid actor data on the token? Could be orphaned
  if (object === null || !object.actor) return;
  if (!game.user.isGM && !object.actor.owner) return;

  // parse info
  let info = null;
  try {
    info = {
      ac: isNaN(parseInt(object.actor.data.data.attributes.ac.value))
        ? 10
        : parseInt(object.actor.data.data.attributes.ac.value),
      passives: {
        perception: 10 + parseInt(object.actor.data.data.skills.prc.mod),
        investigation: 10 + parseInt(object.actor.data.data.skills.inv.mod),
        insight: 10 + parseInt(object.actor.data.data.skills.ins.mod),
        stealth: 10 + parseInt(object.actor.data.data.skills.ste.mod),
      },
    };
  } catch (error) {
    return;
  }

  // display the tooptip
  if (hovered) {
    console.log('Hidden token? ' + object.data.hidden);
    let template = null;
    if (object.data.hidden) {
      console.log('Token is hidden');
      template = $(`
    <div class="section">
      <div class="value"><i class="fas fa-shield-alt"></i> ${info.ac}</div>
      <div class="value"><i class="fas fa-eye-slash"></i> ${info.passives.stealth}</div>
    </div>
    <div class="section">
      <div class="value"><i class="far fa-eye"></i><span>${info.passives.perception}</span></div>
      <div class="value"><i class="fas fa-search"></i><span>${info.passives.investigation}</span></div>
      <div class="value"><i class="fas fa-brain"></i><span>${info.passives.insight}</span></div>
    </div>`);
    } else {
      template = $(`
      <div class="section"><div class="value"><i class="fas fa-shield-alt"></i> ${info.ac}</div></div>
      <div class="section">
        <div class="value"><i class="far fa-eye"></i><span>${info.passives.perception}</span></div>
        <div class="value"><i class="fas fa-search"></i><span>${info.passives.investigation}</span></div>
        <div class="value"><i class="fas fa-brain"></i><span>${info.passives.insight}</span></div>
      </div>`);
    }
    tooltip.html(template);
    tooltip.addClass('visible');
  } else {
    tooltip.removeClass('visible');
  }
});
