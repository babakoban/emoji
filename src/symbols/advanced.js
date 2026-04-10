import * as Const from '../consts.js';
import * as Util from '../util.js';

import { chance, Symb, CATEGORY_EMPTY_SPACE } from '../symbol.js';
import { Empty } from './ui.js';
import { CATEGORY_FOOD, CATEGORY_VEGETABLES } from './food.js';

// The symbols in this file are mostly grouped by the fact that they manipulate the game itself rather than reward money

export class MagicWand extends Symb {
  static emoji = '🪄';
  static rarity = 0.1;
  static description = '15% chance: duplicates neighboring symbol';
  static descriptionLong = 'this is a magic wand. it has a 15% chance to copy a neighboring symbol and place it on nearby empty space.';
  async evaluateProduce(game, x, y) {
    const emptyCoords = game.board.nextToEmpty(x, y);
    if (emptyCoords.length === 0) {
      return;
    }
    const nonEmptyCoords = game.board.nextToExpr(
      x,
      y,
      (sym) => sym.emoji() !== Empty.emoji
    );
    if (nonEmptyCoords.length === 0) {
      return;
    }
    if (chance(game, 0.15, x, y)) {
      const [copyX, copyY] = Util.randomChoose(nonEmptyCoords);
      const [newX, newY] = Util.randomChoose(emptyCoords);
      const newSymbol = game.board.cells[copyY][copyX].copy();
      await Util.animate(game.board.getSymbolDiv(x, y), 'rotate', 0.15, 1);
      await game.board.addSymbol(game, newSymbol, newX, newY);
      await game.eventlog.showResourceEarned(newSymbol.emoji(), '', this.emoji());
    }
  }
}

export class Multiplier extends Symb {
  static emoji = '❎';
  static rarity = 0.07;
  static description = 'x2 to all neighbors';
  static descriptionLong = 'this is a multiplier. it doubles the 💵 gained (or lost) for all neighboring symbols.';
  async evaluateProduce(game, x, y) {
    const coords = game.board.nextToExpr(
      x,
      y,
      (sym) => sym.emoji() !== Empty.emoji
    );
    if (coords.length === 0) {
      return;
    }
    for (const coord of coords) {
      const [neighborX, neighborY] = coord;
      game.board.cells[neighborY][neighborX].multiplier *= 2;
    }
  }
}

export class Refresh extends Symb {
  static emoji = '🔀';
  static rarity = 0.05;
  static description = 'always allows refreshing the shop';
  static descriptionLong = 'this is a refresher. it allows refreshing the selection in the shop more than once. careful, the cost of refreshing also increases.';
  async evaluateProduce(game, _, __) {
    game.shop.haveRefreshSymbol = true;
    game.shop.refreshCount = 0;
  }
}

export class ShoppingBag extends Symb {
  static emoji = '🛍️';
  static rarity = 0.07;
  static description = 'allows picking 1 more item';
  static descriptionLong = 'these are shopping bags. you can choose one more item to buy from the shop.';
  async evaluateProduce(game, _, __) {
    game.shop.buyCount++;
  }
}

export class PostBox extends Symb {
  static emoji = '📮';
  static rarity = 0.06;
  static description = 'shop has 1 more item';
  static descriptionLong = 'this is a post box. you get one more option to buy in the shop.';
  async evaluateProduce(game, _, __) {
    game.shop.buyLines++;
  }
}

export class Hole extends Symb {
  static emoji = '🕳️';
  static rarity = 0.21;
  static description = 'always empty';
  static descriptionLong = 'this is a hole. it works like an empty space, other symbols can be created here and they will go into your inventory.';
  categories() {
    return [CATEGORY_EMPTY_SPACE];
  }
}

export class Clover extends Symb {
  static emoji = '🍀';
  static rarity = 0.21;
  static description = '+1% luck';
  static descriptionLong = 'this is a clover. it gives you luck. symbols having a chance to do something good will succeed more. rare items show up more frequently in the shop.';
  categories() {
    return [CATEGORY_VEGETABLES, CATEGORY_FOOD];
  }
  async evaluateProduce(game, x, y) {
    game.inventory.addLuck(1);
    if (x === -1 || y === -1) {
      return;
    }
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
  }
}

export class CrystalBall extends Symb {
  static emoji = '🔮';
  static rarity = 0.05;
  static description = '+3% luck';
  static descriptionLong = 'this is a crystal ball. it gives you luck. symbols having a chance to do something good will succeed more. rare items show up more frequently in the shop.';
  async evaluateProduce(game, x, y) {
    game.inventory.addLuck(3);
    if (x === -1 || y === -1) {
      return;
    }
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
  }
}

export class FortuneCookie extends Symb {
  static emoji = '🥠';
  static rarity = 0.11;
  static description = '💵5 for each point of luck you have';
  static descriptionLong = 'this is a fortune cookie. it pays 💵5 for each percent of luck you have.';
  counter(game) {
    return game.inventory.getResource(Const.LUCK) * 5;
  }
  categories() {
    return [CATEGORY_FOOD];
  }
  async score(game, x, y) {
    await this.bounceScore(game, x, y, this.counter(game));
  }
}

export class BullsEye extends Symb {
  static emoji = '🎯';
  static rarity = 0.045;
  static description = 'neighboring rolls always succeed';
  static descriptionLong = 'this is a bullseye. any neighboring symbol that has a chance of doing something will always succeed.';
}

export class Rocket extends Symb {
  static emoji = '🚀';
  static rarity = 0.18;
  static description = 'speeds up neighbors by 1 turn';
  static descriptionLong = 'this is a rocket. all neighboring symbols that have a timer will complete one turn faster.';
  async evaluateProduce(game, x, y) {
    const coords = game.board.nextToCoords(x, y);
    for (const cell of coords) {
      const [neighborX, neighborY] = cell;
      game.board.cells[neighborY][neighborX].turns++;
    }
  }
}

export class Ice extends Symb {
  static emoji = '🧊';
  static rarity = 0.12;
  static description = 'slows down neighbors by 1 turn';
  static descriptionLong = 'this is ice. all neighboring symbols that have a timer will take one more turn to complete.';
  async evaluateProduce(game, x, y) {
    const coords = game.board.nextToCoords(x, y);
    for (const cell of coords) {
      const [neighborX, neighborY] = cell;
      game.board.cells[neighborY][neighborX].turns--;
    }
  }
}

export class Rows extends Symb {
  static emoji = '🎰';
  static rarity = 0.03;
  static description = '+1 row';
  static descriptionLong = 'this is a slot machine. it increases the number of rows on the board after the next turn.';
  async evaluateProduce(game, x, y) {
    game.inventory.rowCount += 1;
    if (x === -1 || y === -1) {
      return;
    }
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
  }
}
