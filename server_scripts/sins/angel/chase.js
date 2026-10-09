// server/sins/angel/chase.js

/**
 * Safely finds a solid ground coordinate within a radius and teleports the player there.
 * @param {Internal.ServerPlayer} player 
 * @param {number} radius 
 */
function teleportToSafeGround(player, radius) {
    let level = player.level;
    let originX = player.getX();
    let originZ = player.getZ();
    let maxAttempts = 15;

    for (let i = 0; i < maxAttempts; i++) {
        let angle = Math.random() * Math.PI * 2;
        let dist = Math.random() * radius;
        let targetX = Math.round(originX + Math.cos(angle) * dist);
        let targetZ = Math.round(originZ + Math.sin(angle) * dist);

        let targetY = level.getHeight('motion_blocking', targetX, targetZ);

        if (targetY > level.getMinBuildHeight()) {
            let blockAtFeet = level.getBlock(targetX, targetY, targetZ);
            let blockAtHead = level.getBlock(targetX, targetY + 1, targetZ);

            if (blockAtFeet.id === 'minecraft:air' && blockAtHead.id === 'minecraft:air') {
                player.teleportTo(targetX, targetY, targetZ);
                return true;
            }
        }
    }

    let spawn = level.getSharedSpawnPos();
    player.teleportTo(spawn.getX(), spawn.getY(), spawn.getZ());
    return false;
}

// 1. DAMAGE & STATE RESET HANDLER
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingIncomingDamageEvent', event => {
    try {
        let player = event.getEntity();
        if (!player || !player.isPlayer()) return;

        let source = event.getSource();
        if (!source) return;

        let attacker = source.causingEntity;
        let damageTypeString = source.toString() || "";

        let isAngelAttacking = attacker && attacker.type === 'weeping_angels:weeping_angel';
        let isSnappedNeck = damageTypeString.includes("snapped_neck");

        if (isAngelAttacking || isSnappedNeck) {
            let state = SinState.get(player);
            let level = player.level;

            // --- CASE A: Player is the actual targeted prey ---
            if (state && state.trialStage === 'Chased') {
                console.log(`[SINS DEBUG] Player ${player.username} caught by Weeping Angel! Initiating Trial...`);

                // Safely wipe out the persistent NBT tick timer
                player.persistentData.putInt('chaseTicks', 0);

                // Instantly kill all angels assigned to this player
                let playerUUIDStr = player.getUuid().toString();
                let expectedTag = `target_${playerUUIDStr}`;
                
                let targetAngels = level.getEntities().filter(entity => {
                    return entity.type === 'weeping_angels:weeping_angel' && entity.tags && entity.tags.contains(expectedTag);
                });

                targetAngels.forEach(angel => {
                    level.spawnParticles('minecraft:large_smoke', false, angel.getX(), angel.getY() + 1, angel.getZ(), 0, 0, 0, 15, 0.2);
                    angel.discard();
                });

                player.tell(Text.red("Don't blink. Don't even blink. Blink and you're dead."));

                // Trigger full trial transition into the void arena
                if (typeof executeTrialAccept === 'function') {
                    executeTrialAccept(player);
                } else {
                    console.error("[SINS ERROR] executeTrialAccept function not found in scope!");
                }
            } 
            // --- CASE B: Player is innocent / bystander ---
            else {
                event.setCanceled(true);
                player.tell(Text.of("§cDon't obstruct God's design!§r"));
                teleportToSafeGround(player, 400);
            }
        }
    } catch (err) {
        console.error("Error checking Weeping Angel damage: " + err);
    }
});

// 2. SERVER TICK TIMER, EFFECTS LOOP, & ANGEL CLEANUP
ServerEvents.tick(event => {
    let server = event.server;

    // --- TRACK CHASE TIME AND APPLY DEBUFFS ---
    server.players.forEach(player => {
        let state = SinState.get(player);

        if (state && state.trialStage === 'Chased') {
            let currentTicks = player.persistentData.getInt('chaseTicks') || 0;
            currentTicks++;
            player.persistentData.putInt('chaseTicks', currentTicks);

            // Diagnostics window: Output to host console every 50 ticks (2.5 seconds)
            if (currentTicks % 50 === 0) {
                console.log(`[SINS DEBUG] Player ${player.username} has been in chase for ${currentTicks} ticks (${currentTicks / 20}s).`);
            }

            // 5 Seconds (100 Ticks) passed -> Blindness
            if (currentTicks >= 100) {
                player.potionEffects.add('minecraft:blindness', 80, 0, true, false);
            }
            
            // 10 Seconds (200 Ticks) passed -> Darkness
            if (currentTicks >= 200) {
                player.potionEffects.add('minecraft:darkness', 80, 0, true, false);
            }
            
            // 15 Seconds (300 Ticks) passed -> Ars Nouveau Snare
            if (currentTicks >= 300) {
                player.potionEffects.add('ars_nouveau:snared', 80, 0, true, false);
            }
        } else {
            // Instantly clear memory tags if target exits trial status
            if (player.persistentData.getInt('chaseTicks') > 0) {
                console.log(`[SINS DEBUG] Cleaning up and resetting persistent chase ticks for player: ${player.username}`);
                player.persistentData.putInt('chaseTicks', 0);
            }
        }
    });

    // --- REAP ORPHANED ANGELS ACROSS ALL LOADED LEVELS ---
    // ✅ CORRECT: Explicitly iterate over the levels collection
    for (let level of server.getAllLevels()) {
        let allAngels = level.getEntities().filter(entity => entity.type === 'weeping_angels:weeping_angel');
        allAngels.forEach(angel => {
            if (!angel.tags) return;
            let targetTag = angel.tags.find(tag => tag.startsWith('target_'));
            if (targetTag) {
                let uuidString = targetTag.replace('target_', '');
                
                let targetPlayer = server.players.find(p => p.getUuid().toString() === uuidString);
                let shouldDismiss = false;

                if (!targetPlayer) {
                    shouldDismiss = true; 
                } else {
                    let state = SinState.get(targetPlayer);
                    if (!state || state.trialStage !== 'Chased') {
                        shouldDismiss = true; 
                    }
                }

                if (shouldDismiss) {
                    console.log(`[SINS DEBUG] Dismissing orphaned angel associated with target context: ${uuidString}`);
                    level.spawnParticles('minecraft:large_smoke', false, angel.getX(), angel.getY() + 1, angel.getZ(), 0, 0, 0, 15, 0.2);
                    angel.discard();
                }
            }
        });
    }
});