var Sins = Sins || {};

Sins.trial = {


    start(player) {


        let data = sinsGetData(player);


        let progress =
            data.getInt("gauntletProgress") || 0;


        let boss =
            Sins.bossRegistry.get(
                progress + 1
            );


        if(!boss) {

            player.tell(
                "No more judges remain."
            );

            return;

        }



        let level =
            player.server.getLevel(
                "kubejs:void_arena"
            );


        let arena =
            Sins.arena.getPosition(player);



        // Create arena

        Sins.arena.build(
            level,
            arena
        );



        // Save location

        data.putDouble(
            "returnX",
            player.x
        );

        data.putDouble(
            "returnY",
            player.y
        );

        data.putDouble(
            "returnZ",
            player.z
        );


        data.putString(
            "returnDim",
            player.level.dimension.toString()
        );



        // Move player

        player.teleportTo(
            "kubejs:void_arena",
            arena.x,
            arena.y+2,
            arena.z,
            player.yaw,
            player.pitch
        );



        data.putString(
            "trialState",
            "started"
        );



        // Spawn boss

        Sins.bossSpawner.spawn(

            boss,

            player,

            level,

            {
                x: arena.x,
                y: arena.y+2,
                z: arena.z+5
            }

        );

        player.sendSystemMessage(
            Text.of(
                "Spawn function completed"
            )
        );

        player.tell(
            `§4${boss.name} has arrived.`
        );


    }

};


Sins.trial.victory = function(player){


    let data =
        sinsGetData(player);



    data.putString(
        "trialState",
        "victory_pending"
    );


    let progress =
        data.getInt(
            "gauntletProgress"
        )
        || 0;



    data.putInt(
        "gauntletProgress",
        progress + 1
    );



    player.tell(
        "§6§lVICTORY"
    );


    player.tell(
        "§eA fragment of your shattered ego appears..."
    );


    Sins.fragment.spawn(player);


};