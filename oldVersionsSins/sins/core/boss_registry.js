var Sins = Sins || {};

Sins.bossRegistry = {

    bosses: [],

    load() {
        let file = JsonIO.read(
            'kubejs/config/bosses.json'
        );

        if (!file || !file.bosses) {
            console.error("[Sins] Failed to load bosses.json");
            return;
        }

        this.bosses = file.bosses;

        console.info("Boss count: " + this.bosses.length);

        for (let boss of this.bosses) {

            if (!boss.entities) {
                console.error(
                    `[Sins] Boss ${boss.name} has no entities!`
                );
            }

        }


        console.info(
            `[Sins] Loaded ${this.bosses.length} bosses`
        );
    },


    get(id) {
        return this.bosses[id - 1];
    }

};

Sins.bossRegistry.getNextBoss = function(player) {

    let data = sinsGetData(player);

    return this.get(
        data.gauntletProgress + 1
    );

};