function sinsGetData(player) {

    if (!player.persistentData.sins) {

        player.persistentData.sins = {
            score:0,
            gauntletProgress:0,
            trialState:"none"
        };

    }

    return player.persistentData.sins;
}