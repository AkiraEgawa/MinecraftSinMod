// server/sins/trial/arena.js

const ARENA_SPACING = 1000;
const ARENA_Y = 64;

/**
 * Builds a fallback floor so players don't fall into the void when NBT structures are missing.
 */
function buildFallbackPlatform(level, originX, originY, originZ) {
    let radius = 7; // 15x15 square
    console.log(`[SINS LOG] [PRE-FALLBACK] Building 15x15 bedrock fallback platform centered at (${originX}, ${originY - 1}, ${originZ})`);

    let blocksPlaced = 0;
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            let block = level.getBlock(originX + x, originY - 1, originZ + z);
            block.set('minecraft:bedrock');
            blocksPlaced++;
        }
    }
    console.log(`[SINS LOG] [POST-FALLBACK] Placed ${blocksPlaced} bedrock blocks for fallback floor.`);
}

/**
 * Allocates instance ID and prepares structure placement data.
 */
function allocateAndBuildArena(player, bossIndex) {
    let server = player.server;
    let persistentData = server.persistentData;
    let activeArenas = persistentData.getCompound('SinsActiveArenas');
    let playerUUID = player.uuid.toString();

    console.log(`[SINS LOG] [PRE-ALLOCATE] Allocating arena instance for player ${player.username} (UUID: ${playerUUID}) for boss index ${bossIndex}...`);

    // 1. Determine or allocate Instance ID
    let instanceId;
    if (activeArenas.contains(playerUUID)) {
        instanceId = activeArenas.getInt(playerUUID);
        console.log(`[SINS LOG] [ALLOCATE] Player already assigned existing Instance #${instanceId}`);
    } else {
        let usedSlots = new Set();
        activeArenas.allKeys.forEach(k => usedSlots.add(activeArenas.getInt(k)));
        instanceId = 1;
        while (usedSlots.has(instanceId)) {
            instanceId++;
        }
        activeArenas.putInt(playerUUID, instanceId);
        persistentData.put('SinsActiveArenas', activeArenas);
        console.log(`[SINS LOG] [ALLOCATE] Assigned NEW Instance #${instanceId} to ${player.username}`);
    }

    let originX = instanceId * ARENA_SPACING;
    let arenaLevel = server.getLevel('kubejs:void_arena');

    // 2. Fetch structure configuration from config/bosses.json
    let structureName = "sins:libraryarena"; 
    let spawnOffset = { x: 0.5, y: 2.0, z: 0.5 };
    let spawnYaw = 0;

    console.log(`[SINS LOG] [PRE-CONFIG] Reading boss configuration for index ${bossIndex}...`);
    try {
        let bossConfig = JsonIO.read('kubejs/config/bosses.json');
        if (bossConfig && bossConfig.bosses) {
            // Search by boss.id FIRST (1-based ID matching)
            let bossData = bossConfig.bosses.find(b => Number(b.id) === Number(bossIndex));

            // Fallback to array index if id isn't explicitly defined
            if (!bossData && bossIndex > 0 && bossIndex <= bossConfig.bosses.length) {
                bossData = bossConfig.bosses[bossIndex - 1];
            }
            if (bossData) {
                if (bossData.structure) structureName = bossData.structure;
                if (bossData.playerSpawnOffset) spawnOffset = bossData.playerSpawnOffset;
                if (bossData.spawnYaw !== undefined) spawnYaw = bossData.spawnYaw;
                console.log(`[SINS LOG] [CONFIG READ] Config loaded: structure='${structureName}', offset=(${spawnOffset.x}, ${spawnOffset.y}, ${spawnOffset.z})`);
            } else {
                console.warn(`[SINS LOG] [CONFIG WARN] Boss data at index ${bossIndex} not found. Falling back to default: '${structureName}'`);
            }
        }
    } catch (e) {
        console.error(`[SINS LOG] [CONFIG ERROR] Error reading bosses.json for index ${bossIndex}: ${e}`);
    }

    if (arenaLevel) {
        console.log(`[SINS LOG] [PRE-PLATFORM] Invoking fallback bedrock platform generator...`);
        buildFallbackPlatform(arenaLevel, originX, ARENA_Y, 0);
    } else {
        console.error(`[SINS LOG] [CRITICAL ERROR] Dimension 'kubejs:void_arena' could NOT be resolved!`);
    }

    return {
        spawnLoc: {
            x: originX + spawnOffset.x,
            y: ARENA_Y + spawnOffset.y,
            z: spawnOffset.z
        },
        instanceId: instanceId,
        structureName: structureName,
        originX: originX,
        spawnYaw: spawnYaw
    };
}

