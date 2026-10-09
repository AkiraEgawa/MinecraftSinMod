// server_scripts/sins/commands/creative/resetSin.js

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    event.register(
        Commands.literal('resetsin')
            .requires(src => src.hasPermission(2)) // OP permission level
            .executes(ctx => {
                // Self-reset
                let player = ctx.source.player;
                if (!player) return 0;
                resetPlayerSinData(player);
                return 1;
            })
            .then(
                Commands.argument('target', Arguments.PLAYER.create(event))
                    .executes(ctx => {
                        // Reset targeted player
                        let target = Arguments.PLAYER.getResult(ctx, 'target');
                        resetPlayerSinData(target);
                        ctx.source.sendSuccess(Text.of(`§aSuccessfully reset Sin progress for ${target.username}.§r`), true);
                        return 1;
                    })
            )
    );
});

/**
 * Completely purges sin progress and resets state.
 * @param {Internal.ServerPlayer} player 
 */
function resetPlayerSinData(player) {
    // 1. Force-reset the SinsProject NBT Compound directly
    let data = player.persistentData.getCompound('SinsProject');
    
    data.putInt('level', 0);           // Reset boss/judge level to 0
    data.putDouble('sins', 0);         // Reset sin progress to 0
    data.putString('trialStage', 'Free');

    player.persistentData.put('SinsProject', data);

    // 2. Clear instance allocations if tracked globally
    let serverData = player.server.persistentData;
    let activeArenas = serverData.getCompound('SinsActiveArenas');
    if (activeArenas && activeArenas.contains(player.uuid.toString())) {
        activeArenas.remove(player.uuid.toString());
        serverData.put('SinsActiveArenas', activeArenas);
    }

    // 3. Clear Codex flag so a fresh book can be granted if needed
    // player.persistentData.remove('hasReceivedCodex');

    player.tell(Text.of('§e[SINS] Your level and sin count have been completely reset to 0.§r'));
    console.log(`[SINS RESET] Successfully set SinsProject NBT to level 0 / sins 0 for ${player.username}`);
}