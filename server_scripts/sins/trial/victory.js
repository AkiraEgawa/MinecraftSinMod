// server_scripts/sins/trial/victory.js

/**
 * Top-level global function called by monitor.js when a trial is won.
 * @param {Internal.ServerPlayer} player 
 */
function triggerTrialVictory(player) {
    let state = SinState.get(player);
    let nextLevel = state.level + 1;

    // Advance state to Victory
    SinState.update(player, { 
        level: nextLevel, 
        trialStage: 'Victory' 
    });

    player.playSound('minecraft:ui.toast.challenge_complete', 1.0, 1.0);
    player.tell(Text.of("§a§lVICTORY!§r §2You have overcome the judge. Use your Return Star or /sins return to go back.§r"));

    // Modern MC 1.21 Inline Component Syntax
    let returnStar = Item.of('minecraft:nether_star[custom_name=\'"§6Star of Return§r"\',custom_data={ReturnToWorld:true}]');

    player.give(returnStar);
}

// Right-click listener for Return Star
ItemEvents.rightClicked(event => {
    let player = event.player;
    let item = event.item;

    if (item.id !== 'minecraft:nether_star') return;

    let customData = item.getCustomData();
    let isReturnStar = customData && customData.getBoolean('ReturnToWorld');

    if (isReturnStar) {
        let state = SinState.get(player);

        if (state.trialStage === 'Victory') {
            item.count--;
            executeTrialReturn(player);
        } else {
            player.tell(Text.of("§cThe star hums quietly, but nothing happens...§r"));
        }
    }
});