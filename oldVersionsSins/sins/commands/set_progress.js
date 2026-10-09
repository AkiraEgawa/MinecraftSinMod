ServerEvents.commandRegistry(event => {

    const {
        commands: Commands,
        arguments: Arguments
    } = event;


    event.register(

        Commands.literal("sinsprogress")

        .then(
            Commands.argument(
                "value",
                Arguments.INTEGER.create(event)
            )

            .executes(ctx => {


                let player =
                    ctx.source.player;


                if(!player){

                    ctx.source.sendSystemMessage(
                        Text.of(
                            "Only players can use this command."
                        )
                    );

                    return 0;

                }



                let value =
                    Arguments.INTEGER.getResult(
                        ctx,
                        "value"
                    );



                let data =
                    sinsGetData(player);



                data.putInt(
                    "gauntletProgress",
                    value
                );



                player.sendSystemMessage(
                    Text.of(
                        `§aGauntlet progress set to ${value}`
                    )
                );


                return 1;

            })

        )

    );


});