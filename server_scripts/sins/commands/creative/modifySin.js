// server/sins/commands/creative/modifySin.js

ServerEvents.commandRegistry(event => {
  const { commands, arguments: args } = event;

  event.register(
    commands.literal('sin')
      .requires(src => src.hasPermission(2)) // Creative/Admin permission level
      .then(commands.literal('modify')
        .then(commands.argument('player', args.PLAYER.create(event))
          .then(commands.argument('amount', args.INTEGER.create(event))
            .executes(ctx => {
              let targetPlayer = args.PLAYER.getResult(ctx, 'player');
              let amount = args.INTEGER.getResult(ctx, 'amount');
              
              if (!targetPlayer) {
                ctx.getSource().sendFailure(Text.of("Player not found."));
                return 0;
              }

              // Update state to administrative set amount
              SinState.update(targetPlayer, { sins: amount });

              // Re-fetch state to get the actual value (respecting minimum floor of level)
              let updatedState = SinState.get(targetPlayer);
              
              ctx.getSource().sendSuccess(Text.green(`Set ${targetPlayer.getName().getString()}'s sins to ${Math.round(updatedState.sins)} (Floor enforced: ${updatedState.sins !== amount})`), true);
              targetPlayer.tell(Text.of(`§6An unseen power altered your fate... Your sins are now: ${Math.round(updatedState.sins)}§r`));
              
              return 1;
            })
          )
        )
      )
  );
});