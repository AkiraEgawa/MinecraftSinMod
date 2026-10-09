ServerEvents.commandRegistry(event => {

    const {
        commands: Commands
    } = event;


    event.register(

        Commands.literal("testspawn")

        .executes(ctx => {


            let player = ctx.source.player;

            if (!player) {
                return 0;
            }


            let boss =
                Sins.bossRegistry.get(1);


            player.sendSystemMessage(
                Text.of(
                    "Attempting to spawn: " + boss.name
                )
            );


            Sins.bossSpawner.spawn(
                player.level,
                boss,
                player.x,
                player.y,
                player.z + 5
            );


            player.sendSystemMessage(
                Text.of(
                    "Spawn function returned."
                )
            );


            return 1;

        })

    );

});