// server/sins/doppel/gear.js

// server/sins/doppel/gear.js

const DoppelGear = {
    countTotems(player) {
        let totemCount = 0;
        let checkStack = (itemStack) => {
            if (!itemStack || itemStack.isEmpty()) return;
            if (itemStack.id === 'minecraft:totem_of_undying') {
                totemCount += itemStack.count;
            } else if (itemStack.id.includes('backpack')) {
                let nbt = itemStack.nbt;
                if (nbt && nbt.contains('inventory')) {
                    let nbtString = nbt.toString();
                    let matches = nbtString.match(/minecraft:totem_of_undying/g);
                    if (matches) totemCount += matches.length;
                }
            }
        };

        player.inventory.items.forEach(checkStack);
        player.inventory.offhand.forEach(checkStack);

        return totemCount;
    },

    snapshotPlayer(player) {
        let mainHand = player.mainHandItem;
        let offHand = player.offHandItem;

        let primarySword = (mainHand && !mainHand.isEmpty()) ? mainHand : Item.of('minecraft:iron_sword');
        let primaryBow = Item.of('minecraft:bow');

        // Scan inventory for best weapon alternatives if mainhand is empty
        player.inventory.items.forEach(item => {
            if (!item || item.isEmpty()) return;
            if (item.id.includes('sword') || item.id.includes('axe')) primarySword = item;
            if (item.id.includes('bow') || item.id.includes('crossbow')) primaryBow = item;
        });

        return {
            head: player.getHeadArmorItem(),
            chest: player.getChestArmorItem(),
            legs: player.getLegsArmorItem(),
            feet: player.getFeetArmorItem(),
            mainHand: mainHand,
            offHand: offHand,
            primarySword: primarySword,
            primaryBow: primaryBow,
            totems: this.countTotems(player)
        };
    }
};

// --- Combat Stance & Artificial Totem Trigger Listener ---

// 1. Intercept lethal damage on Doppelganger to consume a Totem
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent', event => {
    let entity = event.entity;
    if (!entity || !entity.tags.contains('SinsDoppelganger')) return;

    let currentHealth = entity.health;
    let damage = event.amount;

    if (damage >= currentHealth) {
        let totemsLeft = entity.persistentData.getInt('doppelTotems') || 0;

        if (totemsLeft > 0) {
            event.setCanceled(true); // Prevent death
            entity.health = 1.0;

            // Trigger Totem visual & audio effects across dimension
            let level = entity.level;
            level.runCommandSilent(`particle minecraft:totem_of_undying ${entity.x} ${entity.y + 1} ${entity.z} 0.5 0.5 0.5 0.1 100 force`);
            level.runCommandSilent(`playsound minecraft:item.totem.use master @a ${entity.x} ${entity.y} ${entity.z} 1.0 1.0`);

            // Apply Totem status effects
            entity.potionEffects.add('minecraft:regeneration', 900, 1);
            entity.potionEffects.add('minecraft:fire_resistance', 800, 0);
            entity.potionEffects.add('minecraft:absorption', 100, 1);

            // Decrement stored totem count
            entity.persistentData.putInt('doppelTotems', totemsLeft - 1);
            console.log(`[SINS DOPPEL] Totem popped! Remaining totems: ${totemsLeft - 1}`);
        }
    }
});

// 2. Tick event to handle weapon swapping based on distance to player
ServerEvents.tick(event => {
    if (event.server.tickCount % 10 !== 0) return; // Check twice per second

    // Use event.server.getAllLevels() instead of event.server.levels
    event.server.getAllLevels().forEach(level => {
        if (level.dimension.toString() !== 'kubejs:void_arena') return;

        level.getEntities().filter(e => e.tags.contains('SinsDoppelganger')).forEach(doppel => {
            let ownerUUID = doppel.persistentData.getString('ownerUUID');
            if (!ownerUUID) return;

            let player = level.players.find(p => p.uuid.toString() === ownerUUID);
            if (!player) return;

            let distSq = doppel.distanceToSqr(player);
            let currentMain = doppel.mainHandItem.id;

            let swordId = doppel.persistentData.getString('swordId') || 'minecraft:diamond_sword';
            let bowId = doppel.persistentData.getString('bowId') || 'minecraft:bow';

            // Swap weapon based on 12-block threshold (144 distance squared)
            if (distSq > 144 && currentMain !== bowId) {
                doppel.setMainHandItem(Item.of(bowId));
            } else if (distSq <= 144 && currentMain !== swordId) {
                doppel.setMainHandItem(Item.of(swordId));
            }
        });
    });
});