/**
 * Global helper to accept and transition a player into their trial.
 */
function executeTrialAccept(player) {
    let state = SinState.get(player);

    console.log(`[SINS LOG] [PRE-TRIAL ACCEPT] Initiating trial accept for ${player.username}. Current state: ${JSON.stringify(state)}`);

    // 1. Save previous location before warp
    let savedLoc = {
        x: player.x,
        y: player.y,
        z: player.z,
        dim: player.level.dimension.toString()
    };
    console.log(`[SINS LOG] [PRE-STATE UPDATE] Saving return location for ${player.username}: (${savedLoc.x.toFixed(2)}, ${savedLoc.y.toFixed(2)}, ${savedLoc.z.toFixed(2)}) in ${savedLoc.dim}`);

    SinState.update(player, {
        trialStage: 'Starting',
        prevLoc: savedLoc
    });

    // 2. Clear chase timers and discard active angels
    console.log(`[SINS LOG] [PRE-CLEANUP] Discarding active chasing angels targeting ${player.username}...`);
    player.persistentData.putInt('chaseTicks', 0);
    let discardedCount = 0;
    player.level.getEntities()
        .filter(e => e.tags && e.tags.contains(`target_${player.uuid.toString()}`))
        .forEach(a => {
            a.discard();
            discardedCount++;
        });
    console.log(`[SINS LOG] [POST-CLEANUP] Discarded ${discardedCount} angel entities.`);

    // 3. Allocate arena & bedrock platform
    let targetBossId = state.level + 1;
    let arena = allocateAndBuildArena(player, targetBossId);
    let arenaLevel = player.server.getLevel('kubejs:void_arena');

    // 4. TELEPORT FIRST — Forces Minecraft to load the chunk at originX
    console.log(`[SINS LOG] [PRE-TELEPORT] Teleporting ${player.username} to 'kubejs:void_arena' at (${arena.spawnLoc.x}, ${arena.spawnLoc.y}, ${arena.spawnLoc.z})...`);
    player.teleportTo('kubejs:void_arena', arena.spawnLoc.x, arena.spawnLoc.y, arena.spawnLoc.z, arena.spawnYaw, 0);

    console.log(`[SINS LOG] [PRE-EFFECT] Applying 1s blindness screen transition effect...`);
    player.runCommandSilent('effect give @s minecraft:blindness 1 1 true');

    // 5. Place template 3 ticks LATER while player is present in dimension
    console.log(`[SINS LOG] [PRE-SCHEDULE] Scheduling template placement in 3 ticks...`);
    player.server.scheduleInTicks(3, () => {
        let cornerX = arena.originX - 19;
        let cornerY = ARENA_Y;
        let cornerZ = -19;

        console.log(`[SINS LOG] [PRE-PLACE] Executing '/place template ${arena.structureName}' at calculated corner (${cornerX}, ${cornerY}, ${cornerZ}) for Instance #${arena.instanceId}...`);

        let cmdResult = arenaLevel.runCommandSilent(`place template ${arena.structureName} ${cornerX} ${cornerY} ${cornerZ} none none 1.0`);
        
        console.log(`[SINS LOG] [POST-PLACE] Command execution finished with status code: ${cmdResult}`);

        // 6. Spawn bosses after structure materializes
        console.log(`[SINS LOG] [PRE-BOSS SPAWN] Scheduling boss entity spawning in 2 ticks...`);
        player.server.scheduleInTicks(2, () => {
            console.log(`[SINS LOG] [EXEC-BOSS SPAWN] Invoking spawnTrialBosses at (${arena.spawnLoc.x}, ${arena.spawnLoc.y}, ${arena.spawnLoc.z})...`);
            spawnTrialBosses(player, targetBossId, arena.spawnLoc);
        });
    });
}

/**
 * Direct KubeJS block clearing — completely bypasses vanilla /fill commands.
 */
