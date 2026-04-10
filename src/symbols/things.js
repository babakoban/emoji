import * as Const from '../consts.js';
import * as Util from '../util.js';

import { Hole } from './advanced.js';
import {
  badChance,
  chance,
  Symb,
  CATEGORY_UNBUYABLE,
} from '../symbol.js';
import { Cow, Mouse, CATEGORY_ANIMAL, CATEGORY_HUMAN } from './animals.js';
import { Cheese, Chocolate, Cookie, Milk, Crop } from './food.js';
import { Empty } from './ui.js';
import { CATEGORY_TOOL } from './tools.js';

// I am aware this is a bad name for the file. This file contains the "item" like emoji -
//    It's also a dumping ground for anything that's tested enough to put into production,
//    but otherwise lacks a fitting category

export class Balloon extends Symb {
  static emoji = '🎈';
  static rarity = 0.14;
  static description = '💵20<br>50% chance: pop';
  static descriptionLong = 'this is a balloon. it gives you 💵20, but it has a 50% chance of popping and disappearing.';
  constructor() {
    super();
  }
  copy() {
    return new Balloon();
  }
  async score(game, x, y) {
    await this.bounceScore(game, x, y, 20);
  }
  async evaluateConsume(game, x, y) {
    if (badChance(game, 0.5, x, y)) {
      await game.board.removeSymbol(game, x, y);
    }
  }
}

export class Bomb extends Symb {
  static emoji = '💣';
  static rarity = 0.15;
  static description = '10% chance: destroys a neighbor';
  static descriptionLong = 'this is a bomb. there is a 10% chance it will destroy a neighboring symbol.';
  constructor() {
    super();
  }
  categories() {
    return [CATEGORY_UNBUYABLE];
  }
  copy() {
    return new Bomb();
  }
  async evaluateConsume(game, x, y) {
    if (chance(game, 0.1, x, y)) {
      const coords = game.board.nextToExpr(
        x,
        y,
        (sym) => ![Empty.emoji, Firefighter.emoji].includes(sym.emoji())
      );
      if (coords.length === 0) {
        return;
      }
      const coord = Util.randomChoose(coords);
      const [deleteX, deleteY] = coord;
      await Util.animate(game.board.getSymbolDiv(deleteX, deleteY), 'shake', 0.2, 3);
      await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
      await game.board.removeSymbol(game, deleteX, deleteY);
    }
  }
}

export class Firefighter extends Symb {
  static emoji = '🧑‍🚒';
  static rarity = 0.15;
  static description = 'disarms 💣, then leaves';
  static descriptionLong = 'this is an firefighter. if it stands to a 💣, it will remove the 💣 and leave your inventory.';
  constructor() {
    super();
  }
  categories() {
    return [CATEGORY_UNBUYABLE, CATEGORY_HUMAN];
  }
  copy() {
    return new Firefighter();
  }
  async evaluateConsume(game, x, y) {
    const coords = game.board.nextToSymbol(x, y, Bomb.emoji);
    if (coords.length === 0) {
      return;
    }
    for (const coord of coords) {
      const [deleteX, deleteY] = coord;
      await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
      await game.board.removeSymbol(game, deleteX, deleteY);
    }
    await game.board.removeSymbol(game, x, y);
  }
}

export class Moon extends Symb {
  static emoji = '🌝';
  static rarity = 0.31;
  static description = 'every 31 turns: 💵600<br>if below 🐮: adds 🧀 on all nearby empty spaces';
  static descriptionLong = 'this is a moon. every 31 turns, it gives 💵600. if below 🐮 in the same column, it adds 🧀 on all nearby empty spaces.';
  constructor(turns = 0) {
    super();
    this.turns = turns;
  }
  copy() {
    return new Moon(this.turns);
  }
  async score(game, x, y) {
    if (this.turns >= 31) {
      this.turns = 0;
      game.board.redrawCell(game, x, y);
      await Util.animate(game.board.getSymbolDiv(x, y), 'flip', 0.3);
      await this.addMoney(game, 600, x, y);
    }
  }
  async evaluateProduce(game, x, y) {
    if (x === -1 || y === -1) {
      return;
    }
    let belowCow = false;
    for (let ry = 0; ry < y; ry++) {
      if (game.board.cells[ry][x].emoji() === Cow.emoji) {
        belowCow = true;
        break;
      }
    }
    if (!belowCow) return;
    const coords = game.board.nextToEmpty(x, y);
    for (const coord of coords) {
      const [nx, ny] = coord;
      const cheese = new Cheese();
      await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
      await game.eventlog.showResourceEarned(cheese.emoji(), '', this.emoji());
      await game.board.addSymbol(game, cheese, nx, ny);
    }
  }
  counter(_) {
    return 31 - this.turns;
  }
}

