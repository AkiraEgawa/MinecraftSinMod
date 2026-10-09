ServerEvents.commandRegistry(event => {

    const {
        commands: Commands
    } = event;

    event.register(
        Commands.literal("sinsboss")
        .executes(ctx => {

            let player = ctx.source.player;

            if (!player) {
                return 0;
            }

            let data = sinsGetData(player);

            player.tell(
                "Progress = " + data.gauntletProgress
            );

            let boss =
                Sins.bossRegistry.get(
                    data.gauntletProgress + 1
                );

            player.tell(
                boss ? boss.name : "NULL"
            );

            return 1;

        })
    );

});