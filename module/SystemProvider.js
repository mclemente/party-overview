function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

export class SystemProvider {
	constructor(id) {
		this.id = id;
	}

	get customCSS() {
		return "";
	}

	get loadTemplates() {
		return [];
	}

	get tabs() {
		return {};
	}

	get template() {
		return "/modules/party-overview/templates/generic.hbs";
	}

	get width() {
		return 500;
	}

	getActorDetails(actor) {
		const data = actor.data.data;
		return {
			id: actor.id,
			name: actor.name,
			hp: data.attributes?.hp || data.hp,
		};
	}

	getUpdate(actors) {
		return [actors, {}];
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
		const data = actor.data.data;
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
		const data = actor.data.data;
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
		const data = actor.data.data;
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

export class dnd5eProvider extends SystemProvider {
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
		};
	}

	get template() {
		return "/modules/party-overview/templates/dnd5e.hbs";
	}

	get width() {
		if (game.settings.get("dnd5e", "disableExperienceTracking")) return 500;
		return 600;
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
			skills[skill] = icons[data.skills[skill].proficient];
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

	getTotalGP(data) {
		const currency = foundry.utils.deepClone(data.currency);
		const convert = CONFIG.DND5E.currencies;
		for (let [curr, currData] of Object.entries(convert)) {
			if (currency[curr] == 0 || !("conversion" in currData)) continue;
			const { into, each } = currData.conversion;
			let change = Math.floor(currency[curr] / each);
			currency[curr] -= change * each;
			currency[into] += change;
		}
		return (
			currency.pp * convert.gp.conversion.each +
			currency.gp +
			currency.ep / convert.ep.conversion.each +
			currency.sp / convert.sp.conversion.each / convert.ep.conversion.each +
			currency.cp / convert.cp.conversion.each / convert.sp.conversion.each / convert.ep.conversion.each
		);
	}

	htmlDecode(input) {
		var doc = new DOMParser().parseFromString(input, "text/html");
		return doc.documentElement.textContent;
	}

	getActorDetails(actor) {
		const data = actor.data.data;
		return {
			id: actor.id,
			name: actor.name,
			hp: this.getHitPoints(data),
			abilities: data.abilities,
			armor: data.attributes.ac.value ? data.attributes.ac.value : 10, //TODO: replace "ac" for "armor" on .hbs
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
			background: {
				trait: this.htmlDecode(data.details.trait),
				ideal: this.htmlDecode(data.details.ideal),
				bond: this.htmlDecode(data.details.bond),
				flaw: this.htmlDecode(data.details.flaw),
			},
			// Proficiencies
			skills: this.getSkills(data),
			inspiration: data.attributes.inspiration,
			languages: data.traits.languages ? data.traits.languages.value.map((code) => CONFIG.DND5E.languages[code]) : [],
			alignment: data.details.alignment,
			currency: data.currency,
			totalGP: this.getTotalGP(data).toFixed(2),
		};
	}

	getUpdate(actors) {
		let languages = actors
			.reduce((languages, actor) => [...new Set(languages.concat(actor.languages))], [])
			.filter((language) => language !== undefined)
			.sort();
		actors = actors.map((actor) => {
			return {
				...actor,
				languages: languages.map((language) => actor.languages && actor.languages.includes(language)),
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
				short: CONFIG.DND5E.abilityAbbreviations[ability],
				long: CONFIG.DND5E.abilities[ability],
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
	static knowledgeKeys = ["kar", "kdu", "ken", "kge", "khi", "klo", "kna", "kno", "kpl", "kre"];

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
		return pf1Provider.knowledgeKeys.reduce((knowledge, key) => {
			if (skills[key].rank > 0) knowledge[key] = skills[key].mod;
			return knowledge;
		}, {});
	}

	getTotalGP(currency) {
		return currency.cp / 100 + currency.sp / 10 + currency.gp + currency.pp * 10;
	}

	getActorDetails(actor) {
		const data = actor.data.data;
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

			knowledge: this.getKnowledge(actor.data.data.skills),
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
	get loadTemplates() {
		return [
			"modules/party-overview/templates/parts/PF2e-Lore.html",
			// "modules/party-overview/templates/parts/PF2e-Bulk.html"
		];
	}

	get tabs() {
		return {
			currencies: { id: "currencies", visible: true, localization: "party-overview.WEALTH" },
			// bulk: { id: "bulk", visible: true, localization: "PF2E.BulkShortLabel" },
			languages: { id: "languages", visible: true, localization: "PF2E.Languages" },
			lore: { id: "lore", visible: true, localization: "PF2E.Lore" },
		};
	}

	get template() {
		return "/modules/party-overview/templates/pf2e.hbs";
	}

	get width() {
		return 600;
	}

	getCurrency(data) {
		const coins = ["Platinum Pieces", "Gold Pieces", "Silver Pieces", "Copper Pieces"];
		const wealth = {
			"Platinum Pieces": "pp",
			"Gold Pieces": "gp",
			"Silver Pieces": "sp",
			"Copper Pieces": "cp",
		};
		const currency = { pp: 0, gp: 0, sp: 0, cp: 0 };
		data.items
			.filter((a) => coins.includes(a.data?.flags?.babele?.originalName) || coins.includes(a.name))
			.map((a) => (currency[wealth[a.data?.flags?.babele?.originalName || a.name]] += a.quantity));
		return currency;
	}

	getItemsValue(data) {
		const currency = { pp: 0, gp: 0, sp: 0, cp: 0 };
		const items = data.items.filter((a) => a.data.data.price);
		for (const item of items) {
			let [value, coin] = item.data.data.price.value.split(" ");
			currency[coin] += Number(value) * item.data.data.quantity.value;
		}
		return currency.cp / 100 + currency.sp / 10 + currency.gp + currency.pp * 10;
	}

	getLore(data) {
		const lore = data.items.filter((a) => a.type == "lore").map((a) => a.name);
		return lore;
	}

	getTotalGP(currency) {
		return currency.cp / 100 + currency.sp / 10 + currency.gp + currency.pp * 10;
	}

	getActorDetails(actor) {
		const data = actor.data.data;
		const currency = this.getCurrency(actor.data);
		const itemsValue = this.getItemsValue(actor.data).toFixed(2);
		const totalGP = this.getTotalGP(currency).toFixed(2);
		const sumItemsGP = (Number(itemsValue) + Number(totalGP)).toFixed(2);
		return {
			id: actor.id,
			name: actor.name,
			hp: data.attributes.hp || { value: 0, max: 0 },
			heroPoints: data.resources?.heroPoints || { value: 0, max: 0 },
			focus: data.resources?.focus || { value: 0, max: 0 },
			armor: data.attributes.ac?.value || 0,
			shieldAC: data.attributes.shield?.ac || 0,
			perception: data.attributes.perception?.value || 0,
			// speed: actor.type === "vehicle" ? data.details.speed : data.attributes.speed?.value || 0,

			saves: {
				fortitude: data.saves?.fortitude?.value || 0,
				reflex: data.saves?.reflex?.value || 0,
				will: data.saves?.will?.value || 0,
			},
			languages: data.traits?.languages ? data.traits.languages.value.map((code) => game.i18n.localize(CONFIG.PF2E.languages[code])) : [],
			currency: currency,
			itemsValue: itemsValue,
			sumItemsGP: sumItemsGP,

			lore: this.getLore(actor.data),
			totalGP: totalGP,
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
		const data = actor.data.data;
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
		const data = actor.data.data;
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
				fortitude: data.attributes.fort.value,
				reflex: data.attributes.reflex.value,
				will: data.attributes.will.value,
			},
			languages: data.traits.languages ? data.traits.languages.value.map((code) => game.i18n.localize(CONFIG.SFRPG.languages[code])) : [],
			currency: data.currency,

			lore: this.getLore(actor.data.data.skills),
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
		return {
			id: actor.id,
			name: actor.name,
			current_wounds: actor.data.data.wounds.value,
			max_wounds: actor.data.data.wounds.max,
			current_fatigue: actor.data.data.fatigue.value,
			max_fatigue: actor.data.data.fatigue.max,
			bennies: actor.data.data.bennies.value,
			parry: actor.data.data.stats.parry.value,
			toughness: actor.data.data.stats.toughness.value,
			armor: actor.data.data.stats.toughness.armor,
		};
	}
}

export class tormenta20Provider extends SystemProvider {
	get tabs() {
		return {
			// languages: { id: "idiomas", visible: true, localization: "Idiomas" },
			currencies: { id: "dinheiro", visible: true, localization: "Dinheiro" },
			// proficiencies: { id: "pericias", visible: true, localization: "Perícias" },
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
		delete pericias.luta;
		delete pericias.pont;
		delete pericias.fort;
		delete pericias.refl;
		delete pericias.vont;
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
		const data = actor.data.data;
		return {
			id: actor.id,
			name: actor.name,
			pv: this.getHitPoints(data),
			pm: this.getManaPoints(data),
			atributos: data.atributos,
			defesa: data.attributes.defesa.value,
			pericias: data.pericias,
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
		// let pericias = foundry.utils.deepClone(CONFIG.T20.pericias);
		// delete pericias.luta;
		// delete pericias.pont;
		// delete pericias.fort;
		// delete pericias.refl;
		// delete pericias.vont;
		// delete pericias.ofic;
		return [
			actors,
			{
				// pericias: pericias,
				totalCurrency: totalCurrency,
				totalPartyGP: totalPartyGP,
			},
		];
	}
}

export class wfrp4eProvider extends SystemProvider {
	get customCSS() {
		return "wfrp4e";
	}

	get template() {
		return "/modules/party-overview/templates/wfrp4e.hbs";
	}

	getActorDetails(actor) {
		const data = actor.data.data;
		return {
			id: actor.id,
			name: actor.name,
			wounds: {
				value: data.status.wounds.value,
				max: data.status.wounds.max,
			},
			advantage: data.status.advantage.value,
			movement: data.details.move.value,
			walk: data.details.move.walk,
			run: data.details.move.run,
		};
	}
}
