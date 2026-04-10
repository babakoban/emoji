import * as Util from '../util.js';

import { chance, Symb, CATEGORY_UNBUYABLE } from '../symbol.js';
import { Empty } from './ui.js';
import { FortuneCookie } from './advanced.js';

// Symbols in this file are related to food, beverages, or ingredients

export const CATEGORY_FOOD = Symbol('Food');
export const CATEGORY_FRUIT = Symbol('Fruit');
export const CATEGORY_VEGETABLES = Symbol('Vegetables');

function belowRain(game, x, y) {
  for (let ry = 0; ry < y; ry++) {
    if (game.board.cells[ry][x].emoji() === '🌧️') return true;
  }
  return false;
}

export class Butter extends Symb {
  static emoji = '🧈';
  static rarity = 0.1;
  static description = 'x4 to neighboring 🍿<br>removes neighboring 🥚 to become 🥣<br>melts after 7 turns';
  static descriptionLong =
    'this is butter. it quadruples the value of all neighboring 🍿. if next to 🥚, it consumes it and becomes 🥣. it disappears after 7 turns.';
  async evaluateConsume(game, x, y) {
    const eggs = game.board.nextToSymbol(x, y, '🥚');
    if (eggs.length > 0) {
      const [ex, ey] = eggs[0];
      await game.eventlog.showResourceLost(game.board.getEmoji(ex, ey), '', this.emoji());
      await game.board.removeSymbol(game, ex, ey);
      await game.board.removeSymbol(game, x, y);
      await game.eventlog.showResourceEarned(Batter.emoji, '', this.emoji());
      await game.board.addSymbol(game, new Batter(), x, y);
      return;
    }
    if (this.turns >= 7) {
      await game.board.removeSymbol(game, x, y);
    }
  }
  counter() {
    return 7 - this.turns;
  }
  categories() {
    return [CATEGORY_FOOD];
  }
}

export class Cheese extends Symb {
  static emoji = '🧀';
  static rarity = 0.02;
  static description = '💵15<br>x2 per neighboring 🍹<br>x4 per neighboring 🍾';
  static descriptionLong =
    'this is cheese. it pays 💵15, x2 for each neighboring 🍹, and x4 for each neighboring 🍾.';
  async score(game, x, y) {
    const base = 15;
    const champs = game.board.nextToSymbol(x, y, '🍾').length;
    const cocktails = game.board.nextToSymbol(x, y, '🍹').length;
    const mult = 4 ** champs * 2 ** cocktails;
    await this.bounceScore(game, x, y, base * mult);
  }
  categories() {
    return [CATEGORY_FOOD];
  }
}

export class Milk extends Symb {
  static emoji = '🥛';
  static rarity = 0.15;
  static description = '💵10<br>merges with neighboring 🥛 to make 🧀 (10% chance: 🧈)<br>spoils after 4 turns';
  static descriptionLong =
    'this is milk. it pays 💵10. if next to another 🥛, they merge into 🧀 — 10% chance to make 🧈 instead. spoils after 4 turns.';
  async score(game, x, y) {
    await this.bounceScore(game, x, y, 10);
  }
  async evaluateConsume(game, x, y) {
    const others = game.board.nextToSymbol(x, y, Milk.emoji);
    if (others.length >= 1) {
      await Util.animate(game.board.getSymbolDiv(x, y), 'flip', 0.25);
      const [ox, oy] = others[0];
      await game.eventlog.showResourceLost(game.board.getEmoji(ox, oy), '', Milk.emoji);
      await game.board.removeSymbol(game, ox, oy);
      await game.eventlog.showResourceLost(game.board.getEmoji(x, y), '', Milk.emoji);
      await game.board.removeSymbol(game, x, y);
      const product = chance(game, 0.1, x, y) ? new Butter() : new Cheese();
      await game.eventlog.showResourceEarned(product.emoji(), '', Milk.emoji);
      await game.board.addSymbol(game, product, x, y);
      return;
    }
    if (this.turns >= 4) {
      await game.board.removeSymbol(game, x, y);
    }
  }
  counter(_) {
    return Math.max(0, 4 - this.turns);
  }
  categories() {
    return [CATEGORY_FOOD];
  }
}

