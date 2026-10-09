// server/sins/doppel/mirror.js

/**
 * Handles mirror mechanics including spell reflecting.
 */
EntityEvents.spawned(event => {
    let entity = event.entity;
    let level = event.level;

    if (!level || level.dimension.toString() !== 'kubejs:void_arena') return;

    // Filter for spell projectiles (Ars Nouveau spell projectiles, Iron's spells, projectiles)
    let type = entity.type.toString();
    let isSpell = type.includes('ars_nouveau:spell_proj') || 
                  type.includes('irons_spellbooks:') || 
                  type.includes('projectile');

    if (!isSpell) return;

    // Find active Doppelganger in arena
    let doppel = level.getEntities().find(e => e.tags.contains('SinsDoppelganger'));
    if (!doppel) return;

    let ownerUUID = doppel.persistentData.getString('ownerUUID');

    // Verify spell was cast by player (not by doppel)
    if (entity.nbt && entity.nbt.toString().includes(ownerUUID) && !entity.tags.contains('mirrored_spell')) {
        let player = level.players.find(p => p.uuid.toString() === ownerUUID);
        if (!player) return;

        // Duplicate the spell entity at Doppelganger's position targeting player
        let mirrorSpell = level.createEntity(type);
        if (mirrorSpell) {
            mirrorSpell.setPosition(doppel.x, doppel.y + 1.5, doppel.z);

            // Calculate directional vector pointing from Doppel to Player
            let dx = player.x - doppel.x;
            let dy = (player.y + 1.0) - (doppel.y + 1.5);
            let dz = player.z - doppel.z;
            let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist > 0) {
                let speed = 1.2;
                mirrorSpell.setMotion(dx / dist * speed, dy / dist * speed, dz / dist * speed);
            }

            // Copy NBT and tag to prevent infinite duplication loops
            if (entity.nbt) mirrorSpell.mergeNbt(entity.nbt);
            mirrorSpell.addTag('mirrored_spell');

            mirrorSpell.spawn();
            console.log(`[SINS DOPPEL] Mirrored spell ${type} back at player!`);
        }
    }
});