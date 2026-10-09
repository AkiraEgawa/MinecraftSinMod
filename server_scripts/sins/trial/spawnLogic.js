// server/sins/trial/spawnLogic.js

/**
 * Handles boss spawning logic and positioning based on configuration.
 * @param {Internal.ServerPlayer} player 
 * @param {number} bossIndex 
 * @param {{x: number, y: number, z: number}} arenaOrigin 
 */
function spawnTrialBosses(player, bossIndex, arenaOrigin) {
    let level = player.level;
    let playerUUID = player.uuid.toString();
    
    let bossConfig = JsonIO.read('kubejs/config/bosses.json');
    let bosses = (bossConfig && bossConfig.bosses) ? bossConfig.bosses : [];

    // Safe Lookup: Match by boss.id FIRST, then fall back to array index safely
    let bossData = bosses.find(b => Number(b.id) === Number(bossIndex));

    if (!bossData) {
        console.error(`[SINS ERROR] No boss found with ID ${bossIndex}! Check bosses.json IDs.`);
        bossData = bosses[0]; // Emergency fallback only if ID is completely invalid
    }

    // Read custom boss offset and yaw if defined on the specific boss entry
    let bossOffset = (bossData && bossData.bossSpawnOffset) ? bossData.bossSpawnOffset : null;

    // Determine target rotation: check specific boss entry first, fallback to 180 (facing player at Z=0)
    let targetYaw = (bossData && bossData.bossSpawnYaw !== undefined) 
        ? bossData.bossSpawnYaw 
        : 180.0;

    // Fallback entities if config entry is somehow still missing
    let rawEntities = (bossData && bossData.entities) 
        ? bossData.entities 
        : ['minecraft:zombie'];

    // Convert raw entities array into unified object format
    let entitiesToSpawn = [];
    if (Array.isArray(rawEntities)) {
        rawEntities.forEach(entry => {
            if (typeof entry === 'string') {
                entitiesToSpawn.push({ type: entry, count: 1 });
            } else if (typeof entry === 'object' && entry !== null) {
                entitiesToSpawn.push(entry);
            }
        });
    }

    if (entitiesToSpawn.length === 0) {
        entitiesToSpawn = [{ type: 'minecraft:zombie', count: 1 }];
    }

    let totalBossCount = entitiesToSpawn.reduce((sum, g) => sum + (g.count || 1), 0);
    let currentEntityIndex = 0;

    entitiesToSpawn.forEach(group => {
        let count = group.count || 1;
        let entityType = group.type || 'minecraft:zombie';
        let radius = group.radius || 4;

        for (let i = 0; i < count; i++) {
            let spawnX = arenaOrigin.x;
            let spawnY = arenaOrigin.y + 1.5; // Default +1.5 blocks height
            let spawnZ = arenaOrigin.z;

            // If custom bossSpawnOffset is defined, add it to the original baseline
            if (bossOffset) {
                spawnX += (bossOffset.x !== undefined ? bossOffset.x : 0);
                spawnY += (bossOffset.y !== undefined ? bossOffset.y : 0);
                spawnZ += (bossOffset.z !== undefined ? bossOffset.z : 0);
            }

            // Apply positioning behavior (Single vs Multi)
            if (totalBossCount > 1) {
                // Multi-Boss: Circle offset applied relative to anchor position
                let angle = (2 * Math.PI / totalBossCount) * currentEntityIndex;
                spawnX += Math.cos(angle) * radius;
                spawnZ += Math.sin(angle) * radius;
            } else if (!bossOffset) {
                // Single Boss without explicit offset: Default 7 blocks ahead on Z
                let distance = group.radius || 7; 
                spawnZ += distance; 
            }

            // Ensure chunk is loaded
            let chunkX = Math.floor(spawnX) >> 4;
            let chunkZ = Math.floor(spawnZ) >> 4;
            level.getChunk(chunkX, chunkZ);

            let entity = level.createEntity(entityType);
            if (entity) {
                // 1. Position the entity
                entity.setPosition(spawnX, spawnY, spawnZ);

                // 2. Apply yaw rotation directly (same method KubeJS uses for player orientation)
                entity.setYaw(targetYaw);

                // 3. Add tracking tags
                entity.addTag('SinsTrialBoss');
                entity.addTag(`owner_${playerUUID}`);

                // 4. Prevent despawning
                entity.mergeNbt({ PersistenceRequired: 1 });

                // 5. Prevent Zombie daylight burn fallback
                if (entityType === 'minecraft:zombie') {
                    entity.setHeadArmorItem(Item.of('minecraft:netherite_helmet').enchant('minecraft:unbreaking', 1));
                }

                // 6. Merge optional custom NBT from config
                if (group.nbt) {
                    entity.mergeNbt(group.nbt);
                }

                entity.spawn();
                console.log(`[SINS BOSS SPAWN] Spawned ${entityType} at (${spawnX.toFixed(1)}, ${spawnY.toFixed(1)}, ${spawnZ.toFixed(1)}) facing yaw ${targetYaw}`);
            } else {
                console.error(`[SINS ERROR] Failed to instantiate entity type: ${entityType}`);
            }

            currentEntityIndex++;
        }
    });

    // Advance state to Fighting
    SinState.update(player, { trialStage: 'Fighting' });
    player.tell(Text.of("§4The judgment has begun! Eliminate all threats to prevail.§r"));
}