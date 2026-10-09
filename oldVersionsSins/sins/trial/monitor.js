ServerEvents.tick(event => {

    event.server.players.forEach(player => {

        let data = sinsGetData(player);


        if (data.trialState !== "fighting") {
            return;
        }

        if(player.age - data.trialStartTime < 40){
            return;
        }

        let bosses = event.server
            .getEntities()
            .filter(entity => {

                return entity.tags.contains(
                    `SinsOwner_${player.username}`
                )
                &&
                entity.tags.contains(
                    "SinsTrialBoss"
                );

            });


        let count = bosses.length;


        if (player.age % 40 === 0) {

            player.tell(
                `§5Enemies remaining: ${count}`
            );

        }


        if (count === 0) {

            data.trialState = "complete";


            player.tell(
                "§aTrial complete!"
            );

            player.tell(
                "§6The arena fades..."
            );

            let data = sinsGetData(player)
            console.info(
                "[Sins] Old progress:",
                data.gauntletProgress,
                typeof data.gauntletProgress
            );

            data.gauntletProgress = Number(data.gauntletProgress) + 1;
            data.gauntletProgress = Math.floor(data.gauntletProgress)

        }


    });

});