import {SystemProvider} from "../SystemProvider.js";

export class wfrp4eProvider extends SystemProvider {
  get customCSS() {
    return "wfrp4e";
  }

  get tabs() {
    return {
      currencies: { id: "currencies", visible: true, localization: "party-overview.WEALTH" },
    };
  }

  get template() {
    return "/modules/party-overview/templates/wfrp4e.hbs";
  }

  getCurrency(money) {
    const currency = {
      bp: money.find(i => i.name === game.i18n.localize("NAME.BP")).system.quantity.value,
      ss: money.find(i => i.name === game.i18n.localize("NAME.SS")).system.quantity.value,
      gc: money.find(i => i.name === game.i18n.localize("NAME.GC")).system.quantity.value,
      total: 0
    }
    currency.total = (currency.bp / 240 + currency.ss / 20 + currency.gc).toFixed(2)
    return currency
  }

  getActorDetails(actor) {
    const data = actor.system;
    const money = actor.getItemTypes("money").map(m => m.toObject());
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
      currency: this.getCurrency(money)
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
    console.log(actors)
    console.log(totalCurrency)
    return [
      actors,
      {
        totalCurrency: totalCurrency,
      },
    ];
  }
}
