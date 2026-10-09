// server_scripts/sins/commands/survival/return.js

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('sins')
            .then(Commands.literal('return')
                .executes(ctx => {
                    let player = ctx.source.player;
                    if (!player) return 0;

                    let success = executeTrialReturn(player);
                    return success ? 1 : 0;
                })
            )
    );
});