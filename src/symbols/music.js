import { chance, Symb, CATEGORY_UNBUYABLE } from '../symbol.js';
import * as Util from '../util.js';
import { Bug, Cow, CATEGORY_ANIMAL } from './animals.js';
import { Cherry } from './food.js';

// This file organizes symbols related to music
// Most of them interact with MusicalNote (🎵) in some way

export class MusicalNote extends Symb {
  static emoji = '🎵';
  static rarity = 0;
  static description = '💵4<br>disappears after 3 turns';
  static descriptionLong =
    'this is a musical note. it pays 💵4, and disappears after 3 turns';
  async score(game, x, y) {
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
    await this.addMoney(game, 4, x, y);
  }
  async evaluateConsume(game, x, y) {
    if (this.turns >= 3) {
      await game.board.removeSymbol(game, x, y);
    }
  }
  counter(_) {
    return 3 - this.turns;
  }
  categories() {
    return [CATEGORY_UNBUYABLE];
  }
}

export class Bell extends Symb {
  static emoji = '🔔';
  static rarity = 0.3;
  static description = '💵9<br>20% or next to 🐮: makes 🎵';
  static descriptionLong =
    'this is a bell. it pays 💵9. it creates 🎵 on a neighboring empty space if it is next to 🐮, or otherwise with a 20% chance.';
  async score(game, x, y) {
    await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
    await this.addMoney(game, 9, x, y);
  }
  async evaluateProduce(game, x, y) {
    const coords = game.board.nextToEmpty(x, y);
    if (coords.length === 0) {
      return;
    }
    const nextToCow = game.board.nextToSymbol(x, y, Cow.emoji).length > 0;
    if (!nextToCow && !chance(game, 0.2, x, y)) {
      return;
    }
    const note = new MusicalNote();
    const [newX, newY] = Util.randomChoose(coords);
    await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
    await game.eventlog.showResourceEarned(note.emoji(), '', this.emoji());
    await game.board.addSymbol(game, note, newX, newY);
  }
}

// export class Dancer extends Symb {
//   static emoji = '💃';
//   constructor() {
//     super();
//     this.rarity = 0.3;
//     this.musicScore = 0;
//   }
//   copy() {
//     return new Dancer();
//   }
//   async score(game, x, y) {
//     const coords = game.board.nextToSymbol(x, y, MusicalNote.emoji);
//     if (coords.length === 0) {
//       return;
//     }
//     await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
//     await this.addMoney(game, coords.length * 10, x, y);
//   }
//   description() {
//     return '💵10 for each neighboring 🎵';
//   }
//   descriptionLong() {
//     return "this is a dancer. it pays 💵10 for each 🎵 it's standing next to.";
//   }
// }

export class Drums extends Symb {
  static emoji = '🥁';
  static rarity = 0.35;
  static description = 'every 3 turns: makes 🎵';
  static descriptionLong = 'these are drums. every third turn, they create 🎵 on a nearby empty space.';
  async evaluateProduce(game, x, y) {
    if (this.turns % 3 === 0) {
      const coords = game.board.nextToEmpty(x, y);
      if (coords.length === 0) return;
      const [newX, newY] = Util.randomChoose(coords);
      await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
      const note = new MusicalNote();
      await game.eventlog.showResourceEarned(note.emoji(), '', this.emoji());
      await game.board.addSymbol(game, note, newX, newY);
    }
  }
  counter(_) {
    return 3 - (this.turns % 3);
  }
  categories() {
    return [CATEGORY_UNBUYABLE];
  }
}

export class Songbird extends Symb {
  static emoji = '🦜';
  static rarity = 0.2;
  static description = '💵2<br>eats 🍒 for x2<br>next to 🎵 or 🦜: makes 🎵<br>leaves after 3 turns with no food';
  static descriptionLong = 'this is a songbird. it pays 💵2 and eats 🍒 for x2 pay. it creates 🎵 when next to 🎵 or 🦜. it disappears after 3 turns with no food.';
  constructor() {
    super();
    this.eatenScore = 2;
  }
  categories() {
    return [CATEGORY_ANIMAL, CATEGORY_UNBUYABLE];
  }
  async spawnNote(game, x, y) {
    const coords = game.board.nextToEmpty(x, y);
    if (coords.length === 0) return;
    const [newX, newY] = Util.randomChoose(coords);
    await Util.animate(game.board.getSymbolDiv(x, y), 'grow', 0.15);
    await game.eventlog.showResourceEarned(MusicalNote.emoji, '', this.emoji());
    await game.board.addSymbol(game, new MusicalNote(), newX, newY);
  }
  async score(game, x, y) {
    await this.bounceScore(game, x, y, this.eatenScore);
    this.eatenScore = 2;
  }
  async evaluateConsume(game, x, y) {
    for (const [cx, cy] of game.board.nextToSymbol(x, y, Cherry.emoji)) {
      await game.eventlog.showResourceLost(game.board.getEmoji(cx, cy), '', this.emoji());
      await game.board.removeSymbol(game, cx, cy);
      this.eatenScore *= 2;
      this.turns = 0;
      game.board.redrawCell(game, x, y);
    }
    if (this.turns >= 3) {
      await game.board.removeSymbol(game, x, y);
    }
  }
  async evaluateProduce(game, x, y) {
    if (game.board.nextToSymbol(x, y, Songbird.emoji).length > 0 || game.board.nextToSymbol(x, y, MusicalNote.emoji).length > 0) {
      await this.spawnNote(game, x, y);
    }
  }
  counter(_) {
    return Math.max(0, 3 - this.turns);
  }
}

export class Record extends Symb {
  static emoji = '📀';
  static rarity = 0.12;
  static description = 'records neighboring 🎵<br>💵6 for each 🎵 recorded';
  static descriptionLong =
    'this is a record. it removes neighboring 🎵 and permanently pays 💵6 more for each 🎵 removed.';
  constructor(notes = 0) {
    super();
    this.notes = notes;
  }
  copy() {
    return new Record(this.notes);
  }
  async score(game, x, y) {
    if (this.notes > 0) {
      await Util.animate(game.board.getSymbolDiv(x, y), 'bounce', 0.15);
      await this.addMoney(game, this.notes, x, y);
    }
  }
  async evaluateConsume(game, x, y) {
    const coords = game.board.nextToSymbol(x, y, MusicalNote.emoji);
    if (coords.length === 0) {
      return;
    }
    for (const coord of coords) {
      this.notes += 6;
      game.board.redrawCell(game, x, y);
      const [deleteX, deleteY] = coord;
      await game.eventlog.showResourceLost(game.board.getEmoji(deleteX, deleteY), '', this.emoji());
      await game.board.removeSymbol(game, deleteX, deleteY);
    }
  }
  counter(_) {
    return this.notes;
  }
}
