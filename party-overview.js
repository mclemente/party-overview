import { currentSystemProvider, initApi } from "./module/api.js";
import PartyOverviewApp from "./module/logic.js";
import { registerApiSettings, registerSettings } from "./module/settings.js";

Hooks.once("init", () => {
	registerSettings();
	initApi();
	registerApiSettings();

	if (game.keybindings) {
		game.keybindings.register("party-overview", "openPartyOverview", {
			name: game.i18n.localize("party-overview.keybinds.open.name"),
			hint: game.i18n.localize("party-overview.keybinds.open.hint"),
			onDown: () => {
				game.partyOverview.render(true);
			},
			onUp: () => {},
			precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
		});
		game.keybindings.register("party-overview", "closePartyOverview", {
			name: game.i18n.localize("party-overview.keybinds.close.name"),
			hint: game.i18n.localize("party-overview.keybinds.close.hint"),
			onDown: () => {
				game.partyOverview.close();
			},
			onUp: () => {},
			precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
		});
		game.keybindings.register("party-overview", "togglePartyOverview", {
			name: game.i18n.localize("party-overview.keybinds.toggle.name"),
			hint: game.i18n.localize("party-overview.keybinds.toggle.hint"),
			onDown: () => {
				if (!game.partyOverview.rendering) game.partyOverview.render(true);
				else game.partyOverview.close();
			},
			onUp: () => {},
			precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
		});
	}
	return loadTemplates([
		"modules/party-overview/templates/parts/Tabs.html",
		"modules/party-overview/templates/parts/FilterButton.html",
		"modules/party-overview/templates/parts/ToggleVisibilityButton.html",
		"modules/party-overview/templates/parts/Languages.html",
		...currentSystemProvider.loadTemplates,
	]);
});

Hooks.on("ready", () => {
	game.partyOverview = new PartyOverviewApp();
	if (game.modules.get("stream-view")?.active && game?.user?.id === game.settings.get("stream-view", "user-id")) game.partyOverview.render(true);
});

Hooks.on("renderActorDirectory", (app, html, data) => {
	if (!game.user.isGM && !game.settings.get("party-overview", "EnablePlayerAccess")) return;
	if (html.querySelector(".party-overview-button")) return;

	const button = document.createElement("button");
	button.className = `party-overview-button ${currentSystemProvider.customCSS}`;
	button.innerHTML = `<i class="fas fa-users"></i> Party Overview`;

	button.addEventListener("click", (e) => game.partyOverview.render(true));

	// assuming `html` is a jQuery object, you’ll want its raw element:
	const container = html.querySelector(".header-actions");
	if (container) container.prepend(button);
});

Hooks.on("updateActor", (actor, data, options, userId) => {
	if (game.partyOverview.rendering && actor.hasPlayerOwner) {
		game.partyOverview.render(false);
	}
});

Hooks.on("updateToken", (token, data, options, userId) => {
	if (game.partyOverview.rendering && token.actor?.hasPlayerOwner) {
		game.partyOverview.render(false);
	}
});

Hooks.on("createToken", (token, options, userId) => {
	if (game.partyOverview.rendering && game.actors.contents.find((actor) => actor.id === token.actor.id).hasPlayerOwner) {
		game.partyOverview.render(false);
	}
});

Hooks.on("deleteActor", (actor, options, userId) => {
	if (game.partyOverview.rendering && actor.hasPlayerOwner) {
		game.partyOverview.render(false);
	}
});

Hooks.on("deleteToken", (token, options, userId) => {
	if (game.partyOverview.rendering && token.actor?.hasPlayerOwner) {
		game.partyOverview.render(false);
	}
});

Hooks.on("canvasInit", (canvas) => {
	if (game.partyOverview?.rendering) {
		// what a hack! the hook is fired when the scene switch is not yet activated, so we need
		// to wait a tiny bit. The combat tracker is rendered last, so the scene should be available
		Hooks.once("renderCombatTracker", (app, html, data) => {
			game.partyOverview.render(false);
		});
	}
});
