import { currentSystemProvider } from "./api.js";

const DISPLAY_MODE = {
	SHOW_ALL: "SHOW_ALL",
	SHOW_HIDDEN: "SHOW_HIDDEN",
	SHOW_VISIBLE: "SHOW_VISIBLE",
};

class PartyOverviewApp extends Application {
	constructor(options) {
		super(options);

		this.hiddenActors = [];
		this.state = {};
		this.displayMode = DISPLAY_MODE.SHOW_VISIBLE;
		this.activeTab = "general";
	}


	update() {
		let actors = game.actors.contents
			.filter(a => a.hasPlayerOwner)
			.map(playerActor => playerActor.getActiveTokens())
			.flat(1)
			.map(token => token.actor);

		// remove duplicates if an actors has multiple tokens on scene
		actors = actors.reduce(
			(actors, actor) => (actors.map(a => a.id).includes(actor.id) ? actors : [...actors, actor]),
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
			return {
				...currentSystemProvider.getActorDetails(actor),
				shortName: actor.name.split(/\s/).shift(),
				shortestName:
					actor.name.split(/\s/).shift().length > 10
						? actor.name.split(/\s/).shift().substr(0, 10) + "…"
						: actor.name.split(/\s/).shift().substr(0, 10),
				isHidden: this.hiddenActors.includes(actor.id)
			}
		});

		let updates;
		[actors, updates] = currentSystemProvider.getUpdate(actors);

		this.state = {
			activeTab: this.activeTab,
			mode: this.displayMode,
			actors: actors,
			...updates
		};
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			width: currentSystemProvider.width,
			height: "fit-content",
			resizable: true,
			title: "Party Overview",
			template: currentSystemProvider.template,
			classes: ["party-overview", game.system.id],
			tabs: [
				{
					navSelector: ".tabs",
					contentSelector: ".content",
					initial: "general",
				},
			],
		});
	}

	getData() {
		this.update();
		return this.state;
	}

	activateListeners(html) {
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


		$('span[name="hpCurrent"], span[name="hpMax"]', html).hover(
			function () {
				const data = $(this).data();
				$(this).text(data.temp ? `${data.value} (+${data.temp})` : data.value);
			},
			function () {
				const data = $(this).data();
				$(this).text(`${data.total}`);
			}
		);

		super.activateListeners(html);
	}

}

export default PartyOverviewApp;