export class SewingKit extends Symb {
  static emoji = '🧵';
  static rarity = 0.08;
  static description = '💵4 base, x2 per 🕳️ removed this turn';
  static descriptionLong = 'this is a sewing kit. it pays 💵4, doubled for each neighboring 🕳️ removed that turn.';
  constructor() {
    super();
  }
  copy() {
    return new SewingKit();
  }
  async evaluateConsume(game, x, y) {
    const coords = game.board.nextToSymbol(x, y, Hole.emoji);
    if (coords.length === 0) {
      return;
    }
    for (const coord of coords) {
      const [deleteX, deleteY] = coord;
      await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
      await game.board.removeSymbol(game, deleteX, deleteY);
    }
    const payout = 4 * 2 ** coords.length;
    await this.bounceScore(game, x, y, payout);
    game.board.redrawCell(game, x, y);
  }
}


export class Poison extends Symb {
  static emoji = '☠️';
  static rarity = 0.01;
  static description =
    'removes nearby animals and people<br>disappears after use';
  static descriptionLong =
    'this is poison. it removes all nearby animals and people, then disappears after use.';
  cost() {
    return { [Const.MONEY]: 50 };
  }
  async evaluateConsume(game, x, y) {
    const coords = game.board.nextToExpr(x, y, (sym) =>
        sym.categories().includes(CATEGORY_ANIMAL) ||
        sym.categories().includes(CATEGORY_HUMAN)
    );
    if (coords.length === 0) return;
    await Util.animate(game.board.getSymbolDiv(x, y), 'shake', 0.15, 2);
    for (const coord of coords) {
      const [deleteX, deleteY] = coord;
      await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
      await game.board.removeSymbol(game, deleteX, deleteY);
    }
    await game.board.removeSymbol(game, x, y);
  }
}

// export class Lootbox extends Symb {
//   static emoji = '🎁';
//   static rarity = 0.25;
//   static description = "opens and turns into a random symbol. 20% chance: it's a rare.";
//   static descriptionLong = "this is a lootbox. opens and turns into a random symbol. 20% chance: it's a rare.";
//   constructor() { super(); }
//   copy() { return new Lootbox(); }
//   async evaluateProduce(game, x, y) {
//     const rareOnly = chance(game, 0.2, x, y);
//     const bag = game.catalog.generateShop(1, game.inventory.getResource(Const.LUCK), rareOnly, [CATEGORY_UNBUYABLE, CATEGORY_TOOL]);
//     await game.board.removeSymbol(game, x, y);
//     const sym = Util.randomChoose(bag);
//     await game.eventlog.showResourceEarned(sym.emoji(), '', this.emoji());
//     await game.board.addSymbol(game, sym, x, y);
//     game.inventory.giftsOpened++;
//   }
// }

export class Lootbox extends Symb {
  static emoji = '🎁';
  static rarity = 0.25;
  static description = "opens and turns into a random symbol. 20% chance: it's a 🍫.";
  static descriptionLong = "this is a lootbox. opens and turns into a random symbol. 20% chance: it's a 🍫.";
  constructor() {
    super();
  }
  copy() {
    return new Lootbox();
  }
  async evaluateProduce(game, x, y) {
    await game.board.removeSymbol(game, x, y);
    game.inventory.giftsOpened++;
    if (chance(game, 0.2, x, y)) {
      const choc = new Chocolate();
      await game.eventlog.showResourceEarned(choc.emoji(), '', this.emoji());
      await game.board.addSymbol(game, choc, x, y);
      return;
    }
    const rareOnly = chance(game, 0.2, x, y);
    const bag = game.catalog.generateShop(
      1,
      game.inventory.getResource(Const.LUCK),
      /* rareOnly= */ rareOnly,
      /* bannedCategories= */[CATEGORY_UNBUYABLE, CATEGORY_TOOL]);
    const sym = Util.randomChoose(bag);
    await game.eventlog.showResourceEarned(sym.emoji(), '', this.emoji());
    await game.board.addSymbol(game, sym, x, y);
  }
}

