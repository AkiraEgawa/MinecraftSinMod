// server/sins/core/sinCounter.js

/**
 * Modifies a player's sins safely, updates state, and prints formatted feedback.
 * @param {Internal.ServerPlayer} player 
 * @param {number} amount Sins to add (positive) or subtract (negative)
 */
function modifySin(player, amount) {
  if (amount === 0) return;

  let state = SinState.get(player);
  
  // Guard clause: Sins can ONLY be altered while the player is completely Free.
  if (state.trialStage !== 'Free') return;

  let oldSins = state.sins;
  let targetSins = oldSins + amount;

  // Retrieve the global thresholds array dynamically from your SinState API
  let thresholds = SinState.getThresholds();
  
  // Safely grab the threshold for the player's current level
  let currentLevelIndex = Math.max(0, state.level);
  let nextThreshold = thresholds[currentLevelIndex] !== undefined 
    ? thresholds[currentLevelIndex] 
    : thresholds[thresholds.length - 1];

  // Hard Cap Logic: If gaining sin, clamp it so it cannot exceed this level's threshold
  if (amount > 0 && targetSins > nextThreshold) {
    targetSins = nextThreshold;
  }
  
  // Update through SinState to auto-enforce floor mechanics
  SinState.update(player, { sins: targetSins });
  
  // Re-fetch to get the actual post-processed value
  let newState = SinState.get(player);
  let newSins = newState.sins;

  if (oldSins === newSins) return; // No change (e.g., hit hard floor or already capped)

  // Display specific messages
  if (newSins > oldSins) {
    player.tell(Text.red(`Your soul feels heavier... (sin: ${Math.round(newSins)})`));
    
    // Trigger threshold progression check only if they actually reached/crossed it
    checkThresholdTransition(player, newState, newSins);
  } else {
    player.tell(Text.green(`Your soul feels lighter... (sin: ${Math.round(newSins)})`));
  }
}

/**
 * Checks if a player's current sins meet or exceed their current level's threshold.
 */
function checkThresholdTransition(player, state, currentSins) {
    let thresholds = SinState.getThresholds();
    let currentLevelIndex = Math.max(0, state.level);
    let nextThreshold = thresholds[currentLevelIndex] !== undefined 
        ? thresholds[currentLevelIndex] 
        : thresholds[thresholds.length - 1];

    // If they hit the limit and are still 'Free'
    if (currentSins >= nextThreshold && state.trialStage === 'Free') {
        
        // 1. Instantly transition them to 'Pending'
        SinState.update(player, { trialStage: 'Pending' });
        player.tell(Text.of("§6You feel an ominous presence focusing on you... The trial begins soon.§r"));
        
        // Save the player's UUID as a string to match against later
        let playerUUIDStr = player.getUuid().toString();
        let server = player.server;
        
        // 2. Schedule the 'Chased' transition in 10 seconds (200 ticks)
        server.scheduleInTicks(200, callback => {
            // Safe KubeJS lookup: Find the player in the online players list by matching string UUIDs
            let targetPlayer = server.players.find(p => p.getUuid().toString() === playerUUIDStr);
            if (!targetPlayer) return;

            let currentState = SinState.get(targetPlayer);
            
            // Only transition to 'Chased' if they are still in the 'Pending' state
            if (currentState.trialStage === 'Pending') {
                SinState.update(targetPlayer, { trialStage: 'Chased' });
                
                // Play a creepy sound and notify them that they are now prey!
                targetPlayer.playSound('minecraft:entity.wither.spawn', 1.0, 0.5);
                targetPlayer.tell(Text.of("§4Your time is up. THEY ARE HERE. RUN.§r"));
            }
        });
    }
}

// --- EVENT LISTENERS ---
// 1. Killing Villagers and Animals
// server/sins/core/sinCounter.js

