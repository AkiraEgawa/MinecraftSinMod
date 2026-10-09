// server_scripts/sins/commands/creative/setLevel.js

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    event.register(
        Commands.literal('setlevel')
            .requires(src => src.hasPermission(2)) // Requires OP permission
            .then(Commands.argument('target', Arguments.PLAYER.create(event))
                .then(Commands.argument('level', Arguments.INTEGER.create(event))
                    .executes(ctx => {
                        let targetPlayer = Arguments.PLAYER.getResult(ctx, 'target');
                        let targetLevel = Arguments.INTEGER.getResult(ctx, 'level');

                        if (targetLevel < 0) {
                            ctx.source.sendFailure(Text.of("§cLevel cannot be negative!§r"));
                            return 0;
                        }

                        // Retrieve state & update
                        let state = SinState.get(targetPlayer);
                        
                        SinState.update(targetPlayer, {
                            level: targetLevel,
                            trialStage: 'Free' // Reset stage to Free to prevent locked trial states
                        });

                        ctx.source.sendSuccess(
                            Text.of(`§aSet ${targetPlayer.username}'s trial level to ${targetLevel}.§r`), 
                            true
                        );
                        
                        targetPlayer.tell(Text.of(`§eYour trial level has been set to ${targetLevel} by an admin.§r`));
                        return 1;
                    })
                )
            )
    );
});