// prettier-ignore
import { SystemProvider, archmageProvider, bitdProvider, dccProvider, dnd35eProvider, dnd4eProvider, dnd5eProvider, pf1Provider, pf2eProvider,
	scumAndVillainyProvider, sfrpgProvider, swadeProvider, tormenta20Provider, wfrp4eProvider, cyphersystemProvider, CoC7Provider, GURPSProvider} from "./SystemProvider.js";

export const availableSystemProviders = {};
export let currentSystemProvider = undefined;

function register(module, type, systemProvider) {
	const id = `${type}.${module.id}`;
	let providerInstance = new systemProvider(id);
	setupProvider(providerInstance);
}

function setupProvider(systemProvider) {
	availableSystemProviders[systemProvider.id] = systemProvider;
	game.settings.settings.get("party-overview.systemProvider").default = getDefaultSystemProvider();
	updateSystemProvider();
}

export function getDefaultSystemProvider() {
	const providerIds = Object.keys(availableSystemProviders);
	if (!providerIds.length) return;
	// Game systems take the highest precedence for the being the default
	const gameSystem = providerIds.find((key) => key.startsWith("system.") || key.includes(game.system.id));
	if (gameSystem) return gameSystem;

	// If no game system is registered modules are next up.
	// For lack of a method to select the best module we're just falling back to taking the next best module
	// settingKeys should always be sorted the same way so this should achive a stable default
	const module = providerIds.find((key) => key.startsWith("module."));
	if (module) return module;

	// If neither a game system or a module is found fall back to the native implementation
	return providerIds[0];
}

export function updateSystemProvider() {
	// If the configured provider is registered use that one. If not use the default provider
	const configuredProvider = game.settings.get("party-overview", "systemProvider");
	currentSystemProvider = availableSystemProviders[configuredProvider] ?? availableSystemProviders[game.settings.settings.get("party-overview.systemProvider").default];
}

export function initApi() {
	const systemProviders = [];
	switch (game.system.id) {
		case "archmage":
			systemProviders.push(new archmageProvider("native.archmage"));
			break;
		case "blades-in-the-dark":
			systemProviders.push(new bitdProvider("native.blades-in-the-dark"));
			break;
		case "dcc":
			systemProviders.push(new dccProvider("native.dcc"));
			break;
		case "D35E":
			systemProviders.push(new dnd35eProvider("native.D35E"));
			break;
		case "dnd4e":
			systemProviders.push(new dnd4eProvider("native.dnd4e"));
			break;
		case "dnd5e":
			systemProviders.push(new dnd5eProvider("native.dnd5e"));
			break;
		case "pf1":
			systemProviders.push(new pf1Provider("native.pf1"));
			break;
		case "pf2e":
			systemProviders.push(new pf2eProvider("native.pf2e"));
			break;
		case "scum-and-villainy":
			systemProviders.push(new scumAndVillainyProvider("native.scum-and-villainy"));
			break;
		case "sfrpg":
			systemProviders.push(new sfrpgProvider("native.swade"));
			break;
		case "swade":
			systemProviders.push(new swadeProvider("native.swade"));
			break;
		case "tormenta20":
			systemProviders.push(new tormenta20Provider("native.tormenta20"));
			break;
		case "wfrp4e":
			systemProviders.push(new wfrp4eProvider("native.wfrp4e"));
			break;
		case 'cyphersystem':
			systemProviders.push(new cyphersystemProvider("native.cyphersystem"));
			break;
		case "CoC7":
			systemProviders.push(new CoC7Provider("native.coc7"));
			break;
		case "gurps":
			systemProviders.push(new GURPSProvider("native.gurps"));
			break;
		default:
			systemProviders.push(new SystemProvider("native"));
			break;
	}
	for (let systemProvider of systemProviders) availableSystemProviders[systemProvider.id] = systemProvider;
	game.settings.settings.get("party-overview.systemProvider").default = getDefaultSystemProvider();
	updateSystemProvider();
}

export function registerModule(moduleId, systemProvider) {
	// Check if a module with the given id exists and is currently enabled
	const module = game.modules.get(moduleId);
	// If it doesn't the calling module did something wrong. Log a warning and ignore this module
	if (!module) {
		console.warn(
			`Party Overview | A module tried to register with the id "${moduleId}". However no active module with this id was found.` +
				"This api registration call was ignored. " +
				"If you are the author of that module please check that the id passed to `registerModule` matches the id in your manifest exactly." +
				"If this call was made form a game system instead of a module please use `registerSystem` instead."
		);
		return;
	}
	// Using party-overview's id is not allowed
	if (moduleId === "party-overview") {
		console.warn(
			`Party Overview | A module tried to register with the id "${moduleId}", which is not allowed. This api registration call was ignored. ` +
				"If you're the author of the module please use the id of your own module as it's specified in your manifest to register to this api. " +
				"If this call was made form a game system instead of a module please use `registerSystem` instead."
		);
		return;
	}

	register(module, "module", systemProvider);
}

export function registerSystem(systemId, systemProvider) {
	const system = game.system;
	// If the current system id doesn't match the provided id something went wrong. Log a warning and ignore this module
	if (system.id != systemId) {
		console.warn(
			`Party Overview | A system tried to register with the id "${systemId}". However the active system has a different id.` +
				"This api registration call was ignored. " +
				"If you are the author of that system please check that the id passed to `registerSystem` matches the id in your manifest exactly." +
				"If this call was made form a module instead of a game system please use `registerModule` instead."
		);
		return;
	}

	register(system, "system", systemProvider);
}
