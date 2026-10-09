// server/sins/core/player.js

// Hardcoded thresholds. Level corresponds to index.
// Level 0 -> Target is 100 (Index 0). After beating, Level becomes 1 -> Target is 300 (Index 1).
const SIN_THRESHOLDS = [100, 300, 500, 800, 1200, 1700, 2300, 3000, 3800, 4700, 5700, 6800, 8000, 9300];

const SinState = {
  /**
   * Retrieves the current state of a player. Creates default values if empty.
   */
  get: (player) => {
    let data = player.persistentData.getCompound('SinsProject');
    if (data.isEmpty()) {
      data.putDouble('sins', 0);
      data.putInt('level', 0);
      data.putString('trialStage', 'Free');
      data.putDouble('prevX', 0);
      data.putDouble('prevY', 0);
      data.putDouble('prevZ', 0);
      data.putString('prevDim', 'minecraft:overworld');
      player.persistentData.put('SinsProject', data);
    }
    return {
      sins: data.getDouble('sins'),
      level: data.getInt('level'),
      trialStage: data.getString('trialStage'),
      prevLoc: {
        x: data.getDouble('prevX'),
        y: data.getDouble('prevY'),
        z: data.getDouble('prevZ'),
        dim: data.getString('prevDim')
      }
    };
  },
  
  /**
   * Safely updates specific fields in the player's persistent data.
   */
  update: (player, updates) => {
    let data = player.persistentData.getCompound('SinsProject');
    if (data.isEmpty()) {
      SinState.get(player);
      data = player.persistentData.getCompound('SinsProject');
    }

    let currentLevel = updates.level !== undefined ? updates.level : data.getInt('level');

    if (updates.sins !== undefined) {
      // Establish the hard floor: if they have beaten previous bosses, sin cannot fall below the previous threshold.
      let floor = 0;
      if (currentLevel > 0) {
        let prevThresholdIndex = currentLevel - 1;
        if (prevThresholdIndex < SIN_THRESHOLDS.length) {
          floor = SIN_THRESHOLDS[prevThresholdIndex];
        } else {
          floor = SIN_THRESHOLDS[SIN_THRESHOLDS.length - 1];
        }
      }
      
      data.putDouble('sins', Math.max(floor, updates.sins));
    }
    
    if (updates.level !== undefined) {
      data.putInt('level', updates.level);
    }
    if (updates.trialStage !== undefined) {
      data.putString('trialStage', updates.trialStage);
    }
    if (updates.prevLoc) {
      data.putDouble('prevX', updates.prevLoc.x);
      data.putDouble('prevY', updates.prevLoc.y);
      data.putDouble('prevZ', updates.prevLoc.z);
      data.putString('prevDim', updates.prevLoc.dim);
    }
    player.persistentData.put('SinsProject', data);
  },

  /**
   * Helper to get the threshold array globally.
   */
  getThresholds: () => SIN_THRESHOLDS
};

// server_scripts/sins/core/player.js

PlayerEvents.loggedIn(event => {
    let player = event.player;

    // Check if they already have the tag
    let hasBook = player.persistentData.getBoolean('hasReceivedCodex');

    if (!hasBook) {
        console.log(`[SINS DEBUG] Generating initial Codex for new player: ${player.username}`);
        
        let bookItem = generateDynamicCodex(player);
        player.give(bookItem);
        
        // Mark that they received it
        player.persistentData.putBoolean('hasReceivedCodex', true);
        player.tell(Text.darkRed("A heavy, leather-bound codex materializes in your hands..."));
    } else {
        console.log(`[SINS DEBUG] Player ${player.username} logged in (Codex already claimed).`);
    }
});