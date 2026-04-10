import * as Util from '../util.js';

import { badChance, chance, Symb } from '../symbol.js';

// Most symbols in here are related to Coin (🪙), with some gambling related stuff thrown in for good measure.

export const CATEGORY_GAMBLING = Symbol('Gambling');
export const CATEGORY_BUSINESS = Symbol('Business');

export class Coin extends Symb {
  static emoji = '🪙';
  static rarity = 1;
  static description = '💵2';
  static descriptionLong = 'this is a coin. it pays 💵2.';
  getValue(game) {
    const activeCount = game.board.forAllExpr(
      (e, _x, _y) => e.emoji() === FlyingMoney.emoji).length;
    const passiveCount = game.inventory.getResource(FlyingMoney.emoji);
    return 2 + activeCount + passiveCount;
  }
  async score(game, x, y) {
    await this.bounceScore(game, x, y, this.getValue(game));
  }
}

export class Briefcase extends Symb {
  static emoji = '💼';
  static rarity = 0.13;
  static description = '💵5 for every 4 symbols in inventory';
  static descriptionLong = 'this is a briefcase. it pays 💵5 for every 4 symbols you have in your inventory.';
  constructor() {
    super();
    this.count = 0;
  }
  async score(game, x, y) {
    const value = this.counter(game);
    await this.bounceScore(game, x, y, value);
  }
  categories() {
    return [CATEGORY_BUSINESS];
  }
  counter(game) {
    return Math.trunc(game.inventory.symbols.length / 4) * 5;
  }
}

export class Bank extends Symb {
  static emoji = '🏦';
  static rarity = 0.4;
  static description = 'every turn: makes 🪙';
  static descriptionLong = 'this is a bank. if there is empty space nearby, it will put 🪙 there.';
  constructor() {
    super();
    this.turns = 0;
  }
  async evaluateProduce(game, x, y) {
    const mint = async () => {
      const coords = game.board.nextToEmpty(x, y);
      if (coords.length === 0) {
        return;
      }
      const coin = new Coin();
      const [newX, newY] = Util.randomChoose(coords);
      await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
      await game.eventlog.showResourceEarned(coin.emoji(), '', this.emoji());
      await game.board.addSymbol(game, coin, newX, newY);
    };
    await mint();
  }
  categories() {
    return [CATEGORY_BUSINESS];
  }
}

export class CreditCard extends Symb {
  static emoji = '💳';
  static rarity = 0.35;
  static description = '💵1000 now.<br>💵-1100 on last turn';
  static descriptionLong = "this is a credit card. it pays 💵1000, but takes 💵1100 when on board on your last turn.";
  constructor(turn = 0) {
    super();
    this.turn = turn;
  }
  copy() {
    return new CreditCard();
  }
  async finalScore(game, x, y) {
    await Util.animate(game.board.getSymbolDiv(x, y), 'flip', 0.15, 3);
    await this.addMoney(game, -1100, x, y);
  }
  async score(game, x, y) {
    this.turn += 1;
    if (this.turn === 1) {
      await this.bounceScore(game, x, y, 1000);
    }
  }
}

export class MoneyBag extends Symb {
  static emoji = '💰';
  static rarity = 0.5;
  static description = 'collects neighboring 🪙';
  static descriptionLong = 'this is a money bag. it collects neighboring 🪙 and stacks them up.';
  constructor(coins = 0) {
    super();
    this.coins = coins;
    this.coin = new Coin();  // Used to calculate current coin value.
  }
  copy() {
    return new MoneyBag(this.coins);
  }
  async score(game, x, y) {
    if (this.coins > 0) {
      const value = this.coins * this.coin.getValue(game);
      await this.bounceScore(game, x, y, value);
    }
  }
  async evaluateConsume(game, x, y) {
    const coords = game.board.nextToSymbol(x, y, Coin.emoji);
    if (coords.length === 0) {
      return;
    }
    for (const coord of coords) {
      this.coins++;
      const [deleteX, deleteY] = coord;
      await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
      await game.board.removeSymbol(game, deleteX, deleteY);
      game.board.redrawCell(game, x, y);
    }
  }
  counter(_) {
    return this.coins;
  }
}

export class Jar extends Symb {
  static emoji = '🫙';
  static rarity = 0.15;
  static description = '💵8 per different symbol in inventory';
  static descriptionLong = 'this is a jar. it pays 💵8 for all the different symbols in your inventory.';
  async score(game, x, y) {
    const value = this.counter(game) * 8;
    await this.bounceScore(game, x, y, value);
  }
  categories() {
    return [CATEGORY_GAMBLING];
  }
  counter(game) {
    return new Set(game.inventory.symbols.map((s) => s.emoji())).size;
  }
}

export class Dice extends Symb {
  static emoji = '🎲';
  static rarity = 0.11;
  static description = '80% chance: 💵-123<br>20% chance: 💵456';
  static descriptionLong = 'this is a die. it has 80% chance to pay 💵-123 and 20% chance to pay 💵456.';
  cost() {
    return {'💵': 77};
  }
  async score(game, x, y) {
    if (badChance(game, 0.8, x, y)) {
      await Util.animate(game.board.getSymbolDiv(x, y), 'shake', 0.15, 2);
      await this.addMoney(game, -123, x, y);
    } else {
      await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15, 3);
      await this.addMoney(game, 456, x, y);
    }
  }
  categories() {
    return [CATEGORY_GAMBLING];
  }
}

export class FlyingMoney extends Symb {
  static emoji = '💸';
  static rarity = 0.12;
  static description = 'each 🪙 is worth 💵1 more.';
  static descriptionLong = 'increases the value of each 🪙 you have by 💵1.';
  async score(_game, _x, _y) {
  }
}
