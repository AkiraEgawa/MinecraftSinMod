// server/sins/trial/monitor.js

ServerEvents.tick(event => {
    let server = event.server;
    // Check active players every 10 ticks to reduce overhead
    if (server.tickCount % 10 !== 0) return;

    let arenaLevel = server.getLevel('kubejs:void_arena');
    if (!arenaLevel) return;

    server.players.forEach(player => {
        let state = SinState.get(player);

        // Only monitor players currently in the 'Fighting' stage
        if (state.trialStage === 'Fighting') {
            let playerUUID = player.uuid.toString();
            
            // Search for surviving bosses tagged with this player's UUID
            let bossList = arenaLevel.getEntities().filter(e => 
                e.tags.contains('SinsTrialBoss') && e.tags.contains(`owner_${playerUUID}`) && e.isAlive()
            );

            // Victory condition: All bosses defeated
            if (bossList.length === 0) {
                triggerTrialVictory(player);
            }
        }
    });
});

// Handle Player Death inside the Trial Arena
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity || !entity.isPlayer()) return;

    let player = entity;
    let state = SinState.get(player);

    // If player dies during any arena stage
    if (player.level.dimension.toString() === 'kubejs:void_arena' || ['Starting', 'Fighting'].includes(state.trialStage)) {
        player.tell(Text.of("§cYou were consumed by your sins. The trial resets...§r"));

        // Reset sins to current level base floor
        let thresholds = SinState.getThresholds();
        let currentLevel = Math.max(0, state.level);
        let baseSinFloor = currentLevel > 0 ? thresholds[currentLevel - 1] : 0;

        SinState.update(player, { 
            sins: baseSinFloor, 
            trialStage: 'Free' 
        });

        // Resolve instance ID for clearing
        let server = player.server;
        let persistentData = server.persistentData;
        let activeArenas = persistentData.getCompound('SinsActiveArenas');
        let playerUUID = player.uuid.toString();

        let instanceId = 1;
        if (activeArenas && activeArenas.contains(playerUUID)) {
            instanceId = activeArenas.getInt(playerUUID);
            activeArenas.remove(playerUUID);
            persistentData.put('SinsActiveArenas', activeArenas);
        }

        // Fetch arena level and clean up
        let arenaLevel = server.getLevel('kubejs:void_arena');
        clearArenaInstance(arenaLevel, instanceId);

        // Respawn/Teleport safety: return to prevLoc
        if (state.prevLoc) {
            player.teleportTo(
                state.prevLoc.dim,
                state.prevLoc.x,
                state.prevLoc.y,
                state.prevLoc.z,
                0, 0
            );
        }
    }
});