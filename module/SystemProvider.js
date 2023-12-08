function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

export class SystemProvider {
	/**
	 * The provider's ID. You can also use this function for setting Handlebars helpers.
	 * @param {String} id
	 */
	constructor(id) {
		this.id = id;
	}

	/**
	 * In case the system uses a styling different from vanilla Foundry (e.g. WFRP4e).
	 */
	get customCSS() {
		return "";
	}

	/**
	 * If the system provider has parts to be loaded during the startup.
	 */
	get loadTemplates() {
		return [];
	}

	/**
	 * Tabs to be toggled by the GM for users to see.
	 * Example:
	 * {
	 * 	saves: { id: "saves", visible: true, localization: "Saving Throws" },
	 * }
	 */
	get tabs() {
		return {};
	}

	/**
	 * The template with the actual data.
	 */
	get template() {
		return "/modules/party-overview/templates/generic.hbs";
	}

	/**
	 * Default width for the system's overview.
	 */
	get width() {
		return 500;
	}

	/**
	 * Handles calculation of a single actor's data (e.g. actor's total wealth).
	 * @param {Document} actor
	 */
	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			hp: data.attributes?.hp || data.hp,
		};
	}

	/**
	 * Handles calculations of all the actors' data (e.g. party's total wealth).
	 * @param {Array} actors
	 * @returns [Array, Object]
	 */
	getUpdate(actors) {
		return [actors, {}];
	}

	actorFilter(actor) {
		return actor.hasPlayerOwner;
	}
}

export class archmageProvider extends SystemProvider {
	constructor(id) {
		super(id);
		Handlebars.registerHelper("partyOverviewGetSkillList", function (skill, actors, opt) {
			return actors.map((actor) => {
				return {
					...(actor.icons[skill] || { bonus: 0, relationship: "" }),
				};
			});
		});
	}

	get tabs() {
		return {
			backgrounds: { id: "backgrounds", visible: true, localization: "ARCHMAGE.backgrounds" },
			coins: { id: "coins", visible: true, localization: "party-overview.WEALTH" },
			icons: { id: "icons", visible: true, localization: "ARCHMAGE.iconRelationships" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/archmage.hbs";
	}

	getBackgrounds(backgrounds) {
		const bg = [];
		for (const [key, value] of Object.entries(backgrounds)) {
			if (value.name.value) bg.push(`${value.name.value} (${value.bonus.value > -1 ? "+" : ""}${value.bonus.value})`);
		}
		return bg.join(", ");
	}

	getIcons(icons) {
		const relationships = {
			Positive: "+",
			Negative: "-",
			Conflicted: "~",
		};
		const iconFilter = {};
		Object.keys(icons)
			.filter((icon) => icons[icon].relationship.value.length > 0)
			.map((icon) => {
				iconFilter[icons[icon].name.value] = {
					bonus: icons[icon].bonus.value,
					relationship: relationships[icons[icon].relationship.value],
					results: icons[icon].results,
				};
			});
		return iconFilter;
	}

	getTotalGP(coins) {
		return coins.copper / 100 + coins.silver / 10 + coins.gold + coins.platinum * 10;
	}

	getActorDetails(actor) {
		const data = actor.system;
		const coins = {
			copper: 0,
			gold: 0,
			platinum: 0,
			silver: 0,
		};
		if (data.coins) {
			Object.keys(data.coins).forEach((coin) => {
				coins[coin] = data.coins[coin].value ?? 0;
			});
		}
		return {
			id: actor.id,
			name: actor.name,
			hp: data.attributes.hp,
			ac: data.attributes.ac,
			pd: data.attributes.pd,
			md: data.attributes.md,
			recoveries: data.attributes?.recoveries ?? { value: 0, max: 0 },

			backgrounds: data.backgrounds ? this.getBackgrounds(data.backgrounds) : "",
			icons: data.icons ? this.getIcons(data.icons) : {},

			coins: coins,
			totalGP: this.getTotalGP(coins).toFixed(2),
		};
	}

	getUpdate(actors) {
		let totalCurrency = actors.reduce(
			(currency, actor) => {
				for (let prop in actor.coins) {
					currency[prop] += actor.coins[prop];
				}
				return currency;
			},
			{
				copper: 0,
				silver: 0,
				gold: 0,
				platinum: 0,
			}
		);
		let totalPartyGP = actors.reduce((totalGP, actor) => totalGP + parseFloat(actor.totalGP), 0).toFixed(2);
		let icons = new Set();
		actors.forEach((actor) => {
			Object.keys(actor.icons).forEach((icon) => {
				icons.add(icon);
			});
		});
		icons = Array.from(icons).sort();

		// .filter((lore) => lore !== undefined)
		// .map((icon) => icon.property)
		// .sort();
		// actors = actors.map((actor) => {
		// 	return {
		// 		...actor,
		// 		lore: lores.map((lore) => actor.lore && actor.lore.includes(lore)),
		// 	};
		// });
		return [
			actors,
			{
				totalCurrency: totalCurrency,
				totalPartyGP: totalPartyGP,
				icons,
			},
		];
	}
}

export class bitdProvider extends SystemProvider {
	get template() {
		return "/modules/party-overview/templates/blades-in-the-dark.hbs";
	}

	getHarm(data) {
		let result = [];
		if (data.harm.light.one || data.harm.light.two) result.push(game.i18n.localize("BITD.LessEffect"));
		if (data.harm.medium.one || data.harm.medium.two) result.push("-1D");
		if (data.harm.heavy.one) result.push(game.i18n.localize("BITD.NeedHelp"));
		return result.join(", ");
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			stress: data.stress,
			coins: data.coins,
			harm: this.getHarm(data),
		};
	}
}

export class dccProvider extends SystemProvider {
	get template() {
		return "/modules/party-overview/templates/dcc.hbs";
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			hp: data.attributes.hp,
			abilities: data.abilities,
			saves: data.saves,
			armor: data.attributes.ac.value,
			skills: data.skills,
		};
	}
}

export class demonlordProvider extends SystemProvider {
	get template() {
		return "/modules/party-overview/templates/demonlord.hbs";
	}

	get width() {
		return 700;
	}

	get tabs() {
		return {
			paths: { id: "paths", visible: true, localization: "Paths" },			
			currencies: { id: "currencies", visible: true, localization: "DL.CharWealth" },
			languagessp: { id: "languagessp", visible: true, localization: "party-overview.DemonLord.LanguagesSpoken" },
			languagessc: { id: "languagessc", visible: true, localization: "party-overview.DemonLord.LanguagesScript" }
		};
	}

