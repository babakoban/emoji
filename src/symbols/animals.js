import * as Util from '../util.js';

import { EMPTY } from '../consts.js';
import { CATEGORY_UNBUYABLE, chance, Symb } from '../symbol.js';
import { Hole } from './advanced.js';
import { CATEGORY_FOOD } from './food.js';

// This file is for animal-related symbols.

export const CATEGORY_ANIMAL = Symbol('Animal');
export const CATEGORY_HUMAN = Symbol('Human');

export class Chick extends Symb {
  static emoji = '🐣';
  static rarity = 0.2;
  static description =
    '💵1<br>after 3 turns: becomes 🐔';
  static descriptionLong =
    'this is a chick. it pays 💵1 and becomes 🐔 in 3 turns.';
  constructor(timeToGrow = 3) {
    super();
    this.timeToGrow = timeToGrow;
    this.turns = 0;
  }
  async score(game, x, y) {
    await this.bounceScore(game, x, y, 1);
  }
  async evaluateConsume(game, x, y) {
    if (this.turns >= this.timeToGrow) {
      await game.board.removeSymbol(game, x, y);
      const chicken = new Chicken();
      await game.board.addSymbol(game, chicken, x, y);
      await game.eventlog.showResourceEarned(chicken.emoji(), '', this.emoji());
    }
  }
  counter(_) {
    return Math.max(0, this.timeToGrow - this.turns);
  }
  categories() {
    return [CATEGORY_ANIMAL];
  }
}

export class Chicken extends Symb {
  static emoji = '🐔';
  static rarity = 0.15;
  static description = '💵8<br>10% chance: lays up to 4 🥚';
  static descriptionLong =
    'this is a chicken. it pays 💵8 and has a 10% chance of laying up to 4 🥚 on nearby empty spaces.';
  async score(game, x, y) {
    await this.bounceScore(game, x, y, 8);
  }
  async evaluateProduce(game, x, y) {
    const coords = game.board.nextToEmpty(x, y);
    if (coords.length === 0) {
      return;
    }
    if (chance(game, 0.1, x, y)) {
      const eggCount = 1 + Util.random(4);
      for (let i = 0; i < Math.min(coords.length, eggCount); ++i) {
        const [newX, newY] = Util.randomRemove(coords);
        const egg = new Egg();
        await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
        await game.board.addSymbol(game, egg, newX, newY);
        await game.eventlog.showResourceEarned(egg.emoji(), '', this.emoji());
      }
    }
  }
  categories() {
    return [CATEGORY_ANIMAL];
  }
}

export class Egg extends Symb {
  static emoji = '🥚';
  static rarity = 0.6;
  static description = 'after 3-5 turns: hatches 🐣<br>1% chance: hatches 🐉';
  static descriptionLong =
    'this is an egg. after 3-5 turns, it becomes a 🐣, or with 1% chance it becomes a 🐉.';
  constructor() {
    super();
    this.timeToHatch = 3 + Util.random(3);
  }
  async evaluateConsume(game, x, y) {
    if (this.turns >= this.timeToHatch) {
      let newSymbol = new Chick();
      if (chance(game, 0.01, x, y)) {
        newSymbol = new Dragon();
      }
      await game.board.removeSymbol(game, x, y);
      await game.board.addSymbol(game, newSymbol, x, y);
      await game.eventlog.showResourceEarned(newSymbol.emoji(), '', this.emoji());
    }
  }
  counter(_) {
    return this.timeToHatch - this.turns;
  }
  categories() {
    return [CATEGORY_ANIMAL];
  }
}

export class Fox extends Symb {
  static emoji = '🦊';
  static rarity = 0.25;
  static description =
    '💵10<br>eats 🐔 for x3<br>eats 🐣 and 🐭 for x2<br>leaves after 5 turns with no food';
  static descriptionLong =
    'this is a fox. it pays 💵10. it eats 🐣 and 🐭 for x2 pay, and 🐔 for x3 pay. it disappears after 5 turns with no food.';
  constructor() {
    super();
    this.eatenScore = 10;
  }
  async score(game, x, y) {
    if (this.eatenScore > 0) {
      await this.bounceScore(game, x, y, this.eatenScore);
      this.eatenScore = 10;
    }
  }
  async evaluateConsume(game, x, y) {
    const eatNeighbor = async (neighborClass, mult) => {
      const coords = game.board.nextToSymbol(x, y, neighborClass.emoji);
      if (coords.length === 0) {
        return;
      }
      for (const coord of coords) {
        this.eatenScore *= mult;
        const [deleteX, deleteY] = coord;
        await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
        await game.board.removeSymbol(game, deleteX, deleteY);
      }
      this.turns = 0;
      game.board.redrawCell(game, x, y);
    };
    await eatNeighbor(Chick, 2);
    await eatNeighbor(Mouse, 2);
    await eatNeighbor(Chicken, 3);
    if (this.turns >= 5) {
      await game.board.removeSymbol(game, x, y);
    }
  }
  categories() {
    return [CATEGORY_ANIMAL];
  }
  counter(_) {
    return 5 - this.turns;
  }
}