function clearArenaInstance(level, instanceId) {
    if (!level) {
        console.error(`[SINS LOG] [CRITICAL ERROR] Cannot clear arena: 'kubejs:void_arena' level is null!`);
        return;
    }

    let spacing = typeof ARENA_SPACING !== 'undefined' ? ARENA_SPACING : 1000;
    let arenaY = typeof ARENA_Y !== 'undefined' ? ARENA_Y : 64;

    let validInstance = (typeof instanceId === 'number' && instanceId > 0) ? instanceId : 1;
    let originX = validInstance * spacing;

    let minX = originX - 100;
    let maxX = originX + 100;
    let minY = arenaY - 10;
    let maxY = arenaY + 100;
    let minZ = -100;
    let maxZ = 100;

    console.log(`[SINS LOG] [PRE-NATIVE CLEAR] Preparing to wipe blocks in Instance #${validInstance} across bounding box: (${minX}, ${minY}, ${minZ}) -> (${maxX}, ${maxY}, ${maxZ})`);

    let blocksRemoved = 0;

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            for (let z = minZ; z <= maxZ; z++) {
                let block = level.getBlock(x, y, z);
                if (block.id !== 'minecraft:air') {
                    block.set('minecraft:air');
                    blocksRemoved++;
                }
            }
        }
    }

    console.log(`[SINS LOG] [POST-NATIVE CLEAR] Successfully wiped ${blocksRemoved} non-air blocks in Instance #${validInstance}`);

    console.log(`[SINS LOG] [PRE-ENTITY CLEAR] Clearing leftover non-player entities in Instance #${validInstance}...`);
    let entitiesDiscarded = 0;
    level.getEntities()
        .filter(e => !e.isPlayer() && Math.abs(e.x - originX) <= 50 && Math.abs(e.z) <= 50)
        .forEach(e => {
            e.discard();
            entitiesDiscarded++;
        });
    console.log(`[SINS LOG] [POST-ENTITY CLEAR] Discarded ${entitiesDiscarded} entities.`);
}

/**
 * Returns a player from their void arena back to their previous dimension & location.
 */
function executeTrialReturn(player) {
    let state = SinState.get(player);

    console.log(`[SINS LOG] [PRE-TRIAL RETURN] Return requested for ${player.username}. Current stage: ${state.trialStage}`);

    if (state.trialStage !== 'Victory') {
        console.warn(`[SINS LOG] [RETURN BLOCKED] Player ${player.username} attempted return without 'Victory' stage!`);
        player.tell(Text.of("§cYou cannot leave the trial until victory is achieved!§r"));
        return false;
    }

    let server = player.server;
    let persistentData = server.persistentData;
    let activeArenas = persistentData.getCompound('SinsActiveArenas');
    let playerUUID = player.uuid.toString();

    let instanceId = 1;
    if (activeArenas && activeArenas.contains(playerUUID)) {
        instanceId = activeArenas.getInt(playerUUID);
    } else if (state.instanceId) {
        instanceId = state.instanceId;
    }

    console.log(`[SINS LOG] [PRE-RETURN CLEAR] Pre-clearing arena for ${player.username} (Instance ID: ${instanceId})`);

    let arenaLevel = server.getLevel('kubejs:void_arena');
    clearArenaInstance(arenaLevel, instanceId);

    if (activeArenas && activeArenas.contains(playerUUID)) {
        console.log(`[SINS LOG] [STATE UPDATE] Removing instance tracking for ${playerUUID}`);
        activeArenas.remove(playerUUID);
        persistentData.put('SinsActiveArenas', activeArenas);
    }

    let prev = state.prevLoc || { x: 0, y: 70, z: 0, dim: 'minecraft:overworld' };
    console.log(`[SINS LOG] [PRE-TELEPORT RETURN] Teleporting ${player.username} back to ${prev.dim} at (${prev.x.toFixed(2)}, ${prev.y.toFixed(2)}, ${prev.z.toFixed(2)})`);
    player.teleportTo(prev.dim, prev.x, prev.y, prev.z, player.yaw, player.pitch);

    SinState.update(player, { 
        trialStage: 'Free',
        prevLoc: null,
        instanceId: null
    });

    console.log(`[SINS LOG] [POST-TRIAL RETURN] Trial reset complete for ${player.username}.`);
    player.tell(Text.of("§aYou have returned safely from the judgment.§r"));
    return true;
}