	getTotalGC(wealth) {
		return (wealth.bits / 1000 + wealth.cp / 100 + wealth.ss / 10 + wealth.gc * 1).toFixed(2);
	}

	getLanguages(actor, skill) {
		const langs = [];
		let languages = actor.items.filter((item) => item.type === 'language')
		for (const language of languages) {
			let shortLang = language.name.split(' ');
			let languageName = shortLang[0];
			switch (skill) {
				case 'spoken':
					if (language.system.speak) langs.push(languageName);
					break;
				case 'script':
					if ((language.system.read) || (language.system.write)) langs.push(languageName);
					break;
			}
		}
		return langs;
	}

	getActorDetails(actor) {
		const data = actor.system;
		let paths = [];
		paths = actor.items.filter((item) => item.type === 'path');
		return {
			id: actor.id,
			name: actor.name,
			health: data.characteristics.health,
			corruption: data.characteristics.corruption,
			insanity: data.characteristics.insanity,
			defense: data.characteristics.defense,
			speed: data.characteristics.speed,
			perception: data.attributes.perception,
			fortune: data.characteristics.fortune,
			power: data.characteristics.power,
			size: data.characteristics.size,
			currency: data.wealth,
			spoken: this.getLanguages(actor,'spoken'),
			script: this.getLanguages(actor,'script'),
			totalGC: this.getTotalGC(data.wealth),
			ancestry: actor.items.find((item) => item.type === 'ancestry') ? actor.items.find((item) => item.type === 'ancestry').name :'—',
			novicePath: paths.find((path) => path.system.type === 'novice') ? paths.find((path) => path.system.type === 'novice').name : '—',
			masterPath: paths.find((path) => path.system.type === 'master') ? paths.find((path) => path.system.type === 'master').name : '—',
			expertPath: paths.find((path) => path.system.type === 'expert') ? paths.find((path) => path.system.type === 'expert').name : '—',
			legendaryPath: paths.find((path) => path.system.type === 'legendary') ? paths.find((path) => path.system.type === 'legendary').name : '—'
		};
	}

	getUpdate(actors) {
		let script = actors
			.reduce((script, actor) => [...new Set(script.concat(actor.script))], [])
			.filter((language) => language !== undefined)
			.sort();
		let spoken = actors
			.reduce((spoken, actor) => [...new Set(spoken.concat(actor.spoken))], [])
			.filter((language) => language !== undefined)
			.sort();
		let totalCurrency = actors.reduce(
			(currency, actor) => {
				for (let prop in actor.currency) {
					currency[prop] += parseInt(actor.currency[prop]);
				}
				return currency;
			},
			{
				bits: 0,
				cp: 0,
				ss: 0,
				gc: 0,
			}
		);
		let totalPartyGC = actors.reduce((totalGC, actor) => totalGC + parseFloat(actor.totalGC), 0).toFixed(2);
		actors = actors.map((actor) => {
			return {
				...actor,
				script: script.map((script) => actor.script && actor.script.includes(script)),
				spoken: spoken.map((spoken) => actor.spoken && actor.spoken.includes(spoken)),
			};
		});
		return [
			actors,
			{
				totalCurrency: totalCurrency,
				totalPartyGC: totalPartyGC,
				script: script,
				spoken: spoken,	
			},
		];
	}
}

export class dnd35eProvider extends SystemProvider {
	get tabs() {
		return {
			currencies: { id: "currencies", visible: true, localization: "D35E.Wealth" },
			languages: { id: "languages", visible: true, localization: "D35E.Languages" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/dnd35e.hbs";
	}

	get width() {
		return 550;
	}

	getTotalGP(currency) {
		return currency.cp / 100 + currency.sp / 10 + currency.gp + currency.pp * 10;
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			hp: {
				value: data.attributes.hp.value,
				max: data.attributes.hp.max,
			},
			armor: data.attributes.ac.normal.total,
			flatFooted: data.attributes.ac.flatFooted.total,
			touch: data.attributes.ac.touch.total,

			perception: data.skills.spt.mod,
			speed: data.attributes.speed.land.total,

			saves: {
				fortitude: data.attributes.savingThrows.fort.total,
				reflex: data.attributes.savingThrows.ref.total,
				will: data.attributes.savingThrows.will.total,
			},
			languages: data.traits.languages ? data.traits.languages.value.map((code) => game.i18n.localize(CONFIG.D35E.languages[code])) : [],
			currency: data.currency,
			totalGP: this.getTotalGP(data.currency).toFixed(2),
		};
	}

	getUpdate(actors) {
		let languages = actors
			.reduce((languages, actor) => [...new Set(languages.concat(actor.languages))], [])
			.filter((language) => language !== undefined)
			.sort();
		let totalCurrency = actors.reduce(
			(currency, actor) => {
				for (let prop in actor.currency) {
					currency[prop] += actor.currency[prop];
				}
				return currency;
			},
			{
				cp: 0,
				sp: 0,
				gp: 0,
				pp: 0,
			}
		);
		let totalPartyGP = actors.reduce((totalGP, actor) => totalGP + parseFloat(actor.totalGP), 0).toFixed(2);
		actors = actors.map((actor) => {
			return {
				...actor,
				languages: languages.map((language) => actor.languages && actor.languages.includes(language)),
			};
		});

		return [
			actors,
			{
				languages: languages,
				totalCurrency: totalCurrency,
				totalPartyGP: totalPartyGP,
			},
		];
	}
}

export class dnd4eProvider extends SystemProvider {
	get tabs() {
		return {
			currencies: { id: "currencies", visible: true, localization: "DND4EBETA.Currency" },
			languages: { id: "languages", visible: true, localization: "DND4EBETA.Languages" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/dnd4e.hbs";
	}

	get width() {
		return 550;
	}

	getTotalGP(currency) {
		return currency.cp / 100 + currency.sp / 10 + currency.gp + currency.pp * 10 + currency.ad * 1000;
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			hp: {
				value: data.attributes.hp.value,
				max: data.attributes.hp.max,
			},
			defenses: data.defences,
			surges: data.details.surges,
			passive: data.passive,
			script: data.languages.script.value,
			spoken: data.languages.spoken.value,
			currency: data.currency,
			totalGP: this.getTotalGP(data.currency).toFixed(2),
		};
	}

	getUpdate(actors) {
		let script = actors
			.reduce((script, actor) => [...new Set(script.concat(actor.script))], [])
			.filter((language) => language !== undefined)
			.sort();
		let spoken = actors
			.reduce((spoken, actor) => [...new Set(spoken.concat(actor.spoken))], [])
			.filter((language) => language !== undefined)
			.sort();
		let totalCurrency = actors.reduce(
			(currency, actor) => {
				for (let prop in actor.currency) {
					currency[prop] += actor.currency[prop];
				}
				return currency;
			},
			{
				cp: 0,
				sp: 0,
				gp: 0,
				pp: 0,
				ad: 0,
			}
		);
		let totalPartyGP = actors.reduce((totalGP, actor) => totalGP + parseFloat(actor.totalGP), 0).toFixed(2);
		actors = actors.map((actor) => {
			return {
				...actor,
				script: script.map((script) => actor.script && actor.script.includes(script)),
				spoken: spoken.map((spoken) => actor.spoken && actor.spoken.includes(spoken)),
			};
		});

		return [
			actors,
			{
				script: script,
				spoken: spoken,
				totalCurrency: totalCurrency,
				totalPartyGP: totalPartyGP,
			},
		];
	}
}

export class dnd5eProvider extends SystemProvider {
	constructor(id) {
		super(id);
		Handlebars.registerHelper("partyOverviewGetSkillList", function (skill, actors, opt) {
			return actors.map((actor) => {
				return {
					...actor.skills[skill],
				};
			});
		});
	}

