// server/sins/doppel/spawn.js

ServerEvents.tick(event => {
    if (event.server.tickCount % 5 !== 0) return;

    event.server.players.forEach(player => {
        if (player.level.dimension.toString() !== 'kubejs:void_arena') return;

        let state = SinState.get(player);
        if (!state || state.trialStage !== 'Starting') return;

        let originX = Math.round(player.x / 1000.0) * 1000;

        // Trigger region check
        let inTriggerZone = Math.abs(player.x - originX) <= 5.0 && 
                            Math.abs(player.z - 5.0) <= 3.0;

        if (inTriggerZone) {
            console.log(`[SINS DOPPEL] Player ${player.username} entered trigger zone!`);
            
            let snapshot = DoppelGear.snapshotPlayer(player);
            let level = player.level;
            let doppel = level.createEntity('minecraft:zombie');

            if (doppel) {
                doppel.setPosition(originX + 0.5, 66.0, 12.0);
                doppel.setYaw(180.0);

                // 1. Equip items directly using KubeJS item stack getters
                if (snapshot.head && !snapshot.head.isEmpty()) doppel.setHeadArmorItem(snapshot.head);
                if (snapshot.chest && !snapshot.chest.isEmpty()) doppel.setChestArmorItem(snapshot.chest);
                if (snapshot.legs && !snapshot.legs.isEmpty()) doppel.setLegsArmorItem(snapshot.legs);
                if (snapshot.feet && !snapshot.feet.isEmpty()) doppel.setFeetArmorItem(snapshot.feet);
                
                // 2. Set Weapons
                doppel.setMainHandItem(snapshot.primarySword);
                if (snapshot.offHand && !snapshot.offHand.isEmpty()) doppel.setOffHandItem(snapshot.offHand);

                // 3. System tags & NBT
                doppel.addTag('SinsTrialBoss');
                doppel.addTag('SinsDoppelganger');
                doppel.addTag(`owner_${player.uuid.toString()}`);

                doppel.persistentData.putString('ownerUUID', player.uuid.toString());
                doppel.persistentData.putInt('doppelTotems', snapshot.totems);
                doppel.persistentData.putString('swordId', snapshot.primarySword.id);
                doppel.persistentData.putString('bowId', snapshot.primaryBow.id);

                doppel.customName = Text.of(`§cDoppelganger of ${player.username}§r`);
                doppel.customNameVisible = true;

                // Disable daylight burning via NBT flags instead of forcing a helmet
                doppel.mergeNbt({ PersistenceRequired: 1, IsBaby: 0, SunSensitive: 0 });

                doppel.spawn();

                SinState.update(player, { trialStage: 'Fighting' });
                player.tell(Text.of("§4Your own reflection steps out from the shadows!§r"));
            }
        }
    });
});