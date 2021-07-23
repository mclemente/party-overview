export class SystemProvider {
	constructor(id) {
		this.id = id
	}

    get template() {
        throw new Error("A SystemProvider must implement the template function");
    }

    get width() {
        return 500;
    }
}

export class dnd5eProvider extends SystemProvider {
    get template() {
        return "/modules/party-overview/templates/dnd5e.hbs"
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
        if (move.fly)    extra.push(`${move.fly} ${move.units} fly`);
        if (move.hover)  extra.push("hover");
        if (move.burrow) extra.push(`${move.burrow} ${move.units} burrow`);
        if (move.swim)   extra.push(`${move.swim} ${move.units} swim`);
        if (move.climb)  extra.push(`${move.climb} ${move.units} climb`);

        let str = `${move.walk} ${move.units}`;
        if (extra.length)
            str += ` (${extra.join(", ")})`;

        return str;
    }

    getTotalGP(data) {
        const currency = data.currency;
        return currency.cp / 100 + currency.sp / 10 + currency.ep / 2 + currency.gp + currency.pp * 10;
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
                flaw: this.htmlDecode(data.details.flaw)
            },
            inspiration: data.attributes.inspiration,
            languages: data.traits.languages.value.map(code => CONFIG.DND5E.languages[code]),
            alignment: data.details.alignment,
            currency: data.currency,
            totalGP: this.getTotalGP(data).toFixed(2)
        }
    }
}

export class pf2eProvider extends SystemProvider {
    get template() {
        return "/modules/party-overview/templates/pf2e.hbs"
    }

    get width() {
        return 540;
    }

    getCurrency(data) {
        const coins = ["Platinum Pieces", "Gold Pieces", "Silver Pieces", "Copper Pieces"]
        const wealth = {
            "Platinum Pieces": "pp",
            "Gold Pieces": "gp",
            "Silver Pieces": "sp",
            "Copper Pieces": "cp"
        };
        const currency = {"pp":0, "gp":0, "sp":0, "cp":0}
        data.items.filter(a => coins.includes(a.name)).map(a => currency[wealth[a.name]] += a.quantity);
        return currency;
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
                value: data.attributes.hp.value,
                max: data.attributes.hp.max
            },
            armor: data.attributes.ac.value ? data.attributes.ac.value : 10,
            shieldAC: data.attributes.shield && data.attributes.shield.ac ? `(+${data.attributes.shield.ac})` : "",
            perception: data.attributes.perception.value,
            stealth: data.skills.ste.value,
            speed: data.attributes.speed.value,

            saves: {
                fortitude: data.saves.fortitude.value,
                reflex: data.saves.reflex.value,
                will: data.saves.will.value,
            },
            languages: data.traits.languages.value.map(code => game.i18n.localize(CONFIG.PF2E.languages[code])),
            currency: currency,
            totalGP: this.getTotalGP(currency).toFixed(2)
        }
    }
}

export class swadeProvider extends SystemProvider {
    get template() {
        return "/modules/party-overview/templates/swade.hbs"
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
            armor: actor.data.data.stats.toughness.armor
        }
    }
}

export class wfrp4eProvider extends SystemProvider {
    get template() {
        return "/modules/party-overview/templates/wfrp4e.hbs"
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
            run: data.details.move.run
        }
    }
}
