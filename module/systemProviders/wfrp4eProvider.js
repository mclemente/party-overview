import {SystemProvider} from "../SystemProvider.js";

export class wfrp4eProvider extends SystemProvider {
  get customCSS() {
    return "wfrp4e";
  }

  get tabs() {
    return {
      currencies: { id: "currencies", visible: true, localization: "Money" },
      skills: { id: "skills", visible: true, localization: "Skills" },
      talents: { id: "talents", visible: true, localization: "Talents"},
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
  getTalents(actor) {
    let talents = []
    actor.getItemTypes("talent")
      .map(talent => ({
        name: talent.name,
        test: talent.system.tests.value}))
      .forEach(talent => {
        let old_talent = talents.find(t => t.name === talent.name && t.test === t.test)
        if (old_talent !== undefined) {
          talents = talents.filter(t => t !== old_talent);
          old_talent.advances += 1;
          talents.push(old_talent);
        } else {
          talent.advances = 1;
          talents.push(talent);
        }
      })
    talents = talents.map(talent => ({
      name: talent.advances > 1 ? `${talent.name} (${talent.advances})` : talent.name,
      test: talent.test
    }))
    talents.sort((a,b) => a.name.localeCompare(b.name))
    return talents
  }
  getSkills(actor) {
    let skills = actor.getItemTypes("skill")
      .filter(skill => skill.system.advances.value > 0)
      .map(skill => ({
        name: skill.name,
        nameSpec: skill.name.substring(skill.name.indexOf("(")+1, skill.name.length-1),
        total: skill.system.total.value,
        advanced: skill.system.advanced.value
      }));
    skills.sort((a,b) => a.name.localeCompare(b.name))

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
  getWeapons(actor) {
    let weapons = actor.getItemTypes("weapon")
      .map(weapon => ({
        name: weapon.name,
        category: WFRP4E.weaponGroups[weapon.system.weaponGroup.value]
      }))
    weapons.sort((a,b) => a.name.localeCompare(b.name))

    return weapons
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
        total: data.details.experience.total
      },
      skills: this.getSkills(actor),
      talents: this.getTalents(actor),
      weapons: this.getWeapons(actor),
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
