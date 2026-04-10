import * as Util from '../util.js';

import {
  Symb
} from '../symbol.js';

export const CATEGORY_TOOL = Symbol('Tool');

const onToolBuy = async (game, prompt, effect) => {
  if (game.inventory.symbols.length === 0) {
    return;
  }
  game.shop.hide();
  game.board.removeClickListener();
  Util.drawText(game.info, prompt, false);
  // Make game.info click through
  game.info.style.pointerEvents = 'none';
  const coord = await game.board.getClickCoord((sym) => sym.emoji() !== '⬜');
  game.info.style.pointerEvents = 'auto';
  game.info.classList.add('hidden');
  if (!coord) {
    return;
  }
  const [x, y] = coord;
  await effect(game, x, y);
  game.board.addClickListener(game);
  game.shop.show();
}

export class Pin extends Symb {
  static emoji = '📌';
  static rarity = 0.08;
  static description = 'pins a cell in place<br>pops 🎈 and 🫧';
  static descriptionLong = "this is a tool. it allows pinning a symbol in place. if you click a 🎈 or 🫧, it pops instead. it doesn't appear on the board as a symbol.";
  categories() {
    return [CATEGORY_TOOL];
  }
  async onBuy(game) {
    await onToolBuy(game, 'click on a symbol to pin in place', async (game, x, y) => {
      if (game.board.cells[y][x].emoji() === '🎈' || game.board.cells[y][x].emoji() === '🫧') {
        await game.board.removeSymbol(game, x, y);
      } else {
        await game.board.pinCell(game, x, y);
      }
    });
  }
}

export class Axe extends Symb {
  static emoji = '🪓';
  static rarity = 0.07;
  static description = 'removes a cell from inventory';
  static descriptionLong = 'this is a tool. it allows removing a symbol from the inventory. it doesn\'t appear on the board as a symbol.';
  categories() {
    return [CATEGORY_TOOL];
  }
  async onBuy(game) {
    await onToolBuy(game, 'click on a symbol to remove', async (game, x, y) => {
      await game.board.removeSymbol(game, x, y);
    });
  }
}

export class Eye extends Symb {
  static emoji = '🧿';
  static rarity = 0.06;
  static description = 'converts a symbol into a passive ability';
  static descriptionLong = 'this is a tool. it converts a symbol into a passive ability. this doesn\'t appear on the board as a symbol. passive symbols don\'t have neighbors.';
  categories() {
    return [CATEGORY_TOOL];
  }
  async onBuy(game) {
    await onToolBuy(game, 'click on a symbol to convert', async (game, x, y) => {
      await game.board.makePassive(game, x, y);
    });
  }
}
