import {SystemProvider} from "../SystemProvider.js";

export class wfrp4eProvider extends SystemProvider {
  get customCSS() {
    return "wfrp4e";
  }

  get tabs() {
    return {
      currencies: { id: "currencies", visible: true, localization: "Money" },
      lore: { id: "skills", visible: true, localization: "Skills" },
    };
  }

  get template() {
    return "/modules/party-overview/templates/wfrp4e.hbs";
  }

  getCurrency(actor) {
    const money = actor.getItemTypes("money").map(m => m.toObject());
    const currency = {
      bp: money.find(i => i.name === game.i18n.localize("NAME.BP")).system.quantity.value,
      ss: money.find(i => i.name === game.i18n.localize("NAME.SS")).system.quantity.value,
      gc: money.find(i => i.name === game.i18n.localize("NAME.GC")).system.quantity.value,
      total: 0
    }
    currency.total = (currency.bp / 240 + currency.ss / 20 + currency.gc).toFixed(2)
    return currency
  }
  getSkills(actor) {
    let skills = actor.getItemTypes("skill")
      .filter(skill => skill.system.advances.value > 0)
      .sort(skill => skill.name)
      .map(skill => ({
        name: skill.name,
        nameSpec: skill.name.substring(skill.name.indexOf("(")+1, skill.name.length-1),
        total: skill.system.total.value,
        advanced: skill.system.advanced.value
      }))

    let meleeRanged = skills.filter(skill => skill.name.includes(game.i18n.localize("NAME.Melee")) || skill.name.includes(game.i18n.localize("NAME.Ranged")))
    let languages = skills.filter(skill => skill.name.includes(game.i18n.localize("NAME.Language")))
    let lore = skills.filter(skill => skill.name.includes(game.i18n.localize("NAME.Lore")))
    let trade = skills.filter(skill => skill.name.includes(game.i18n.localize("NAME.Trade")))

    let otherBasic = skills.filter(skill => skill.advanced === "bsc" && !meleeRanged.includes(skill))
    let otherAdvanced = skills.filter(skill =>
      !meleeRanged.includes(skill) &&
      !languages.includes(skill) &&
      !lore.includes(skill) &&
      !trade.includes(skill) &&
      !otherBasic.includes(skill))

    return {
      meleeRanged: meleeRanged,
      languages: languages,
      lore: lore,
      trade: trade,
      otherBasic: otherBasic,
      otherAdvanced: otherAdvanced
    }
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
      skills: this.getSkills(actor),
      currency: this.getCurrency(actor)
    };
  }

  getUpdate(actors) {
    const totalCurrency = {
      bp: 0,
      ss: 0,
      gc: 0,
      total: 0
    }
    for (const actor of actors) {
      totalCurrency.bp += actor.currency.bp;
      totalCurrency.ss += actor.currency.ss;
      totalCurrency.gc += actor.currency.gc;
    }
    totalCurrency.total = (totalCurrency.bp / 240 + totalCurrency.ss / 20 + totalCurrency.gc).toFixed(2)
    return [
      actors,
      {
        totalCurrency: totalCurrency,
      },
    ];
  }
}
