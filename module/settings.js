import { availableSystemProviders, currentSystemProvider, getDefaultSystemProvider, updateSystemProvider } from "./api.js";

export function registerSettings() {
	game.settings.registerMenu("party-overview", "PartyOverviewSystemSettings", {
		name: "Party Overview System Settings",
		label: "Party Overview System Settings",
		icon: "fas fa-users",
		type: SystemProviderSettings,
		restricted: true,
	});
	game.settings.register("party-overview", "EnablePlayerAccess", {
		name: game.i18n.localize(`party-overview.EnablePlayerAccess.Name`),
		hint: game.i18n.localize(`party-overview.EnablePlayerAccess.Hint`),
		scope: "world",
		default: true,
		config: true,
		type: Boolean,
	});
	game.settings.register("party-overview", "systemProvider", {
		scope: "world",
		config: false,
		type: String,
		default: getDefaultSystemProvider(),
		onChange: updateSystemProvider,
	});
	game.settings.register("party-overview", "hiddenActors", {
		scope: "world",
		config: false,
		type: Array,
		default: [],
	});
}

export function registerApiSettings() {
	game.settings.register("party-overview", "tabVisibility", {
		scope: "world",
		config: false,
		type: Object,
		default: currentSystemProvider.tabs,
		// onChange: updateSystemProvider,
	});
}

export class SystemProviderSettings extends FormApplication {
	constructor(object, options = {}) {
		super(object, options);
	}

	/**
	 * Default Options for this FormApplication
	 */
	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			id: "party-overview-form",
			title: "Party Overview System Settings",
			template: "./modules/party-overview/templates/SystemProviderSettings.hbs",
			classes: ["sheet"],
			width: 600,
			closeOnSubmit: true,
		});
	}

	getData(options) {
		const data = {};
		const selectedProvider = currentSystemProvider.id;
		// Insert all speed providers into the template data
		data.providers = Object.values(availableSystemProviders).map((systemProvider) => {
			const provider = {};
			provider.id = systemProvider.id;
			let dotPosition = provider.id.indexOf(".");
			if (dotPosition === -1) dotPosition = provider.id.length;
			const type = provider.id.substring(0, dotPosition);
			const id = provider.id.substring(dotPosition + 1);
			if (type === "native") {
				let title = id == game.system.id ? game.system.title : id;
				provider.selectTitle = (game.i18n.localize("party-overview.SystemProvider.choices.native") + " " + title).trim();
			} else {
				if (type === "module") {
					var name = game.modules.get(id).title;
				} else {
					name = game.system.title;
				}
				provider.selectTitle = game.i18n.format(`party-overview.SystemProvider.choices.${type}`, { name });
			}
			provider.isSelected = provider.id === selectedProvider;
			return provider;
		});

		data.providerSelection = {
			id: "systemProvider",
			name: game.i18n.localize("party-overview.SystemProvider.Name"),
			hint: game.i18n.localize("party-overview.SystemProvider.Hint"),
			type: String,
			choices: data.providers.reduce((choices, provider) => {
				choices[provider.id] = provider.selectTitle;
				return choices;
			}, {}),
			value: selectedProvider,
			isCheckbox: false,
			isSelect: true,
			isRange: false,
		};

		data.tabs = {};
		const tabs = game.settings.get("party-overview", "tabVisibility");
		for (let tab in tabs) {
			data.tabs[tab] = {
				id: `tabs.${tab}`,
				name: game.i18n.localize(tabs[tab].localization),
				hint: "",
				type: Boolean,
				value: tabs[tab].visible,
				isCheckbox: true,
				isSelect: false,
				isRange: false,
			};
		}
		for (let tab in currentSystemProvider.tabs) {
			if (!data.tabs[tab]) {
				data.tabs[tab] = {
					id: `tabs.${tab}`,
					name: game.i18n.localize(currentSystemProvider.tabs[tab].localization),
					hint: "",
					type: Boolean,
					value: true,
					isCheckbox: true,
					isSelect: false,
					isRange: false,
				};
			}
		}

		return { data };
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find("button").on("click", async (event) => {
			if (event.currentTarget?.dataset?.action === "reset") {
				game.settings.settings.get("party-overview.systemProvider").default = getDefaultSystemProvider();
				await game.settings.set("party-overview", "tabVisibility", currentSystemProvider.tabs);
				this.close();
				SettingsConfig.reloadConfirm({ world: true });
			}
		});
	}

	/**
	 * Executes on form submission
	 * @param {Event} ev - the form submission event
	 * @param {Object} formData - the form data
	 */
	async _updateObject(ev, formData) {
		game.settings.set("party-overview", "systemProvider", formData.systemProvider);
		const tabs = game.settings.get("party-overview", "tabVisibility");
		for (let element of Object.keys(formData)) {
			if (element.startsWith("tabs.")) {
				const name = element.replace("tabs.", "");
				if (!tabs[name]) {
					tabs[name] = {
						id: currentSystemProvider.tabs[name].id,
						localization: currentSystemProvider.tabs[name].localization,
						visible: formData[element],
					};
				} else tabs[name].visible = formData[element];
			}
		}
		game.settings.set("party-overview", "tabVisibility", tabs);
		updateSystemProvider();
	}
}
