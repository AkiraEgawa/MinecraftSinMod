var Sins = Sins || {};

Sins.bossSpawner = {


spawn(boss, player, level, pos){


    let entities = [];


    if(boss.entities){

        entities = boss.entities;

    }
    else if(boss.entity){

        entities = [
            boss.entity
        ];

    }
    else {

        console.error(
            "[Sins] Boss has no entity!"
        );

        return;

    }



    console.info(
        `[Sins] Spawning ${boss.name} (${entities.length} entities)`
    );



    /*
        Use classic for loop.
        Rhino/KubeJS sometimes breaks forEach indexes.
    */

    for(let index = 0; index < entities.length; index++){


        let id = entities[index];


        console.info(
            `[Sins] Index ${index}: ${id}`
        );



        let mob =
            level.createEntity(id);



        if(!mob){

            console.error(
                `[Sins] Failed spawning ${id}`
            );

            continue;

        }



        /*
            Spread entities around center

            Example for 5:

            -6
            -3
             0
             3
             6

        */

        let offset =
            (index - Math.floor(entities.length / 2)) * 3;



        let spawnX =
            pos.x + offset;

        let spawnY =
            pos.y;

        let spawnZ =
            pos.z;



        console.info(
            `[Sins] Summoning ${id} at ${spawnX} ${spawnY} ${spawnZ}`
        );



        mob.setPosition(
            spawnX,
            spawnY,
            spawnZ
        );



        mob.customName =
            Text.of(
                boss.name
            );


        mob.addTag(
            `SinsOwner_${player.username}`
        );


        mob.addTag(
            `SinsOwner_${player.username}`
        );

        
        mob.addTag(
            'SinsTrialBoss'
        )

        mob.spawn();



        console.info(
            `[Sins] Summoned ${id}`
        );


    }



    player.tell(
        `§4${boss.name} has entered the arena.`
    );


}


};