export class Chocolate extends Symb {
  static emoji = '🍫';
  static rarity = 0.05;
  static description = '💵20';
  static descriptionLong = 'this is chocolate. it pays 💵20.';
  async score(game, x, y) {
    await this.bounceScore(game, x, y, 20);
  }
  categories() {
    return [CATEGORY_FOOD];
  }
}

export class Batter extends Symb {
  static emoji = '🥣';
  static rarity = 0;
  static description = 'removes neighboring 🍫 to become 🍪<br>removes neighboring 🍀 to become 🥠';
  static descriptionLong =
    'this is batter. it can remove neighboring 🍫 to become a 🍪 or remove neighboring 🍀 to become 🥠.';
  async evaluateConsume(game, x, y) {
    const tryTransform = async (symbol, CreatedClass, createdEmoji) => {
      const neighbors = game.board.nextToSymbol(x, y, symbol);
      if (neighbors.length === 0) return false;
      const [nx, ny] = neighbors[0];
      await game.eventlog.showResourceLost(game.board.getEmoji(nx, ny), '', this.emoji());
      await game.board.removeSymbol(game, nx, ny);
      await Util.animate(game.board.getSymbolDiv(x, y), 'flip', 0.25);
      await game.board.removeSymbol(game, x, y);
      await game.eventlog.showResourceEarned(createdEmoji, '', this.emoji());
      await game.board.addSymbol(game, new CreatedClass(), x, y);
      return true;
    };
    await tryTransform(Chocolate.emoji, Cookie, Cookie.emoji) ||
    await tryTransform('🍀', FortuneCookie, '🥠');
  }
  categories() {
    return [CATEGORY_FOOD, CATEGORY_UNBUYABLE];
  }
}

export class Cookie extends Symb {
  static emoji = '🍪';
  static rarity = 0.02;
  static description = '💵30<br>x3 per neighboring 🥛';
  static descriptionLong = 'this is a cookie. it pays 💵30, x3 for each neighboring 🥛.';
  async score(game, x, y) {
    const milks = game.board.nextToSymbol(x, y, Milk.emoji).length;
    await this.bounceScore(game, x, y, 30 * 3 ** milks);
  }
  categories() {
    return [CATEGORY_FOOD];
  }
}

export class Cherry extends Symb {
  static emoji = '🍒';
  static rarity = 0.8;
  static description = '💵2 for each neighboring 🍒';
  static descriptionLong =
    'this is a cherry. it pays 💵2 for each other 🍒 next to it.';
  async score(game, x, y) {
    const coords = game.board.nextToSymbol(x, y, Cherry.emoji);
    if (coords.length === 0) {
      return;
    }
    await Util.animate(game.board.getSymbolDiv(x, y), 'flip', 0.15);
    await this.addMoney(game, coords.length * 2, x, y);
  }
  categories() {
    return [CATEGORY_FOOD, CATEGORY_FRUIT];
  }
}

export class Corn extends Symb {
  static emoji = '🌽';
  static rarity = 0.2;
  static description = '💵21<br>15% chance: pops 🍿';
  static descriptionLong =
    'this is corn. it pays 💵21 and has a 15% chance to pop 🍿 on nearby empty spaces.';
  async score(game, x, y) {
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
    await this.addMoney(game, 21, x, y);
  }
  async evaluateProduce(game, x, y) {
    const coords = game.board.nextToEmpty(x, y);
    if (coords.length === 0) {
      return;
    }
    if (!belowRain(game, x, y) && !chance(game, 0.15, x, y)) return;
    for (let i = 0; i < coords.length; ++i) {
      const [newX, newY] = coords[i];
      const popcorn = new Popcorn();
      await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
      await game.eventlog.showResourceEarned(popcorn.emoji(), '', this.emoji());
      await game.board.addSymbol(game, popcorn, newX, newY);
    }
  }
  categories() {
    return [CATEGORY_VEGETABLES, CATEGORY_FOOD];
  }
}

