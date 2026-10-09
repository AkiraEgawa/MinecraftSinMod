// server_scripts/sins/commands/survival/checkSin.js

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('sins')
            .then(Commands.literal('book')
                .executes(context => {
                    let player = context.source.player;
                    if (!player) return 0;

                    try {
                        let bookItem = generateDynamicCodex(player);
                        player.give(bookItem);
                        player.tell(Text.darkRed("The Void binds a fresh Codex to your soul."));
                    } catch (err) {
                        console.error("[SINS BOOK ERROR] " + err);
                        player.tell(Text.red("Failed to generate Codex. Check console logs for details."));
                    }
                    return 1;
                })
            )
    );
});