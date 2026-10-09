var Sins = Sins || {};

Sins.bossTracker = {


count(player, level){

    let bosses = level.getEntities()
        .filter(entity => {

            return entity.isAlive()
                && entity.getTags()
                    .contains("SinsTrialBoss")
                && entity.getTags()
                    .contains(`SinsOwner_${player.username}`);

        });


    return bosses.length;

},



isComplete(player, level){

    return this.count(player, level) === 0;

}


};