	get loadTemplates() {
		return ["modules/party-overview/templates/parts/DND5E-Proficiencies.html"];
	}

	get tabs() {
		return {
			languages: { id: "languages", visible: true, localization: "DND5E.Languages" },
			currencies: { id: "currencies", visible: true, localization: "party-overview.WEALTH" },
			background: { id: "background", visible: true, localization: "DND5E.Background" },
			saves: { id: "saves", visible: true, localization: "DND5E.ClassSaves" },
			proficiencies: { id: "proficiencies", visible: true, localization: "party-overview.PROFICIENCIES" },
			tools: { id: "tools", visible: true, localization: "ITEM.TypeToolPl" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/dnd5e.hbs";
	}

	get width() {
		if (game.settings.get("dnd5e", "disableExperienceTracking")) return 500;
		return 600;
	}

	actorFilter(actor) {
		return super.actorFilter(actor) && actor.type !== "group";
	}

	getLanguages(data) {
		const langs = [];
		if (data.traits.languages) {
			const searchCategory = (data, key) => {
				for (const [k, v] of Object.entries(data)) {
					if (k === key) return v;
					if (v.children) {
						const result = searchCategory(v.children, key);
						if (result) return result;
					}
				}
			};
			data.traits.languages.value.forEach((key) => {
				let k = searchCategory(CONFIG.DND5E.languages, key);
				if (k?.label) k = k.label;
				langs.push(k);
			});
		}
		return langs;
	}
	getHitPoints(data) {
		const hp = data.attributes.hp;
		const value = parseInt(hp.value);
		const max = parseInt(hp.max);
		const tempValue = isNaN(parseInt(hp.temp)) ? 0 : parseInt(hp.temp);
		const tempMaxValue = isNaN(parseInt(hp.tempmax)) ? 0 : parseInt(hp.tempmax);

		return {
			value: value,
			max: max,
			tempValue: tempValue,
			tempMaxValue: tempMaxValue,
			totalValue: value + tempValue,
			totalMaxValue: max + tempMaxValue,
		};
	}
	getSkills(data) {
		const icons = {
			0: "far fa-circle",
			0.5: "fas fa-adjust",
			1: "fas fa-check",
			2: "fas fa-check-double",
		};
		const skills = {};
		for (let skill in data.skills) {
			skills[skill] = {
				icon: icons[data.skills[skill].proficient],
				proficient: CONFIG.DND5E.proficiencyLevels[data.skills[skill].proficient],
				value: data.skills[skill].total,
			};
		}
		return skills;
	}
	getSpeed(data) {
		const move = data.attributes.movement;
		let extra = [];
		if (move.fly) extra.push(`${move.fly} ${move.units} fly`);
		if (move.hover) extra.push("hover");
		if (move.burrow) extra.push(`${move.burrow} ${move.units} burrow`);
		if (move.swim) extra.push(`${move.swim} ${move.units} swim`);
		if (move.climb) extra.push(`${move.climb} ${move.units} climb`);

		let str = `${move.walk} ${move.units}`;
		if (extra.length) str += ` (${extra.join(", ")})`;

		return str;
	}
	getTools(data) {
		function getBaseItem(identifier) {
			let pack = CONFIG.DND5E.sourcePacks.ITEMS;
			let [scope, collection, id] = identifier.split(".");
			if (scope && collection) pack = `${scope}.${collection}`;
			if (!id) id = identifier;

			const packObject = game.packs.get(pack);

			return packObject?.index.get(id);
		}
		const profs = CONFIG.DND5E.toolProficiencies;
		const itemTypes = CONFIG.DND5E.toolIds;

		const tools = {};
		for (const key of Object.keys(data)) {
			if (profs[key]) {
				tools[key] = profs[key];
			} else if (itemTypes[key]) {
				const item = getBaseItem(itemTypes[key]);
				if (item) {
					tools[key] = item.name;
				}
			} else if (CONFIG.DND5E.vehicleTypes[key]) {
				tools[key] = CONFIG.DND5E.vehicleTypes[key];
			}
		}

		// Add custom entries
		if (data.custom) {
			data.custom.split(";").forEach((c, i) => (tools[`custom${i + 1}`] = c.trim()));
		}
		return tools;
	}

	getTotalGP(data) {
		// Adapted from dnd5e's convertCurrency() @ 2023-01-20
		const currency = foundry.utils.deepClone(data.currency);
		const currencies = Object.entries(CONFIG.DND5E.currencies);
		currencies.sort((a, b) => a[1].conversion - b[1].conversion);
		// Convert base units into the highest denomination possible
		let amount = 0;
		for (const [denomination, config] of currencies) {
			if (!config.conversion) continue;
			if (config.conversion == 1) amount += currency[denomination];
			else amount += currency[denomination] / config.conversion;
		}
		return amount;
	}

	htmlDecode(input) {
		var doc = new DOMParser().parseFromString(input, "text/html");
		return doc.documentElement.textContent;
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			hp: this.getHitPoints(data),
			abilities: data.abilities,
			armor: data.attributes.ac.value ? data.attributes.ac.value : 10, // TODO: replace "ac" for "armor" on .hbs
			speed: this.getSpeed(data),
			spellDC: data.attributes.spelldc,
			// passive stuff
			passives: {
				perception: data.skills.prc.passive,
				investigation: data.skills.inv.passive,
				insight: data.skills.ins.passive,
				stealth: data.skills.ste.passive,
			},
			experience: { value: data.details.xp.value || 0, max: data.details.xp.max },
			// background
			background: Object.prototype.hasOwnProperty.call(data.details, "trait")
				? {
						trait: this.htmlDecode(data.details.trait),
						ideal: this.htmlDecode(data.details.ideal),
						bond: this.htmlDecode(data.details.bond),
						flaw: this.htmlDecode(data.details.flaw),
				  }
				: {},
			// Proficiencies
			skills: this.getSkills(data),
			inspiration: data.attributes.inspiration,
			languages: this.getLanguages(data),
			tools: data.tools ? this.getTools(data.tools) : {},
			alignment: data.details.alignment,

			currency: data.currency,
			totalGP: this.getTotalGP(data).toFixed(2),
		};
	}

	getUpdate(actors) {
		let languages = actors
			.reduce((languages, actor) => [...new Set(languages.concat(Array.from(actor.languages)))], [])
			.filter((language) => language !== undefined)
			.sort();
		actors = actors.map((actor) => {
			return {
				...actor,
				languages: languages.map((language) => actor.languages?.includes(language)),
			};
		});
		let totalCurrency = actors.reduce(
			(currency, actor) => {
				for (let prop in actor.currency) {
					currency[prop] += actor.currency[prop];
				}
				return currency;
			},
			{
				cp: 0,
				sp: 0,
				ep: 0,
				gp: 0,
				pp: 0,
			}
		);
		let totalPartyGP = actors.reduce((totalGP, actor) => totalGP + parseFloat(actor.totalGP), 0).toFixed(2);
		let saves = {};
		for (let ability in CONFIG.DND5E.abilities) {
			saves[ability] = {
				short: CONFIG.DND5E.abilities[ability].abbreviation,
				long: CONFIG.DND5E.abilities[ability].label,
			};
		}
		return [
			actors,
			{
				skills: CONFIG.DND5E.skills,
				saves: saves,
				languages: languages,
				totalCurrency: totalCurrency,
				totalPartyGP: totalPartyGP,
				disableExperienceTracking: game.settings.get("dnd5e", "disableExperienceTracking"),
			},
		];
	}
}

export class pf1Provider extends SystemProvider {
	knowledgeKeys = ["kar", "kdu", "ken", "kge", "khi", "klo", "kna", "kno", "kpl", "kre"];

