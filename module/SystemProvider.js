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

export class dnd5eProvider extends SystemProvider {
	get template() {
		return "/modules/party-overview/templates/dnd5e.hbs";
	}

	get width() {
		return 575;
	}

	getHitPoints(data) {
		const hp = data.attributes.hp;
		const value = parseInt(hp.value);
		const max = parseInt(hp.max);
		const tempValue = isNaN(parseInt(data.attributes.hp.temp)) ? 0 : parseInt(data.attributes.hp.temp);
		const tempMaxValue = isNaN(parseInt(data.attributes.hp.tempmax)) ? 0 : parseInt(data.attributes.hp.tempmax);

		return {
			value: value,
			max: max,
			tempValue: tempValue,
			tempMaxValue: tempMaxValue,
			totalValue: value + tempValue,
			totalMaxValue: max + tempMaxValue,
		};
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
		const convert = CONFIG.DND5E.currencyConversion;
		for (let [c, t] of Object.entries(convert)) {
			let change = Math.floor(currency[c] / t.each);
			currency[c] -= change * t.each;
			currency[t.into] += change;
		}
		return (
			currency["pp"] * convert["gp"].each +
			currency["gp"] +
			currency["ep"] / convert["ep"].each +
			currency["sp"] / convert["sp"].each / convert["ep"].each +
			currency["cp"] / convert["cp"].each / convert["sp"].each / convert["ep"].each
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
			// background
			background: {
				trait: this.htmlDecode(data.details.trait),
				ideal: this.htmlDecode(data.details.ideal),
				bond: this.htmlDecode(data.details.bond),
				flaw: this.htmlDecode(data.details.flaw),
			},
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
				saves: saves,
				languages: languages,
				totalCurrency: totalCurrency,
				totalPartyGP: totalPartyGP,
			},
		];
	}
}

export class pf1Provider extends SystemProvider {
	static knowledgeKeys = ["kar", "kdu", "ken", "kge", "khi", "klo", "kna", "kno", "kpl", "kre"];

	get loadTemplates() {
		return [
			"modules/party-overview/templates/parts/PF1e-Knowledge.html",
			"modules/party-overview/templates/parts/PF2e-Bulk.html"
		];
	}

	get template() {
		return "/modules/party-overview/templates/pf1.hbs"
	}

	getKnowledge(skills) {
		return pf1Provider.knowledgeKeys.reduce((knowledge, key)  => {
			if (skills[key].rank > 0)
				knowledge[key] = skills[key].mod;
			return knowledge
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
				max: data.attributes.hp.max
			},
			armor: data.attributes.ac.normal.total,
			perception: `+${data.skills.per.mod}`,
			speed: data.attributes.speed.land.total,

			saves: {
				fortitude: `+${data.attributes.savingThrows.fort.total}`,
				reflex: `+${data.attributes.savingThrows.ref.total}`,
				will: `+${data.attributes.savingThrows.will.total}`,
			},
			languages: data.traits.languages ? data.traits.languages.value.map(code => game.i18n.localize(CONFIG.PF1.languages[code])) : [],
			currency: currency,

			knowledge: this.getKnowledge(actor.data.data.skills),
			totalGP: this.getTotalGP(currency).toFixed(2)
		}
	}

	getUpdate(actors) {
		let languages = actors
			.reduce((languages, actor) => [...new Set(languages.concat(actor.languages))], [])
			.filter(language => language !== undefined)
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
		actors = actors.map(actor => {
			return {
				...actor,
				languages: languages.map(language => actor.languages && actor.languages.includes(language))
			}
		});

		return [
			actors,
			{
				languages: languages,
				totalCurrency: totalCurrency,
				totalPartyGP: totalPartyGP,
				knowledges: pf1Provider.knowledgeKeys,
			}
		]
	}
}

export class pf2eProvider extends SystemProvider {
	get loadTemplates() {
		return ["modules/party-overview/templates/parts/PF2e-Lore.html", "modules/party-overview/templates/parts/PF2e-Bulk.html"];
	}

	get template() {
		return "/modules/party-overview/templates/pf2e.hbs";
	}

	get width() {
		return 540;
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
		return {
			id: actor.id,
			name: actor.name,
			hp: {
				value: data.attributes.hp?.value || 0,
				max: data.attributes.hp?.max || 0,
			},
			heroPoints: data.attributes.heroPoints || 0,
			armor: data.attributes.ac?.value ? data.attributes.ac.value : 10,
			shieldAC: data.attributes.shield && data.attributes.shield.ac ? `(+${data.attributes.shield.ac})` : "",
			perception: data.attributes.perception?.value || 0,
			speed: data.attributes.speed?.value || 0,

			saves: {
				fortitude: data.saves?.fortitude.value || 0,
				reflex: data.saves?.reflex.value || 0,
				will: data.saves?.will.value || 0,
			},
			languages: data.traits?.languages ? data.traits.languages.value.map((code) => game.i18n.localize(CONFIG.PF2E.languages[code])) : [],
			currency: currency,

			lore: this.getLore(actor.data),
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
				totalPartyGP: totalPartyGP,
				lore: lores,
			},
		];
	}
}

export class sfrpgProvider extends SystemProvider {
	get loadTemplates() {
		return ["modules/party-overview/templates/parts/PF2e-Lore.html", "modules/party-overview/templates/parts/PF2e-Bulk.html"];
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