export class Santa extends Symb {
  static emoji = Util.randomChoose(['🎅🏻', '🎅🏼', '🎅🏽', '🎅🏾', '🎅🏿']);
  static rarity = 0.07;
  static description = '💵25 per 🎁<br>💵25 per 🥛 consumed<br>💵100 per 🍪 eaten';
  static descriptionLong = 'this is santa. it gives 💵25 for each 🎁 opened this run. it permanently gives more 💵 for consuming 🥛 (💵25) and 🍪 (💵100).';
  constructor() {
    super();
    this.treatsConsumed = 0;
  }
  copy() {
    const s = new Santa();
    s.treatsConsumed = this.treatsConsumed;
    return s;
  }
  total(game) {
    return game.inventory.giftsOpened + this.treatsConsumed;
  }
  counter(game) {
    return this.total(game);
  }
  async evaluateConsume(game, x, y) {
    let changed = false;
    for (const [mx, my] of game.board.nextToSymbol(x, y, Milk.emoji)) {
      await game.eventlog.showResourceLost(game.board.getEmoji(mx, my), '', this.emoji());
      await game.board.removeSymbol(game, mx, my);
      this.treatsConsumed++;
      changed = true;
    }
    const cookies = game.board.nextToSymbol(x, y, Cookie.emoji);
    if (cookies.length) {
      for (const [cx, cy] of cookies) {
        await game.eventlog.showResourceLost(game.board.getEmoji(cx, cy), '', this.emoji());
        await game.board.removeSymbol(game, cx, cy);
      }
      this.treatsConsumed += 4 * cookies.length;
      changed = true;
    }
    if (changed) game.board.redrawCell(game, x, y);
  }
  async score(game, x, y) {
    const value = 25 * this.total(game);
    if (value > 0) {
      await this.bounceScore(game, x, y, value);
    }
  }
  categories() {
    return [CATEGORY_HUMAN];
  }
}

export class Cloud extends Symb {
  static emoji = '☁️';
  static rarity = 0.1;
  static description = '💵6 per empty space<br>20% chance: it rains 🌧️';
  static descriptionLong =
    'this is a cloud. it gives 💵6 for each empty space. 20% chance to be 🌧️.';
  constructor() {
    super();
    this._isRain = false;
  }
  emoji() {
    return this._isRain ? '🌧️' : '☁️';
  }
  async evaluateProduce(game, x, y) {
    this._isRain = chance(game, 0.2, x, y);
    game.board.redrawCell(game, x, y);
  }
  async score(game, x, y) {
    const emptySpaces = game.board.forAllExpr((e) => e.emoji() === Empty.emoji);
    if (emptySpaces.length > 0) {
      await this.bounceScore(game, x, y, emptySpaces.length * 6);
    }
  }
}

export class RainCloud extends Symb {
  static emoji = '🌧️';
  static rarity = 0;
  static description = '💵6 per empty space<br>🌱, 🌳, and 🌽 below grow instantly';
  static descriptionLong =
    'this is a rain cloud. it gives 💵6 for each empty space. 🌱, 🌳, and 🌽 below it in the same column grow instantly.';
  categories() {
    return [CATEGORY_UNBUYABLE];
  }
}

export class Farmer extends Symb {
  static emoji = '🧑‍🌾';
  static rarity = 0.15;
  static description = '50% chance to plant 🌱 in each neighboring 🕳️';
  static descriptionLong =
    'this is a farmer. it has a 50% chance to plant 🌱 in each neighboring 🕳️.';
  categories() {
    return [CATEGORY_HUMAN];
  }
  async evaluateProduce(game, x, y) {
    if (x === -1 || y === -1) return;
    for (const [hx, hy] of game.board.nextToSymbol(x, y, Hole.emoji)) {
      if (!chance(game, 0.5, hx, hy)) continue;
      await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.12);
      const crop = new Crop();
      await game.eventlog.showResourceEarned(crop.emoji(), '', this.emoji());
      await game.board.addSymbol(game, crop, hx, hy);
    }
  }
}