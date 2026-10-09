// server_scripts/sins/commands/survival/accept.js

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('sins')
            .then(Commands.literal('accept')
                .executes(ctx => {
                    let player = ctx.source.player;
                    if (!player) return 0;

                    let state = SinState.get(player);
                    if (state.trialStage === 'Pending' || state.trialStage === 'Chased') {
                        executeTrialAccept(player);
                        return 1;
                    } else {
                        player.tell(Text.of("§cYou have no pending judgments to accept.§r"));
                        return 0;
                    }
                })
            )
    );
});