// export class Mango extends Symb {
//   static emoji = '🥭';
//   constructor() {
//     super();
//     this.rarity = 0.06;
//   }
//   copy() {
//     return new Mango();
//   }
//   async evaluateScore(game, x, y) {
//     const coords = game.board.nextToCategory(x, y, CATEGORY_FRUIT);
//     if (coords.length === 0) {
//       return;
//     }
//     await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15, 2);
//     for (const coord of coords) {
//       const [neighborX, neighborY] = coord;
//       game.board.cells[neighborY][neighborX].multiplier *= 2;
//     }
//   }
//   categories() {
//     return [CATEGORY_FRUIT, CATEGORY_FOOD];
//   }
//   description() {
//     return 'x2 to neighboring fruit';
//   }
//   descriptionLong() {
//     return 'this is a mango. it makes nearby fruit give double 💵.';
//   }
// }

export class Pineapple extends Symb {
  static emoji = '🍍';
  static rarity = 0.4;
  static description = '💵12<br>💵-2 for all non-empty neighbors';
  static descriptionLong =
    'this is a pineapple. it pays 💵12, minus 💵2 for all neighboring symbols that are not empty.';
  async score(game, x, y) {
    const coords = game.board.nextToExpr(
      x,
      y,
      (sym) => sym.emoji() !== Empty.emoji
    );
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
    await this.addMoney(game, 12 - coords.length * 2, x, y);
  }
  categories() {
    return [CATEGORY_FRUIT, CATEGORY_FOOD];
  }
}

export class Crop extends Symb {
  static emoji = '🌱';
  static rarity = 0;
  static description = '💵1<br>becomes 🌽 in 3 turns';
  static descriptionLong =
    'this is a crop. it pays 💵1 and becomes 🌽 in 3 turns.';
  async score(game, x, y) {
    await this.bounceScore(game, x, y, 1);
  }
  categories() {
    return [CATEGORY_VEGETABLES, CATEGORY_FOOD, CATEGORY_UNBUYABLE];
  }
  counter(_) {
    return Math.max(0, 3 - this.turns);
  }
  async checkGrowth(game, x, y) {
    if (this.turns < 3) return;
    const sym = new Corn();
    await Util.animate(game.board.getSymbolDiv(x, y), 'flip', 0.25);
    await game.board.removeSymbol(game, x, y);
    await game.board.addSymbol(game, sym, x, y);
    await game.eventlog.showResourceEarned(sym.emoji(), '', this.emoji());
  }
  async evaluateProduce(game, x, y) {
    if (belowRain(game, x, y)) {
      this.turns = 3;
    }
    game.board.redrawCell(game, x, y);
    await this.checkGrowth(game, x, y);
  }
}

export class Popcorn extends Symb {
  static emoji = '🍿';
  static rarity = 0;
  static description = '💵17<br>disappears after 2-7 turns';
  static descriptionLong =
    'this is popcorn. it pays 💵17 and disappears after 2-7 turns.';
  constructor() {
    super();
    this.timeToLive = 2 + Util.random(6);
  }
  async score(game, x, y) {
    const butter = game.board.nextToSymbol(x, y, Butter.emoji);
    let score = 17;
    for (const _ of butter) {
      score *= 4;
    }
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
    await this.addMoney(game, score, x, y);
  }
  async evaluateConsume(game, x, y) {
    if (this.turns >= this.timeToLive) {
      await game.board.removeSymbol(game, x, y);
    }
  }
  counter(_) {
    return this.timeToLive - this.turns;
  }
  categories() {
    return [CATEGORY_FOOD];
  }
}