EntityEvents.death(event => {
    const victim = event.entity;
    const source = event.source;
    if (!victim || !source) return;

    // Ensure the killer is a player
    if (source.player) {
        const slayer = source.player; 

        // 1. Killing another player (+15 Sins)
        if (victim.isPlayer()) {
            // Self-kill safety check (suicides shouldn't grant PvP sins)
            if (victim.uuid.toString() !== slayer.uuid.toString()) {
                modifySin(slayer, 15);
                slayer.tell(Text.of("§4You have spilled the blood of another traveler. (+15 Sin)§r"));
            }
            
        } 
        // Checks for non-player victims
        else {
            // 2. Killing a Villager (+5 Sins)
            if (victim.type === 'minecraft:villager') {
                modifySin(slayer, 5);
                slayer.tell(Text.of("§cYou struck down an innocent soul. (+5 Sin)§r"));
            } 
            // 3. Killing a passive animal (+1 Sin)
            else if (victim.animal) {
                modifySin(slayer, 1);
                slayer.tell(Text.of("§cYou struck down an innocent animal. (+1 Sin)§r"));
            }
            else if(victim.monster) {
                if (Math.random() < 0.20) {
                    modifySin(slayer, -1);
                    slayer.tell(Text.green("The universe rewards you for cleansing the world. (-1 Sin)"));
                }
            }
        }
    }
});


// 2. Breeding Animals
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.BabyEntitySpawnEvent', event => {
    let parentA = event.getParentA();
    let parentB = event.getParentB();
    let parentCreator = event.getCausedByPlayer(); // Exposes the exact breeding player

    if (parentCreator && parentCreator.isPlayer()) {
        modifySin(parentCreator, -1);
    }
});


// 3. Player Death Penalty
EntityEvents.death(event => {
  const { entity } = event;
  if (entity.isPlayer()) {
    modifySin(entity, -5);
  }
});

// 4. Hero of the Village Effect (Detecting via NeoForge MobEffectEvent.Added)
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.MobEffectEvent$Added', event => {
  let entity = event.getEntity();
  let effectInstance = event.getEffectInstance();
  
  if (entity && entity.isPlayer() && effectInstance) {
    let effectId = effectInstance.getEffect().value().getDescriptionId(); // Translates to minecraft.hero_of_the_village
    if (effectId.includes('hero_of_the_village')) {
      modifySin(entity, -20);
    }
  }
});

// 5. Totem Usage (Triggered via NeoForge native event hook)
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingUseTotemEvent', event => {
  let entity = event.getEntity();
  if (entity && entity.isPlayer()) {
    modifySin(entity, 20);
    entity.tell(Text.of("§4A golden light wraps around you... you cheated death! (+20 Sins)§r"));
  }
});

// 6. Wither Spawning Detection (Using level nearest player lookup)
EntityEvents.spawned('minecraft:wither', event => {
  let wither = event.getEntity();
  let level = event.getLevel();
  
  // Find nearest player within 10 blocks of the wither
  let player = level.getNearestPlayer(wither, 10);

  if (player) {
    level.server.tell(Text.of(`§6[Boss] §fThe Wither was summoned by ${player.getName().getString()}! (+25 Sins)`));
    modifySin(player, 25);
  }
});

// 7. Lootr Chest Robbery Detection (Using explicit ID check and raw Tile NBT)
BlockEvents.rightClicked(event => {
    let blockId = event.block.id;
    
    // Check if the block being clicked is a Lootr container (chest, barrel, shulker, etc.)
    if (blockId.startsWith('lootr:')) {
        let player = event.player;
        let block = event.block;
        
        let tags = block.entity.persistentData;
        let openedPlayersKey = `Sins_LootedBy_${player.uuid.toString()}`;

        // Verify if this player has already robbed this specific chest
        if (!tags.getBoolean(openedPlayersKey)) {
            tags.putBoolean(openedPlayersKey, true);
            block.entity.setChanged(); // Force Minecraft to save the custom tag to the chunk

            // Grant the sin penalty
            modifySin(player, 5);
            player.tell(Text.of("§cYou plundered private belongings! (+5 Sin)§r"));
        }
    }
});