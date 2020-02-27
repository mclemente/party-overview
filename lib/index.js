class VTTAPlayer {
  constructor(actor) {
    this.id = actor._id;
    this.update(actor);
    // is manually hidden?
    this.isHidden = false;
    // is active on the currently active scene?
    this.isActive = false;

    this.isMarkedForDeletion = false;
  }

  toggleVisibility() {
    this.isHidden = !this.isHidden;
  }

  hide() {
    this.isHidden = true;
  }

  show() {
    this.isHidden = false;
  }

  update(actor) {
    this.fullName = actor.data.name;
    this.shortName = this.fullName.split(' ').shift();
    this.hp = {
      current: parseInt(actor.data.data.attributes.hp.value),
      max: parseInt(actor.data.data.attributes.hp.max),
    };
    this.ac = isNaN(parseInt(actor.data.data.attributes.ac.value)) ? 10 : parseInt(actor.data.data.attributes.ac.value);
    this.spellDC = parseInt(actor.data.data.attributes.spelldc.value);
    this.passives = {
      perception: 10 + parseInt(actor.data.data.skills.prc.mod),
      investigation: 10 + parseInt(actor.data.data.skills.inv.mod),
      insight: 10 + parseInt(actor.data.data.skills.ins.mod),
      stealth: 10 + parseInt(actor.data.data.skills.ste.mod),
    };
  }
}

class VTTAPartyLibrary {
  constructor() {
    this.name = 'VTTAPartyLibrary';
    this.players = [];
    this.hiddenPlayers = [];
  }

  getName() {
    return this.name;
  }

  /**
   * Builds the Player list from scratch or updates it
   */
  updatePlayers() {
    // mark every player stub for deletion
    this.players.forEach(player => (player.isMarkedForDeletion = true));

    // get all players from the game
    let actors = game.actors.entities.filter(actor => actor.isPC);

    // update/ create all players
    actors.forEach(player => {
      this.updatePlayer(player);
    });

    // clean up any non-existing players from our collection
    this.players = this.players.filter(player => !player.isMarkedForDeletion);
  }

  toggleVisibility(playerId) {
    this.players.find(player => player.id === playerId).toggleVisibility();
  }

  /**
   * Updates a single player. Is used only from updatePlayers()
   * @param {Actor5e} actor
   */
  updatePlayer(actor) {
    if (!actor.isPC) return;
    let existing = this.players.find(player => player.id === actor._id);
    if (existing) {
      // updating an existing one
      existing.update(actor);
      existing.isMarkedForDeletion = false;
    } else {
      // creating a new one
      this.players.push(new VTTAPlayer(actor));
    }
    this.update();
  }

  getPlayer(actor) {
    return this.players.find(player => player.id === actor._id);
  }

  /**
   * Deletes a player from the list
   * @param {Actor5e} id
   */
  deletePlayer(actor) {
    if (!actor.isPC) return;
    // remove the player if that was the last active token on the current scene
    if (game.scenes.active.data.tokens.filter(token => token.actorId === actor._id).length === 0) {
      this.players = this.players.filter(player => player.id !== actor._id);
    }
  }

  /**
   * updates visibility of the players based on the currently displayed scene
   */
  update() {
    if (!game.scenes.active) return;
    // set all tokens for this scene to inactive as a baseline
    this.players.forEach(player => (player.isActive = false));

    // get all player IDs for comparing to the active tokens on the sceene
    let playerIds = this.players.map(player => player.id);

    let tokens = game.scenes.active.data.tokens.filter(token => {
      if (token.actorId === null) return false;
      if (!playerIds.includes(token.actorId)) return false;

      // if it's a player token, then we want it on the scene
      return true;
    });
    // set all remaining tokens to active
    tokens.forEach(token => {
      let player = this.players.find(player => player.id === token.actorId);
      if (player) {
        player.isActive = true;
      }
    });
  }

  getData(filter) {
    // return a list of active and non-hidden players
    let filteredPlayers = null;
    switch (filter) {
      case 'none':
        filteredPlayers = this.players.filter(player => player.isActive).sort((a, b) => a.fullName < b.fullName);
        break;
      case 'hidden':
        filteredPlayers = this.players
          .filter(player => player.isActive && player.isHidden === true)
          .sort((a, b) => a.fullName < b.fullName);
        break;
      case 'visible':
        filteredPlayers = this.players
          .filter(player => player.isActive && player.isHidden === false)
          .sort((a, b) => a.fullName < b.fullName);
    }
    return filteredPlayers;
  }
}
