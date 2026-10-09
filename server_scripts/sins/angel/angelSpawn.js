// server/sins/angel/angelSpawn.js

// Keep track of ticks globally on the server. 300 ticks = 15 seconds.
let spawnTimer = 0;

ServerEvents.tick(event => {
    let server = event.server;
    
    // Get the overworld instance safely from the server
    let overworld = server.getLevel('minecraft:overworld');
    if (!overworld) return;

    // 1. Spawning Tick Loop (Runs exactly once per server tick)
    spawnTimer++;
    if (spawnTimer >= 300) {
        spawnTimer = 0; 
        
        let chasedPlayers = server.players.filter(player => {
            let state = SinState.get(player);
            return state && state.trialStage === 'Chased';
        });

        chasedPlayers.forEach(player => {
            spawnAngel(player);
        });
    }

    // 2. Escape Prevention / Teleport Loop
    let players = server.players;
    
    // Gather all Weeping Angels currently loaded in the overworld
    let overworldAngels = overworld.getEntities().filter(entity => entity.type === 'weeping_angels:weeping_angel');
    
    players.forEach(player => {
        // Ensure we are only tracking distance checks for players currently inside the overworld
        if (player.level.dimension.toString() !== 'minecraft:overworld') return;

        let expectedTag = `target_${player.getUuid().toString()}`;
        let assignedAngels = overworldAngels.filter(angel => angel.tags && angel.tags.contains(expectedTag));

        assignedAngels.forEach(angel => {
            let dx = angel.getX() - player.getX();
            let dy = angel.getY() - player.getY();
            let dz = angel.getZ() - player.getZ();
            let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (dist > 25) {
                relocateAngel(angel, player);
            }
        });
    });
});

/**
 * Spawns a new Weeping Angel in a safe donut location around the target player.
 */
function spawnAngel(player) {
    let level = player.level;
    let pos = findSafeDonutPosition(player);
    
    if (pos) {
        let angel = level.createEntity('weeping_angels:weeping_angel');
        if (angel) {
            angel.setPosition(pos.x, pos.y, pos.z);
            angel.setTarget(player);
            
            angel.addTag(`target_${player.getUuid().toString()}`);
            angel.spawn();
            
            // Spawning FX
            level.spawnParticles('minecraft:smoke', false, pos.x, pos.y + 1, pos.z, 0, 0, 0, 10, 0.5);
            player.playSound('minecraft:entity.enderman.teleport', 0.6, 0.5);
        }
    }
}

/**
 * Teleports an existing angel that was outrun back into the player's 8-15 block donut zone.
 */
function relocateAngel(angel, player) {
    let level = player.level;
    let pos = findSafeDonutPosition(player);

    if (pos) {
        level.spawnParticles('minecraft:large_smoke', false, angel.getX(), angel.getY() + 1, angel.getZ(), 0, 0, 0, 8, 0.2);
        
        angel.setPosition(pos.x, pos.y, pos.z);
        angel.setTarget(player);
        
        level.spawnParticles('minecraft:smoke', false, pos.x, pos.y + 1, pos.z, 0, 0, 0, 10, 0.5);
        player.playSound('minecraft:entity.enderman.teleport', 0.5, 0.4); 
    }
}

/**
 * Finds a valid coordinate set in a donut shape (8-15 blocks away) around the player.
 * @returns {{x: number, y: number, z: number} | null}
 */
function findSafeDonutPosition(player) {
    let level = player.level;
    let originX = player.getX();
    let originY = player.getY();
    let originZ = player.getZ();
    let maxAttempts = 10;

    for (let i = 0; i < maxAttempts; i++) {
        let angle = Math.random() * Math.PI * 2;
        let distance = 8 + (Math.random() * 7); 
        
        let targetX = originX + Math.cos(angle) * distance;
        let targetZ = originZ + Math.sin(angle) * distance;
        
        for (let yOffset = 4; yOffset >= -4; yOffset--) {
            let checkY = Math.floor(originY + yOffset);
            let blockBelow = level.getBlock(Math.floor(targetX), checkY - 1, Math.floor(targetZ));
            let blockFeet = level.getBlock(Math.floor(targetX), checkY, Math.floor(targetZ));
            let blockHead = level.getBlock(Math.floor(targetX), checkY + 1, Math.floor(targetZ));

            let hasSolidGround = blockBelow.id !== 'minecraft:air' && 
                                 blockBelow.id !== 'minecraft:water' && 
                                 blockBelow.id !== 'minecraft:lava';
            
            let isFeetClear = blockFeet.id === 'minecraft:air';
            let isHeadClear = blockHead.id === 'minecraft:air';

            if (hasSolidGround && isFeetClear && isHeadClear) {
                return { x: targetX, y: checkY, z: targetZ };
            }
        }
    }
    return null;
}