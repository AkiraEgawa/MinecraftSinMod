// server_scripts/sins/commands/survival/surrender.js

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('surrender')
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;

                let state = SinState.get(player);
                
                // Only allow surrender inside an active trial state
                if (state.trialStage === 'Fighting' || state.trialStage === 'Starting' || state.trialStage === 'Victory') {
                    player.tell(Text.of("§cYou have yielded to the Sin Trial...§r"));
                    player.kill();
                    return 1;
                } else {
                    player.tell(Text.of("§cYou are not currently in a trial judgment!§r"));
                    return 0;
                }
            })
    );
});