export class Bubble extends Symb {
  static emoji = '🫧';
  static rarity = 0;
  static description = 'disappears after 3 turns';
  static descriptionLong =
    "this is a bubble. it doesn't really do anything. it will disappear after 3 turns.";
  async evaluateConsume(game, x, y) {
    if (this.turns < 3) {
      return;
    }
    await game.board.removeSymbol(game, x, y);
  }
  counter(_) {
    return 3 - this.turns;
  }
  categories() {
    return [CATEGORY_UNBUYABLE];
  }
}

export class Cocktail extends Symb {
  static emoji = '🍹';
  static rarity = 0.27;
  static description =
    '💵2 per 🍒 removed.<br>💵4 per 🍍 removed.<br>x1.5 per 🍾 removed.';
  static descriptionLong =
    'this is a cocktail. it permanently gives more 💵 by removing neighboring 🍒 (💵2), 🍍 (💵4) and 🍾 (x1.5).';
  constructor(cherryScore = 0) {
    super();
    this.cherryScore = cherryScore;
  }
  copy() {
    return new Cocktail(this.cherryScore);
  }
  async score(game, x, y) {
    if (this.cherryScore > 0) {
      await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
      await this.addMoney(game, this.cherryScore, x, y);
    }
  }
  async evaluateConsume(game, x, y) {
    const remove = async (sym, reward) => {
      const coords = game.board.nextToSymbol(x, y, sym.emoji);
      if (coords.length === 0) {
        return;
      }
      for (const coord of coords) {
        this.cherryScore = reward(this.cherryScore);
        const [deleteX, deleteY] = coord;
        await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
        await game.board.removeSymbol(game, deleteX, deleteY);
        game.board.redrawCell(game, x, y);
      }
    };
    await remove(Cherry, (v) => v + 2);
    await remove(Pineapple, (v) => v + 4);
    await remove(Champagne, (v) => Math.trunc(v * 1.5));
  }
  counter(_) {
    return this.cherryScore;
  }
}

export class Champagne extends Symb {
  static emoji = '🍾';
  static rarity = 0.07;
  static description = '💵70<br>after 3 turns: explodes';
  static descriptionLong =
    'this is a champagne. it pays 💵70, but explodes after 3 turns, making 🫧 on empty neighboring spaces and itself.';
  async score(game, x, y) {
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
    await this.addMoney(game, 70, x, y);
  }
  async evaluateProduce(game, x, y) {
    if (x === -1 || y === -1) {
      return;
    }
    if (this.turns < 3) {
      return;
    }
    await Util.animate(game.board.getSymbolDiv(x, y), 'shake', 0.15, 2);
    await game.board.removeSymbol(game, x, y);
    const bubble = new Bubble();
    await game.board.addSymbol(game, bubble, x, y);
    const coords = game.board.nextToEmpty(x, y);
    if (coords.length === 0) {
      return;
    }
    await game.eventlog.showResourceEarned(bubble.emoji(), (coords.length + 1) + '', this.emoji());
    for (let i = 0; i < coords.length; ++i) {
      const [newX, newY] = coords[i];
      const bubble = new Bubble();
      await game.board.addSymbol(game, bubble, newX, newY);
    }
  }
  counter(_) {
    return 3 - this.turns;
  }
}

export class Tree extends Symb {
  static emoji = '🌳';
  static rarity = 0.4;
  static description = 'every 3 turns: grows 🍒🍒';
  static descriptionLong =
    'this is a tree. every 3 turns, it grows up to two 🍒 on nearby empty space.';
  async evaluateProduce(game, x, y) {
    const grow = async () => {
      const coords = game.board.nextToEmpty(x, y);
      if (coords.length === 0) return;
      const [newX, newY] = Util.randomRemove(coords);
      const cherry = new Cherry();
      await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
      await game.eventlog.showResourceEarned(cherry.emoji(), '', this.emoji());
      await game.board.addSymbol(game, cherry, newX, newY);
    };
    if (belowRain(game, x, y)) {
      this.turns = 3;
      game.board.redrawCell(game, x, y);
    }
    if (this.turns % 3 === 0) {
      await grow();
      await grow();
    }
  }
  counter(_) {
    return 3 - (this.turns % 3);
  }
}
