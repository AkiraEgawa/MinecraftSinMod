var Sins = Sins || {};

ServerEvents.loaded(event => {

    Sins.bossRegistry.load();

    let boss = Sins.bossRegistry.get(1);

    console.info(
        `[Sins] First boss: ${boss.name}`
    );

});