	get loadTemplates() {
		return ["modules/party-overview/templates/parts/PF1e-Knowledge.html"];
	}

	get tabs() {
		return {
			currencies: { id: "currencies", visible: true, localization: "party-overview.WEALTH" },
			languages: { id: "languages", visible: true, localization: "PF1.Languages" },
			lore: { id: "lore", visible: true, localization: "PF1.KnowledgeSkills" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/pf1.hbs";
	}

	getKnowledge(skills) {
		return this.knowledgeKeys.reduce((knowledge, key) => {
			if (skills[key].rank > 0) knowledge[key] = skills[key].mod;
			return knowledge;
		}, {});
	}

	getTotalGP(currency) {
		return currency.cp / 100 + currency.sp / 10 + currency.gp + currency.pp * 10;
	}

	getActorDetails(actor) {
		const data = actor.system;
		const currency = {
			cp: parseInt(data.currency.cp) + parseInt(data.altCurrency.cp), // some actors have a string value instead of an integer
			sp: parseInt(data.currency.sp) + parseInt(data.altCurrency.sp),
			gp: parseInt(data.currency.gp) + parseInt(data.altCurrency.gp),
			pp: parseInt(data.currency.pp) + parseInt(data.altCurrency.pp),
		};
		return {
			id: actor.id,
			name: actor.name,
			hp: {
				value: data.attributes.hp.value,
				max: data.attributes.hp.max,
			},
			armor: data.attributes.ac.normal.total,
			perception: data.skills.per.mod,
			speed: data.attributes.speed.land.total,

			saves: {
				fortitude: data.attributes.savingThrows.fort.total,
				reflex: data.attributes.savingThrows.ref.total,
				will: data.attributes.savingThrows.will.total,
			},
			languages: data.traits.languages ? data.traits.languages.value.map((code) => game.i18n.localize(CONFIG.PF1.languages[code])) : [],
			currency: currency,

			knowledge: this.getKnowledge(actor.system.skills),
			totalGP: this.getTotalGP(currency).toFixed(2),
		};
	}

	getUpdate(actors) {
		let languages = actors
			.reduce((languages, actor) => [...new Set(languages.concat(actor.languages))], [])
			.filter((language) => language !== undefined)
			.sort();
		let totalCurrency = actors.reduce(
			(currency, actor) => {
				for (let prop in actor.currency) {
					currency[prop] += actor.currency[prop];
				}
				return currency;
			},
			{
				cp: 0,
				sp: 0,
				gp: 0,
				pp: 0,
			}
		);
		let totalPartyGP = actors.reduce((totalGP, actor) => totalGP + parseFloat(actor.totalGP), 0).toFixed(2);
		actors = actors.map((actor) => {
			return {
				...actor,
				languages: languages.map((language) => actor.languages && actor.languages.includes(language)),
			};
		});

		return [
			actors,
			{
				languages: languages,
				totalCurrency: totalCurrency,
				totalPartyGP: totalPartyGP,
				knowledges: this.knowledgeKeys,
			},
		];
	}
}

export class pf2eProvider extends SystemProvider {
	constructor(id) {
		super(id);
		Handlebars.registerHelper("partyOverviewGetSkillList", function (skill, actors, opt) {
			return actors
				.filter((actor) => {
					return actor.show.skills;
				})
				.map((actor) => {
					return {
						rankLetter: actor.skills[skill].rankName[0],
						...actor.skills[skill],
					};
				});
		});
	}

	get loadTemplates() {
		return [
			"modules/party-overview/templates/parts/PF2e-Lore.html",
			"modules/party-overview/templates/parts/PF2e-Proficiencies.html",
			"modules/party-overview/templates/parts/PF2e-Bulk.html",
		];
	}

	get tabs() {
		return {
			currencies: { id: "currencies", visible: true, localization: "party-overview.WEALTH" },
			bulk: { id: "bulk", visible: true, localization: "PF2E.BulkShortLabel" },
			languages: { id: "languages", visible: true, localization: "PF2E.Languages" },
			lore: { id: "lore", visible: true, localization: "PF2E.Lore" },
			proficiencies: { id: "skills", visible: true, localization: "PF2E.SkillsLabel" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/pf2e.hbs";
	}

	get width() {
		return 600;
	}

	getLanguages(data) {
		let langs = data.traits.languages.value.map((code) => game.i18n.localize(CONFIG.PF2E.languages[code]));
		if (data.traits.languages.custom) {
			for (let lang of data.traits.languages.custom.split(/[,;]/g)) {
				langs.push(lang.trim());
			}
		}
		return langs;
	}

	getLore(data) {
		const lore = data.items.filter((a) => a.type == "lore").map((a) => a.name);
		return lore;
	}

	getSkills(data) {
		const proficiency = {
			0: game.i18n.localize("PF2E.ProficiencyLevel0"),
			1: game.i18n.localize("PF2E.ProficiencyLevel1"),
			2: game.i18n.localize("PF2E.ProficiencyLevel2"),
			3: game.i18n.localize("PF2E.ProficiencyLevel3"),
			4: game.i18n.localize("PF2E.ProficiencyLevel4"),
		};
		const proficiencyColors = {
			0: "initial",
			1: "#171f69",
			2: "#3c005e",
			3: "#640",
			4: "#5e0000",
		};
		const skills = {};
		for (let skill in data.skills) {
			skills[skill] = {
				color: proficiencyColors[data.skills[skill].rank] || proficiencyColors[0],
				rank: data.skills[skill].rank || 0,
				rankName: proficiency[data.skills[skill].rank] || proficiency[0],
				value: data.skills[skill].value,
			};
		}
		return skills;
	}

	getTotalGP(currency) {
		return currency.cp / 100 + currency.sp / 10 + currency.gp + currency.pp * 10;
	}

	getActorDetails(actor) {
		const data = actor.system;
		const currency = actor.inventory?.coins;
		const coinsInGold = this.getTotalGP(currency).toFixed(2);
		const totalWealth = actor.inventory?.totalWealth;
		const totalWealthInGold = this.getTotalGP(totalWealth).toFixed(2);
		const itemsValue = Math.abs(Number(totalWealthInGold) - Number(coinsInGold)).toFixed(2);
		return {
			id: actor.id,
			name: actor.name,
			type: actor.type,
			bulk: actor.inventory?.bulk || { value: { normal: 0, light: 0 }, encumberedAt: 0, max: 0 },
			hp: data.attributes.hp || { value: 0, max: 0 },
			heroPoints: data.resources?.heroPoints || { value: 0, max: 0 },
			focus: data.resources?.focus || { value: 0, max: 0 },
			armor: data.attributes.ac?.value || 0,
			shieldAC: data.attributes.shield?.ac || 0,
			perception: data.attributes.perception?.value || 0,
			// speed: actor.type === "vehicle" ? data.details.speed : data.attributes.speed?.value || 0,
			skills: this.getSkills(data),
			show: {
				general: ["character", "npc", "vehicle"].includes(actor.type) || (actor.type === "familiar" && data.master.id != ""),
				currency: ["character", "npc", "loot", "vehicle"].includes(actor.type),
				languages: ["character", "npc"].includes(actor.type),
				lore: ["character", "npc"].includes(actor.type),
				skills: ["character", "npc"].includes(actor.type) || (actor.type === "familiar" && data.master.id != ""),
			},

			saves: {
				fortitude: data.saves?.fortitude?.value || 0,
				reflex: data.saves?.reflex?.value || 0,
				will: data.saves?.will?.value || 0,
			},
			languages: data.traits?.languages ? this.getLanguages(data) : [],
			currency: currency,
			itemsValue: itemsValue,
			sumItemsGP: totalWealthInGold,

			lore: this.getLore(actor),
			totalGP: coinsInGold,
		};
	}

	getUpdate(actors) {
		let languages = actors
			.reduce((languages, actor) => [...new Set(languages.concat(actor.languages))], [])
			.filter((language) => language !== undefined)
			.sort();
		let totalCurrency = actors.reduce(
			(currency, actor) => {
				for (let prop in actor.currency) {
					currency[prop] += actor.currency[prop];
				}
				return currency;
			},
			{
				cp: 0,
				sp: 0,
				gp: 0,
				pp: 0,
			}
		);
		let itemsValue = actors.reduce((totalGP, actor) => totalGP + parseFloat(actor.itemsValue), 0).toFixed(2);
		let totalPartyGP = actors.reduce((totalGP, actor) => totalGP + parseFloat(actor.totalGP), 0).toFixed(2);
		let lores = actors
			.reduce((lore, actor) => [...new Set(lore.concat(actor.lore))], [])
			.filter((lore) => lore !== undefined)
			.sort();
		actors = actors.map((actor) => {
			return {
				...actor,
				languages: languages.map((language) => actor.languages && actor.languages.includes(language)),
				lore: lores.map((lore) => actor.lore && actor.lore.includes(lore)),
			};
		});
		return [
			actors,
			{
				languages: languages,
				totalCurrency: totalCurrency,
				itemsValue: itemsValue,
				totalPartyGP: totalPartyGP,
				sumItemsGP: (Number(itemsValue) + Number(totalPartyGP)).toFixed(2),
				lore: lores,
				skills: CONFIG.PF2E.skills || {},
			},
		];
	}
}

export class scumAndVillainyProvider extends SystemProvider {
	get tabs() {
		return {
			ship: { id: "ship", visible: true, localization: "BITD.ship" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/scum-and-villainy.hbs";
	}

	getHarm(data) {
		let result = [];
		if (data.harm.light.one || data.harm.light.two) result.push(game.i18n.localize("BITD.LessEffect"));
		if (data.harm.medium.one || data.harm.medium.two) result.push("-1D");
		if (data.harm.heavy.one) result.push(game.i18n.localize("BITD.NeedHelp"));
		return result.join(", ");
	}

	getActorDetails(actor) {
		const data = actor.system;
		const base = {
			id: actor.id,
			name: actor.name,
			type: actor.type,
		};
		if (actor.type == "character") {
			return {
				...base,
				stress: data.stress,
				coins: data.coins,
				harm: this.getHarm(data),
			};
		} else if (actor.type == "ship") {
			return {
				...base,
				crew: data.systems.crew,
				gambits: data.gambits,
			};
		}
	}

	getUpdate(actors) {
		let characters = actors
			.filter((actor) => {
				if (actor.type == "character") return true;
				return false;
			})
			.map((actor) => {
				return {
					...actor,
				};
			});
		let ships = actors
			.filter((actor) => {
				if (actor.type == "ship") return true;
				return false;
			})
			.map((actor) => {
				return {
					...actor,
				};
			});
		return [
			characters,
			{
				ships,
				shipsNotVisible: !Object.keys(ships).length,
			},
		];
	}
}

export class sfrpgProvider extends SystemProvider {
	get loadTemplates() {
		return ["modules/party-overview/templates/parts/PF2e-Lore.html"];
	}

	get tabs() {
		return {
			currencies: { id: "currencies", visible: true, localization: "party-overview.WEALTH" },
			languages: { id: "languages", visible: true, localization: "SFRPG.Languages" },
			lore: { id: "lore", visible: true, localization: "SFRPG.SkillPro" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/sfrpg.hbs";
	}

	get width() {
		return 640;
	}

	getLore(data) {
		let result = [];
		for (let key in data) {
			if (key.startsWith("pro") && Number(key.slice(key.length - 1))) {
				result.push(data[key].subname);
			}
		}
		return result;
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			hp: {
				value: data.attributes.hp.value,
				max: data.attributes.hp.max,
			},
			sp: {
				value: data.attributes.sp.value,
				max: data.attributes.sp.max,
			},
			rp: {
				value: data.attributes.sp.value,
				max: data.attributes.sp.max,
			},
			armor: data.attributes.eac.value ? data.attributes.eac.value : 10,
			kac: data.attributes.kac.value ? data.attributes.kac.value : 10,
			perception: data.skills.per.mod,
			speed: data.attributes.speed.land.value,

			saves: {
				fortitude: data.attributes.fort.bonus,
				reflex: data.attributes.reflex.bonus,
				will: data.attributes.will.bonus,
			},
			languages: data.traits.languages ? data.traits.languages.value.map((code) => game.i18n.localize(CONFIG.SFRPG.languages[code])) : [],
			currency: data.currency,

			lore: this.getLore(actor.system.skills),
		};
	}

	getUpdate(actors) {
		let languages = actors
			.reduce((languages, actor) => [...new Set(languages.concat(actor.languages))], [])
			.filter((language) => language !== undefined)
			.sort();
		let totalCurrency = actors.reduce(
			(currency, actor) => {
				for (let prop in actor.currency) {
					currency[prop] += actor.currency[prop];
				}
				return currency;
			},
			{
				cp: 0,
				sp: 0,
				gp: 0,
				pp: 0,
			}
		);
		let totalPartyCredits = actors.reduce((total, actor) => total + parseFloat(actor.currency.credit), 0);
		let totalPartyUPB = actors.reduce((total, actor) => total + parseFloat(actor.currency.upb), 0);
		let lores = actors
			.reduce((lore, actor) => [...new Set(lore.concat(actor.lore))], [])
			.filter((lore) => lore !== undefined)
			.sort();
		actors = actors.map((actor) => {
			return {
				...actor,
				languages: languages.map((language) => actor.languages && actor.languages.includes(language)),
				lore: lores.map((lore) => actor.lore && actor.lore.includes(lore)),
			};
		});
		return [
			actors,
			{
				languages: languages,
				totalCurrency: totalCurrency,
				totalPartyCredits: totalPartyCredits,
				totalPartyUPB: totalPartyUPB,
				lore: lores,
			},
		];
	}
}

export class swadeProvider extends SystemProvider {
	get template() {
		return "/modules/party-overview/templates/swade.hbs";
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			current_wounds: data.wounds.value,
			max_wounds: data.wounds.max,
			current_fatigue: data.fatigue.value,
			max_fatigue: data.fatigue.max,
			bennies: data.bennies.value,
			parry: data.stats.parry.value,
			toughness: data.stats.toughness.value,
			armor: data.stats.toughness.armor,
		};
	}
}

export class tormenta20Provider extends SystemProvider {
	constructor(id) {
		super(id);
		Handlebars.registerHelper("partyOverviewGetSkillList", function (skill, actors, opt) {
			return actors.map((actor) => {
				if (!isNaN(actor.pericias[skill]?.value))
					return {
						...actor.pericias[skill],
					};
				return {};
			});
		});
	}

	get tabs() {
		return {
			// languages: { id: "idiomas", visible: true, localization: "Idiomas" },
			currencies: { id: "dinheiro", visible: true, localization: "Dinheiro" },
			proficiencies: { id: "pericias", visible: true, localization: "Perícias" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/tormenta20.hbs";
	}

	get width() {
		return 550;
	}

	getHitPoints(data) {
		const hp = data.attributes.pv;
		const value = parseInt(hp.value);
		const max = parseInt(hp.max);
		const tempValue = isNaN(parseInt(hp.temp)) ? 0 : parseInt(hp.temp);
		const tempMaxValue = isNaN(parseInt(hp.tempmax)) ? 0 : parseInt(hp.tempmax);

		return {
			value: value,
			max: max,
			tempValue: tempValue,
			tempMaxValue: tempMaxValue,
			totalValue: value + tempValue,
			totalMaxValue: max + tempMaxValue,
		};
	}
	getManaPoints(data) {
		const hp = data.attributes.pm;
		const value = parseInt(hp.value);
		const max = parseInt(hp.max);
		const tempValue = isNaN(parseInt(hp.temp)) ? 0 : parseInt(hp.temp);
		const tempMaxValue = isNaN(parseInt(hp.tempmax)) ? 0 : parseInt(hp.tempmax);

		return {
			value: value,
			max: max,
			tempValue: tempValue,
			tempMaxValue: tempMaxValue,
			totalValue: value + tempValue,
			totalMaxValue: max + tempMaxValue,
		};
	}
	getPericias(data) {
		let pericias = foundry.utils.deepClone(data.pericias);
		for (let pericia in pericias) {
			pericias[pericia] = {
				value: data.pericias[pericia].value,
			};
		}
		return pericias;
	}
	getSpeed(data) {
		const move = data.attributes.movement;
		let extra = [];
		if (move.fly) extra.push(`${move.fly} ${move.units} fly`);
		if (move.hover) extra.push("hover");
		if (move.burrow) extra.push(`${move.burrow} ${move.units} burrow`);
		if (move.swim) extra.push(`${move.swim} ${move.units} swim`);
		if (move.climb) extra.push(`${move.climb} ${move.units} climb`);

		let str = `${move.walk} ${move.units}`;
		if (extra.length) str += ` (${extra.join(", ")})`;

		return str;
	}

	getTotalGP(data) {
		const currency = foundry.utils.deepClone(data.dinheiro);
		return currency.tl * 100 + currency.to * 10 + currency.tp + currency.tc / 10;
	}

	htmlDecode(input) {
		var doc = new DOMParser().parseFromString(input, "text/html");
		return doc.documentElement.textContent;
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			pv: this.getHitPoints(data),
			pm: this.getManaPoints(data),
			atributos: data.atributos,
			defesa: data.attributes.defesa.value,
			// pericias: data.pericias,
			pericias: this.getPericias(data),
			// languages: data.traits.languages ? data.traits.languages.value.map((code) => CONFIG.DND5E.languages[code]) : [],
			// alignment: data.details.alignment,
			dinheiro: data.dinheiro,
			dinheiroTotal: this.getTotalGP(data).toFixed(2),
		};
	}

	getUpdate(actors) {
		actors = actors.map((actor) => {
			return {
				...actor,
				// languages: languages.map((language) => actor.languages && actor.languages.includes(language)),
			};
		});
		let totalCurrency = actors.reduce(
			(currency, actor) => {
				for (let prop in actor.dinheiro) {
					currency[prop] += actor.dinheiro[prop];
				}
				return currency;
			},
			{
				tc: 0,
				tl: 0,
				to: 0,
				tp: 0,
			}
		);
		let totalPartyGP = actors.reduce((totalGP, actor) => totalGP + parseFloat(actor.dinheiroTotal), 0).toFixed(2);
		let pericias = foundry.utils.deepClone(CONFIG.T20.pericias);
		delete pericias.luta;
		delete pericias.pont;
		delete pericias.fort;
		delete pericias.refl;
		delete pericias.vont;
		delete pericias.ofic;
		delete pericias.defe;
		delete pericias.ocul;
		return [
			actors,
			{
				pericias: pericias,
				totalCurrency: totalCurrency,
				totalPartyGP: totalPartyGP,
			},
		];
	}
}

export class cyphersystemProvider extends SystemProvider {
	get customCSS() {
		return "cyphersystem";
	}

	get template() {
		return "/modules/party-overview/templates/cyphersystem.hbs";
	}

	get width() {
		return 700;
	}

	actorFilter(actor) {
		return super.actorFilter(actor) && actor.type === "pc";
	}

	getActorDetails(actor) {
		const data = actor.system;
		if (actor.type !== "pc") return;
		return {
			id: actor.id,
			name: actor.name,
			type: actor.type,
			might: data.pools.might,
			speed: data.pools.speed,
			intellect: data.pools.intellect,
			additional: data.pools.additional,
			additionalPool: {
				active: data.settings.general.additionalPool.active,
				name: data.settings.general.additionalPool.label,
				pool: data.pools.additionalPool,
			},
			tier: data.basic.tier,
			effort: data.basic.effort,
			xp: data.basic.xp,
			armorValueTotal: data.combat.armor.ratingTotal,
			speedCostTotal: data.combat.armor.costTotal,
			damageTrack: data.combat.damageTrack.state,
		};
	}

	getUpdate(actors) {
		return [
			actors,
			{
				showAdditional: actors.some((actor) => actor.type === "pc" && actor.additionalPool.active),
			},
		];
	}
}

export class CoC7Provider extends SystemProvider {
	get template() {
		return "/modules/party-overview/templates/coc7.hbs";
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			hp: data.attribs.hp,
			luck: data.attribs.lck,
			move: data.attribs.mov,
			mp: data.attribs.mp,
			san: data.attribs.san,
			armor: data.attribs.armor,
			build: data.attribs.build,
			db: data.attribs.db,
			app: data.characteristics.app,
			con: data.characteristics.con,
			dex: data.characteristics.dex,
			edu: data.characteristics.edu,
			int: data.characteristics.int,
			pow: data.characteristics.pow,
			siz: data.characteristics.siz,
			str: data.characteristics.str,
		};
	}
}

export class GURPSProvider extends SystemProvider {
	get template() {
		return "/modules/party-overview/templates/gurps.hbs";
	}

	getActorDetails(actor) {
		const data = actor.data.data;
		return {
			id: actor.id,
			name: actor.name,
			hp: data.HP,
			fp: data.FP,
			dx: data.attributes.DX,
			ht: data.attributes.HT,
			iq: data.attributes.IQ,
			st: data.attributes.ST,
			per: data.attributes.PER,
			will: data.attributes.WILL,
			move: data.currentmove,
			dodge: data.currentdodge,
			parry: data.equippedparry,
			hearing: data.hearing,
			touch: data.touch,
			vision: data.vision,
			tastesmell: data.tastesmell,
		};
	}

	/**
	 * Default width for the system's overview.
	 */
	get width() {
		return 750;
	}
}

export class cofSystemProvider extends SystemProvider {
	get width() {
		return 600;
	}
	getActorDetails(actor) {
		const data = actor.data.data;
		return {
			id: actor.id ?? "not found",

			// general
			// name_label : game.i18n.localize("COF.details.name"),
			name: actor.name ?? "not found",
			profileName: actor.data.items.find((item) => item.type === "profile")?.name,
			speciesName: actor.data.items.find((item) => item.type === "species")?.name,
			size: data.details.size,
			level: data.level?.value ?? "not found",

			// xp           : data.xp.value??"not found",
			// xp_label     : game.i18n.localize("COF.attributes.xp.label"),
			// xp_abbrev    : game.i18n.localize("COF.attributes.xp.abbrev"),

			// tab "stats
			hp: data.attributes?.hp ?? "not found",
			hd: data.attributes?.hd ?? "not found", // dè de vie
			str: data.stats?.str ?? "not found",
			dex: data.stats?.dex ?? "not found",
			con: data.stats?.con ?? "not found",
			int: data.stats?.int ?? "not found",
			wis: data.stats?.wis ?? "not found",
			cha: data.stats?.cha ?? "not found",

			// tab Attack
			melee: data.attacks?.melee ?? "not found",
			ranged: data.attacks?.ranged ?? "not found",
			magic: data.attacks?.magic ?? "not found",
			init: data.attributes?.init ?? "not found",
			def: data.attributes?.def ?? "not found",
			dr: data.attributes?.dr ?? "not found", // dommage reduce
			rp: data.attributes?.rp ?? "not found",
			fp: data.attributes?.fp ?? "not found", // points de chance
			mp: data.attributes?.mp ?? "not found", // points de mana

			// tab currency
			pp: data.currency?.pp ?? "not found",
			gp: data.currency?.gp ?? "not found",
			sp: data.currency?.sp ?? "not found",
			cp: data.currency?.cp ?? "not found",

			xpLevel: actor.xp?.level?.value ?? "not found",
		};
	}

	get tabs() {
		return {
			stats: { id: "stats", visible: true, localization: "COF.tabs.stats" },
			attacks: { id: "attack", visible: true, localization: "COF.tabs.combat" },
			currency: { id: "currency", visible: true, localization: "COF.category.currency" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/cof.hbs";
	}
}

export class shinobigamiProvider extends SystemProvider {
	get width() {
		return 700;
	}
	getActorDetails(actor) {
		const data = actor.system;
		let health = JSON.parse(JSON.stringify(data.health.state));
		let dirty = JSON.parse(JSON.stringify(data.health.dirty));

		for (let a = 0; a < Object.keys(dirty).length; ++a) {
			let i = Object.keys(dirty)[a];
			health[i] = dirty[i] ? dirty[i] : health[i];
		}

		return {
			id: actor.id,
			name: actor.name,
			hp: {
				value: data.health.value,
				max: data.health.max,
			},
			state0: health[0],
			state1: health[1],
			state2: health[2],
			state3: health[3],
			state4: health[4],
			state5: health[5],
		};
	}

	get template() {
		return "/modules/party-overview/templates/shinobigami.hbs";
	}
}

export class wfrp4eProvider extends SystemProvider {
	get customCSS() {
		return "wfrp4e";
	}

	get tabs() {
		return {
			currencies: { id: "currencies", visible: true, localization: "Money" },
			skills: { id: "skills", visible: true, localization: "Skills" },
			talents: { id: "talents", visible: true, localization: "Talents" },
			equipment: { id: "equipment", visible: true, localization: "Trappings" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/wfrp4e.hbs";
	}

	get width() {
		return 700;
	}

	getCurrency(actor) {
		const money = actor.getItemTypes("money").map((m) => m.toObject());
		const currency = {
			bp: money.find((i) => i.name === game.i18n.localize("NAME.BP")).system.quantity.value,
			ss: money.find((i) => i.name === game.i18n.localize("NAME.SS")).system.quantity.value,
			gc: money.find((i) => i.name === game.i18n.localize("NAME.GC")).system.quantity.value,
			total: 0,
		};
		currency.total = (currency.bp / 240 + currency.ss / 20 + currency.gc).toFixed(2);
		return currency;
	}
	getTalents(actor) {
		let talents = [];
		actor
			.getItemTypes("talent")
			.map((talent) => ({
				name: talent.name,
				test: talent.system.tests.value,
			}))
			.forEach((talent) => {
				let old_talent = talents.find((t) => t.name === talent.name && t.test === t.test);
				if (old_talent !== undefined) {
					talents = talents.filter((t) => t !== old_talent);
					old_talent.advances += 1;
					talents.push(old_talent);
				} else {
					talent.advances = 1;
					talents.push(talent);
				}
			});
		talents = talents.map((talent) => ({
			name: talent.advances > 1 ? `${talent.name} (${talent.advances})` : talent.name,
			test: talent.test,
		}));
		talents.sort((a, b) => a.name.localeCompare(b.name));
		return talents;
	}
	getSkills(actor) {
		let skills = actor
			.getItemTypes("skill")
			.filter((skill) => skill.system.advances.value > 0)
			.map((skill) => ({
				name: skill.name,
				nameSpec: skill.name.substring(skill.name.indexOf("(") + 1, skill.name.length - 1),
				total: skill.system.total.value,
				advanced: skill.system.advanced.value,
			}));
		skills.sort((a, b) => a.name.localeCompare(b.name));

		let meleeRanged = skills.filter((skill) => skill.name.includes(game.i18n.localize("NAME.Melee")) || skill.name.includes(game.i18n.localize("NAME.Ranged")));
		let languages = skills.filter((skill) => skill.name.includes(game.i18n.localize("NAME.Language")));
		let lore = skills.filter((skill) => skill.name.includes(game.i18n.localize("NAME.Lore")));
		let trade = skills.filter((skill) => skill.name.includes(game.i18n.localize("NAME.Trade")));

		let otherBasic = skills.filter((skill) => skill.advanced === "bsc" && !meleeRanged.includes(skill));
		let otherAdvanced = skills.filter(
			(skill) => !meleeRanged.includes(skill) && !languages.includes(skill) && !lore.includes(skill) && !trade.includes(skill) && !otherBasic.includes(skill)
		);

		return {
			meleeRanged: meleeRanged,
			languages: languages,
			lore: lore,
			trade: trade,
			otherBasic: otherBasic,
			otherAdvanced: otherAdvanced,
		};
	}
	getWeapons(actor) {
		let weapons = actor.getItemTypes("weapon").map((weapon) => ({
			name: weapon.name,
			category: WFRP4E.weaponGroups[weapon.system.weaponGroup.value],
		}));
		weapons.sort((a, b) => a.name.localeCompare(b.name));

		return weapons;
	}

	getActorDetails(actor) {
		const data = actor.system;
		return {
			id: actor.id,
			name: actor.name,
			wounds: {
				value: data.status.wounds.value,
				max: data.status.wounds.max,
			},
			advantage: data.status.advantage.value,
			movement: data.details.move.value,
			fortune: data.status.fortune.value,
			fate: data.status.fate.value,
			resilience: data.status.resilience.value,
			resolve: data.status.resolve.value,
			corruption: {
				value: data.status.corruption.value,
				max: data.status.corruption.max,
			},
			status: data.details.status.value,
			encumbrance: {
				value: data.status.encumbrance.current,
				max: data.status.encumbrance.max,
			},
			exp: {
				value: data.details.experience.total - data.details.experience.spent,
				total: data.details.experience.total,
			},
			skills: this.getSkills(actor),
			talents: this.getTalents(actor),
			weapons: this.getWeapons(actor),
			currency: this.getCurrency(actor),
		};
	}

	getUpdate(actors) {
		const totalCurrency = {
			bp: 0,
			ss: 0,
			gc: 0,
			total: 0,
		};
		for (const actor of actors) {
			totalCurrency.bp += actor.currency.bp;
			totalCurrency.ss += actor.currency.ss;
			totalCurrency.gc += actor.currency.gc;
		}
		totalCurrency.total = (totalCurrency.bp / 240 + totalCurrency.ss / 20 + totalCurrency.gc).toFixed(2);
		return [
			actors,
			{
				totalCurrency: totalCurrency,
			},
		];
	}
}
