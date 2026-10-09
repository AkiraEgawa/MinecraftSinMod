// server/sins/commands/creative/stateManager.js

ServerEvents.commandRegistry(event => {
  const { commands, arguments: args } = event;

  // Available states for autocomplete and validation
  const VALID_STATES = ['Free', 'Pending', 'Chased', 'Starting', 'Fighting', 'Victory'];

  event.register(
    commands.literal('sin')
      .requires(src => src.hasPermission(2)) // Require Admin/Creative permissions (OP Level 2)
      
      // --- SUBCOMMAND: checkState ---
      .then(commands.literal('checkState')
        .then(commands.argument('player', args.PLAYER.create(event))
          .executes(ctx => {
            let targetPlayer = args.PLAYER.getResult(ctx, 'player');
            if (!targetPlayer) {
              ctx.getSource().sendFailure(Text.of("Player not found."));
              return 0;
            }

            let state = SinState.get(targetPlayer);
            ctx.getSource().sendSuccess(
              Text.of(`§6${targetPlayer.getName().getString()}§f's current trial state is: §b${state.trialStage}§r`),
              false
            );
            return 1;
          })
        )
      )

      // --- SUBCOMMAND: setState ---
      .then(commands.literal('setState')
        .then(commands.argument('player', args.PLAYER.create(event))
          // Suggest the valid state strings for tab-completion
          .then(commands.argument('state', args.STRING.create(event))
            .suggests((ctx, builder) => {
              VALID_STATES.forEach(s => builder.suggest(s));
              return builder.buildFuture();
            })
            .executes(ctx => {
              let targetPlayer = args.PLAYER.getResult(ctx, 'player');
              let targetState = args.STRING.getResult(ctx, 'state');

              if (!targetPlayer) {
                ctx.getSource().sendFailure(Text.of("Player not found."));
                return 0;
              }

              // Normalise input to match exact casing
              let matchedState = VALID_STATES.find(
                s => s.toLowerCase() === targetState.toLowerCase()
              );

              if (!matchedState) {
                ctx.getSource().sendFailure(
                  Text.of(`Invalid state! Must be one of: ${VALID_STATES.join(', ')}`)
                );
                return 0;
              }

              // Perform the state change
              SinState.update(targetPlayer, { trialStage: matchedState });

              ctx.getSource().sendSuccess(
                Text.green(`Forcefully set ${targetPlayer.getName().getString()}'s state to '${matchedState}'`),
                true
              );
              targetPlayer.tell(
                Text.of(`§6Your reality shifts... Your judge status was forcefully updated to: §e${matchedState}§r`)
              );

              return 1;
            })
          )
        )
      )
  );
});