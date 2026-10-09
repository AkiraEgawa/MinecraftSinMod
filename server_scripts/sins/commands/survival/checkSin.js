// server/sins/commands/survival/checkSin.js

ServerEvents.commandRegistry(event => {
  const { commands, arguments: args } = event;

  event.register(
    commands.literal('sin')
      .then(commands.literal('check')
        .then(commands.argument('player', args.PLAYER.create(event))
          .executes(ctx => {
            let sender = ctx.getSource().getEntity(); // Caller (can be console or player)
            let targetPlayer = args.PLAYER.getResult(ctx, 'player');

            if (!targetPlayer) {
              ctx.getSource().sendFailure(Text.of("Player not found."));
              return 0;
            }

            let state = SinState.get(targetPlayer);
            let feedback = `§6${targetPlayer.getName().getString()}§f has a total of §c${Math.round(state.sins)}§f sins. (Level: ${state.level}, Stage: ${state.trialStage})`;

            if (sender && sender.isPlayer()) {
              // Send private message to the player who executed the command
              sender.tell(Text.of(feedback));
            } else {
              // Command run by console or command block
              ctx.getSource().sendSuccess(Text.of(feedback), false);
            }

            return 1;
          })
        )
      )
  );
});