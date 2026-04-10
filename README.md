# Emoji Slot Machine Game
Slot machine game using emojis, https://unicode.fun/

**Play this fork:** https://babakoban.github.io/emoji/

## Discord
https://discord.com/invite/wyCDHsuk


# Changelog (fork of balidani/emoji)
Not fully balanced, just messing around with some ideas.
Design goal for changes: Add more interactions between different item categories and build types.

### New Items

| Item | Description |
|------|-------------|
| Crop 🌱 | Unbuyable. Pays 1, grows into 🌽 in 3 turns. Grows instantly if below 🌧️ |
| Cow 🐮 | Pays 12. 35% chance to produce 🥛 nearby. Eats 🌽 and 🌱. Leaves after 5 turns with no food |
| Milk 🥛 | Pays 10. Merges with nearby 🥛 into 🧀 (10% chance: 🧈 instead). Spoils after 4 turns |
| Cheese 🧀 | Pays 15. x2 per neighboring 🍹, x4 per neighboring 🍾 |
| Chocolate 🍫 | Pays 20 |
| Batter 🥣 | Unbuyable. Removes 🍫 to become 🍪, or removes 🍀 to become 🥠 |
| Cookie 🍪 | Pays 30. x3 per neighboring 🥛 |
| Mouse 🐭 | Pays -1. Digs 🕳️ if none nearby. Eats 🍿, 🧀, and 🌱. Spawns 🐭 when it eats 🧀 |
| Farmer 🧑‍🌾 | 50% chance to plant 🌱 in each neighboring 🕳️ |
| Songbird 🦜 | Pays 2. Eats 🍒 for x2. Makes 🎵 if next to 🦜 or 🎵. Leaves after 3 turns with no food (Unbuyable, needs work) |
| Poison ☠️ | Costs 50. Removes all neighboring animals and people, then disappears |

### Changes to Existing Items

| Item | Change |
|------|--------|
| Butter 🧈 | Consumes nearby 🥚 and becomes 🥣 |
| Cloud ☁️ | 20% chance each turn to be 🌧️, which boosts growth of plants below it in the same column |
| Corn 🌽 | Pop is guaranteed if below 🌧️ |
| Tree 🌳 | Triggers instant growth cycle if below 🌧️ |
| Fox 🦊 | Also eats 🐭 for x2 pay |
| Bell 🔔 | Always makes 🎵 if next to 🐮 (More cowbell?) |
| Drums 🥁 | Made unbuyable (Just personally dislike this item 😆) |
| Lootbox 🎁 | 20% chance to give 🍫 instead of a random item |
| Santa 🎅 | Also eats 🥛 and 🍪 to increase payout (per Santa, not global) |
| Moon 🌝 | Produces 🧀 on nearby empty spaces when below 🐮 in the same column (Cow jumped over the moon?) |
| Sewing Kit 🧵 | Now pays out: 4 (×2 for each 🕳️ removed this turn) |
| Pin 📌 | Using on 🎈 or 🫧 pops it instead of pinning it |

---

### VS Code
- Install Live Server extension, https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer
- CMD + L, CMD + O to open browser to http://127.0.0.1:5500/
