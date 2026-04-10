import { chance, Symb } from '../symbol.js';
import * as Util from '../util.js';

import { CATEGORY_HUMAN } from './animals.js';

// Symbols in this file have to do with either Rock (🪨) or Diamond (💎) generally.

export class Diamond extends Symb {
  static emoji = '💎';
  static rarity = 0.1;
  static description =
    '💵7<br>💵7 for each neighboring 💎<br>x7 if 5 in a row<br>x7 if 5 in a column';
  static descriptionLong =
    'this is a diamond. it pays 💵7 and 💵7 for each other 💎 next to it. x7 if all symbols in a row are 💎. x7 if all symbols in a column are 💎.';
  async score(game, x, y) {
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
    const coords = game.board.nextToSymbol(x, y, Diamond.emoji);
    const rowMult = game.board.allSameInRow(x, y) ? 7 : 1;
    const colMult = game.board.allSameInColumn(x, y) ? 7 : 1;
    if (rowMult !== 1) {
      await Util.animate(game.board.getSymbolDiv(x, y), 'flip', 0.15);
    }
    if (colMult !== 1) {
      await Util.animate(game.board.getSymbolDiv(x, y), 'flip', 0.15);
    }
    const score = (7 + (coords.length * 7)) * rowMult * colMult;
    await this.addMoney(game, score, x, y);
  }
}

export class Rock extends Symb {
  static emoji = '🪨';
  static rarity = 0.55;
  static description = '💵1';
  static descriptionLong = "this is a rock. it pays 💵1.";
  async score(game, x, y) {
    await this.bounceScore(game, x, y, 1);
  }
}

export class Volcano extends Symb {
  static emoji = '🌋';
  static rarity = 0.1;
  static description = '10% chance: replaces random tile with 🪨x5';
  static descriptionLong =
    'this is a volcano. it has a 10% chance to replace a random tile on the board with five 🪨.';
  async evaluateProduce(game, x, y) {
    if (chance(game, 0.1, x, y)) {
      const newX = Util.random(game.settings.boardX);
      const newY = Util.random(game.board.currentRows);
      await game.board.removeSymbol(game, newX, newY);
      await game.eventlog.showResourceEarned('🕳️', '', this.emoji());
      await game.board.addSymbol(game, game.catalog.symbol('🕳️'), newX, newY);
      await game.eventlog.showResourceEarned('🪨', '5', this.emoji());
      for (let i = 0; i < 5; i++) await game.board.addSymbol(game, new Rock(), newX, newY);
    }
  }
}

export class Worker extends Symb {
  static emoji = '👷';
  static rarity = 0.45;
  static description =
    'destroys neighboring 🪨 for 💵3<br>50% chance: produce 💎';
  static descriptionLong =
    'this is a worker. it pays 💵3 for each neighboring 🪨 removed. it has a 50% chance to produce 💎 in place of the destroyed 🪨.';
  categories() {
    return [CATEGORY_HUMAN];
  }
  async evaluateConsume(game, x, y) {
    const coords = game.board.nextToSymbol(x, y, Rock.emoji);
    if (coords.length === 0) return;
    for (const coord of coords) {
      const [deleteX, deleteY] = coord;
      await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
      await game.board.removeSymbol(game, deleteX, deleteY);
      await this.bounceScore(game, x, y, 3);
      if (chance(game, 0.5, x, y)) {
        const diamond = new Diamond();
        await game.eventlog.showResourceEarned(diamond.emoji(), '', this.emoji());
        await game.board.addSymbol(game, diamond, deleteX, deleteY);
      }
    }
  }
}
