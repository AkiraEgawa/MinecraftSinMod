// server_scripts/sins/commands/survival/recall.js

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('recall')
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;

                let state = SinState.get(player);

                // Only allow during active combat
                if (state.trialStage !== 'Fighting') {
                    player.tell(Text.of("§cYou can only recall trial bosses while actively fighting in a trial!§r"));
                    return 0;
                }

                let playerUUID = player.uuid.toString();
                let level = player.level;

                // Find all trial bosses assigned to this specific player
                let bosses = level.getEntities().filter(e => 
                    e.tags && 
                    e.tags.contains('SinsTrialBoss') && 
                    e.tags.contains(`owner_${playerUUID}`) &&
                    e.isAlive()
                );

                if (bosses.length === 0) {
                    player.tell(Text.of("§eNo active trial bosses found to recall.§r"));
                    return 0;
                }

                // Convert player yaw to radians safely in JS (Minecraft yaw: 0 = +Z, 90 = -X)
                let yawRad = player.yaw * (Math.PI / 180);
                let targetX = player.x - Math.sin(yawRad) * 3;
                let targetY = player.y;
                let targetZ = player.z + Math.cos(yawRad) * 3;

                bosses.forEach(boss => {
                    boss.teleportTo(player.level.dimension.toString(), targetX, targetY, targetZ, boss.yaw, boss.pitch);
                });

                player.tell(Text.of(`§aRecalled ${bosses.length} boss(es) to your position!§r`));
                return 1;
            })
    );
});