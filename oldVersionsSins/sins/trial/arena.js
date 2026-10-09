var Sins = Sins || {};

Sins.arena = {

    // For now we use fixed arenas.
    // Later we will make this dynamic.
    baseX: 0,
    baseY: 64,
    baseZ: 0,


    getPosition(player) {

        /*
            Every player gets their own arena ID.

            Example:
            Player A -> arena 0
            Player B -> arena 1
        */

        let id = player.uuid.hashCode();

        id = Math.abs(id % 1000);
    

        console.log(
            "[Sins] Arena calculation:"
        );

        console.log(
            "UUID hash:",
            player.uuid.hashCode()
        );

        console.log(
            "Arena ID:",
            id
        );

        console.log(
            "Final X:",
            this.baseX + (id * 40)
        );

        return {
            x: this.baseX + (id * 40),
            y: this.baseY,
            z: this.baseZ
        };

    },


    build(level, pos) {

        let radius = 15;
        let height = 8;


        for (let x = -radius; x <= radius; x++) {

            for (let z = -radius; z <= radius; z++) {


                let distance =
                    Math.sqrt(
                        x*x + z*z
                    );


                if (distance <= radius) {


                    // floor
                    level.getBlock(
                        pos.x+x,
                        pos.y,
                        pos.z+z
                    ).set(
                        "minecraft:bedrock"
                    );


                    // ceiling
                    level.getBlock(
                        pos.x+x,
                        pos.y+height,
                        pos.z+z
                    ).set(
                        "minecraft:barrier"
                    );


                    // walls
                    if(distance > radius-1) {

                        for(
                            let y=1;
                            y<height;
                            y++
                        ) {

                            level.getBlock(
                                pos.x+x,
                                pos.y+y,
                                pos.z+z
                            ).set(
                                "minecraft:bedrock"
                            );

                        }

                    }

                }

            }

        }

    }

};