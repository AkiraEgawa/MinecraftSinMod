ServerEvents.commandRegistry(event => {

    const {
        commands: Commands
    } = event;


    event.register(
        Commands.literal("testtrial")
        .executes(ctx => {

            let player = ctx.source.player;

            if (!player) {
                return 0;
            }


            let server = player.server;


            let level =
                server.getLevel(
                    "kubejs:void_arena"
                );


            if (!level) {

                player.sendSystemMessage(
                    Text.red(
                        "Void arena dimension missing!"
                    )
                );

                return 0;
            }

            let boss = Sins.bossRegistry.getNextBoss(player);

            if(!boss){
                player.sendSystemMessage(
                    Text.red("You have defeated every boss!")
                )
            };



            let arenaPos = {
                x:0,
                y:64,
                z:0
            };



            /*
                Build arena FIRST
            */

            Sins.arena.build(
                level,
                arenaPos
            );



            /*
                Teleport player
            */

            player.teleportTo(
                "kubejs:void_arena",
                arenaPos.x,
                arenaPos.y + 2,
                arenaPos.z,
                0,
                0
            );



            /*
                Spawn boss
            */

            let data = sinsGetData(player);

            data.trialState = "starting";
            data.trialStartTime = player.age;
            Sins.bossSpawner.spawn(
                boss,
                player,
                level,
                {
                    x: arenaPos.x,
                    y: arenaPos.y + 2,
                    z: arenaPos.z + 5
                }
            );
            
            data.trialStartTime = player.age;
            data.trialState = "fighting";


            player.sendSystemMessage(
                Text.green(
                    "Trial started!"
                )
            );


            return 1;

        })
    );

});