export class Dragon extends Symb {
  static emoji = '🐉';
  static rarity = 0.01;
  static description = '💵42';
  static descriptionLong = 'this is a mighty dragon. it pays 💵42.';
  async score(game, x, y) {
    await this.bounceScore(game, x, y, 42);
  }
  categories() {
    return [CATEGORY_ANIMAL];
  }
}

export class Mouse extends Symb {
  static emoji = '🐭';
  static rarity = 0.1;
  static description =
    '💵-1<br>digs 🕳️ if no nearby holes<br>eats 🍿, 🧀, and 🌱<br>adds 🐭 after eating 🧀';
  static descriptionLong =
    'this is a mouse. it gives 💵-1 each turn. if no 🕳️ nearby, it digs a 🕳️ on a nearby empty space. it eats 🧀, 🍿, and 🌱 and adds 🐭 when it eats 🧀.';
  async score(game, x, y) {
    await this.bounceScore(game, x, y, -1);
  }
  async evaluateConsume(game, x, y) {
    for (const emoji of ['🧀', '🍿', '🌱']) {
      const coords = game.board.nextToSymbol(x, y, emoji);
      for (const coord of coords) {
        const [deleteX, deleteY] = coord;
        await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
        await game.board.removeSymbol(game, deleteX, deleteY);
        if (emoji === '🧀') {
          const spawnSites = game.board.nextToEmpty(x, y);
          if (spawnSites.length > 0) {
            const [sx, sy] = Util.randomChoose(spawnSites);
            const baby = new Mouse();
            await game.eventlog.showResourceEarned(baby.emoji(), '', this.emoji());
            await game.board.addSymbol(game, baby, sx, sy);
          }
        }
      }
    }
    if (game.board.nextToSymbol(x, y, Hole.emoji).length > 0) {
      return;
    }
    const emptySites = game.board.nextToSymbol(x, y, EMPTY);
    if (emptySites.length === 0) return;
    const [hx, hy] = Util.randomChoose(emptySites);
    await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
    await game.eventlog.showResourceEarned(Hole.emoji, '', this.emoji());
    await game.board.removeSymbol(game, hx, hy);
    await game.board.addSymbol(game, new Hole(), hx, hy);
  }
  categories() {
    return [CATEGORY_ANIMAL];
  }
}

export class Cow extends Symb {
  static emoji = '🐮';
  static rarity = 0.15;
  static description =
    '💵12<br>35% chance: makes 🥛<br>eats nearby 🌽 and 🌱<br>leaves after 5 turns with no food';
  static descriptionLong =
    'this is a cow. it pays 💵12. it has a 35% chance to add 🥛 on nearby empty space. it eats a neighboring 🌽 or 🌱 (eating does not add 🥛). it disappears after 5 turns with no food.';
  async score(game, x, y) {
    await this.bounceScore(game, x, y, 12);
  }
  async evaluateConsume(game, x, y) {
    const corn = game.board.nextToSymbol(x, y, '🌽');
    const crop = game.board.nextToSymbol(x, y, '🌱');
    const feed = [...corn, ...crop];
    if (feed.length > 0) {
      const [fx, fy] = Util.randomChoose(feed);
      await game.eventlog.showResourceLost(game.board.getEmoji(fx, fy), '', this.emoji());
      await game.board.removeSymbol(game, fx, fy);
      this.turns = 0;
      game.board.redrawCell(game, x, y);
    } else if (this.turns >= 5) {
      await game.board.removeSymbol(game, x, y);
    }
  }
  async evaluateProduce(game, x, y) {
    const coords = game.board.nextToEmpty(x, y);
    if (coords.length === 0) {
      return;
    }
    if (!chance(game, 0.35, x, y)) {
      return;
    }
    const milk = game.catalog.symbol('🥛');
    await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
    await game.eventlog.showResourceEarned(milk.emoji(), '', this.emoji());
    await game.board.addSymbol(game, milk, ...Util.randomChoose(coords));
  }
  counter(_) {
    return Math.max(0, 5 - this.turns);
  }
  categories() {
    return [CATEGORY_ANIMAL];
  }
}

export class Bug extends Symb {
  static emoji = '🐛';
  static rarity = 0.3;
  static description =
    'eats nearby food for 💵8 each<br>leaves after 5 turns with no food';
  static descriptionLong =
    'this is a bug. it will eat all edible neighbors and pay out 💵8 for each item eaten. it disappears after 5 turns with no food.';
  constructor() {
    super();
    this.foodScore = 0;
    this.timeToLive = 5;
  }
  async score(game, x, y) {
    if (this.foodScore > 0) {
      await this.bounceScore(game, x, y, this.foodScore);
    }
    this.foodScore = 0;
  }
  async evaluateConsume(game, x, y) {
    const coords = game.board.nextToCategory(x, y, CATEGORY_FOOD);
    if (coords.length === 0) {
      if (this.turns >= 5) {
        await game.board.removeSymbol(game, x, y);
      }
    } else {
      this.turns = 0;
      game.board.redrawCell(game, x, y);
      for (const coord of coords) {
        this.foodScore += 8;
        const [deleteX, deleteY] = coord;
        await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
        await game.board.removeSymbol(game, deleteX, deleteY);
      }
    }
  }
  categories() {
    return [CATEGORY_ANIMAL];
  }
  counter(_) {
    return 5 - this.turns;
  }
}
