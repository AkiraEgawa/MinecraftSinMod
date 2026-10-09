var Sins = Sins || {};


ServerEvents.commandRegistry(event => {


    const {
        commands: Commands
    } = event;



    event.register(

        Commands.literal("testcouncil")

        .executes(ctx => {


            let player = ctx.source.player;

            let boss =
                Sins.bossRegistry.get(1);



            Sins.bossSpawner.spawn(

                boss,

                player,

                player.level,

                {
                    x: player.x + 5,
                    y: player.y,
                    z: player.z
                }

            );


            player.tell(
                "Council summoned!"
            );


            return 1;

        })

    );


});