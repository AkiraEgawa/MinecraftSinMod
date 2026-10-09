ServerEvents.commandRegistry(event => {

    const {
        commands: Commands
    } = event;


    event.register(
        Commands.literal("sinstrialdebug")
        .executes(ctx => {


            let player =
                ctx.source.player;


            let data =
                sinsGetData(player);


            player.tell(
                `§5=== Sins Trial Debug ===`
            );


            player.tell(
                `Phase: ${data.trialState}`
            );


            player.tell(
                `Progress: ${data.gauntletProgress}`
            );


            player.tell(
                `Score: ${data.score}`
            );

            player.tell(
                JSON.stringify(player.persistentData.sins)
            );


            return 1;

        })
    );

});