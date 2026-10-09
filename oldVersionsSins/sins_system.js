// Helper to safely get and initialize player persistent NBT data
function getSinData(player) {
    if (!player.persistentData.sins) {
        player.persistentData.sins = {
            // Leave default initialization, but we will access them strictly as Integers
            score: 0,
            threshold: 0,
            graceTicks: -1,
            inTrial: false,
            pendingBoss: "",
            targetThreshold: 0
        };
    }
    return player.persistentData.sins;
}

// Global update function for adding/subtracting sin
function modifySin(player, amount) {
    let data = getSinData(player);
    
    // 1. Force KubeJS to fetch the value strictly as a 32-bit Integer
    let currentScore = data.getInt('score') || 0;
    
    // 2. Perform math
    let newScore = currentScore + amount;
    
    // 3. Force KubeJS to read the threshold limit as an Integer
    let limit = data.getInt('threshold') || 0;
    if (newScore < limit) newScore = limit;
    
    // 4. Force save back to NBT as a strict Integer (No more 0.0d!)
    data.putInt('score', newScore);
    
    // Notify the player with a guaranteed clean whole number
    player.displayClientMessage(
        Text.of(`Your soul feels ${amount > 0 ? '§cheavier' : '§alighter'}... (Sins: ${newScore})`), 
        true
    );
}

EntityEvents.death(event => {
    const victim = event.entity;
    const source = event.source;
    if (!victim || !source) return;

    // Check if the killer is a player and the victim is NOT a player
    if (source.player && !victim.isPlayer()) {
        const slayer = source.player; // Using 'slayer' to completely avoid 'attacker' collisions

        // 1. Killing a Villager (+1 Sin)
        if (victim.type === 'minecraft:villager') {
            modifySin(slayer, 1);
            slayer.tell(Text.of("§cYou struck down an innocent soul. (+1 Sin)§r"));
        } 
        // 2. Killing a passive animal (+1 Sin)
        else if (victim.animal) {
            modifySin(slayer, 1);
            slayer.tell(Text.of("§cYou struck down an innocent animal. (+1 Sin)§r"));
        }
    }
});


// Passing 'player' as the first argument filters the event on the engine level
EntityEvents.death('player', event => {
    const player = event.entity;
    modifySin(player, -5)
    player.tell("Your journey has come to an end.");
});

// This event listens directly to players triggering a Totem of Undying via native NeoForge events
NativeEvents.onEvent('net.neoforged.neoforge.event.entity.living.LivingUseTotemEvent', event => {
    let entity = event.getEntity();
    
    // Only trigger if the entity saved by the totem is a player
    if (entity.isPlayer()) {
        modifySin(entity, 20);
        entity.tell("§4A golden light wraps around you... you cheated death! (+20 Sins)§r");
    }
});

// ==========================================
// 5. IN-GAME ADMIN COMMAND REGISTRY
// ==========================================

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    // 1. Create the base command node
    const sinsCommand = Commands.literal("sins")
        .requires(source => source.hasPermission(2));

    // 2. Attach the "check" branch (Flat)
    const checkBranch = Commands.literal("check")
        .then(Commands.argument("target", Arguments.PLAYER.create(event))
            .executes(ctx => {
                let targetPlayer = Arguments.PLAYER.getResult(ctx, "target");
                if (!targetPlayer) return 0;

                let data = getSinData(targetPlayer);
                let currentSins = data.getInt('score') || 0;

                ctx.source.sendSystemMessage(Text.of(`§6${targetPlayer.username} currently has §c${currentSins}§6 Sins.§r`));
                return 1;
            })
        );

    // 3. Attach the "modify" branch (Flat)
    const modifyBranch = Commands.literal("modify")
        .then(Commands.argument("target", Arguments.PLAYER.create(event))
            .then(Commands.argument("value", Arguments.INTEGER.create(event))
                .executes(ctx => {
                    let targetPlayer = Arguments.PLAYER.getResult(ctx, "target");
                    let value = Arguments.INTEGER.getResult(ctx, "value");
                    if (!targetPlayer) return 0;

                    let data = getSinData(targetPlayer);
                    let prevSins = data.getInt('score') || 0;

                    modifySin(targetPlayer, value);
                    let nowSins = data.getInt('score') || 0;

                    ctx.source.sendSystemMessage(Text.of(`§a${targetPlayer.username} sin value prev: ${prevSins}, ${targetPlayer.username} sin value now: ${nowSins}§r`));
                    return 1;
                })
            )
        );

    // 4. Attach the "accept" branch (Flat)
    const acceptBranch = Commands.literal("accept")
        .executes(ctx => {
            let player = ctx.source.player;
            if (!player) return 0;

            let data = getSinData(player);
            let graceTicks = data.getInt('graceTicks') || -1;
            let pendingBoss = data.getString('pendingBoss') || "";

            // If player has an active trial countdown, send them to the trial dimension
            if (graceTicks > 0 && pendingBoss !== "") {
                data.putInt('graceTicks', -1);
                data.putBoolean('inTrial', true);
                
                let server = ctx.source.getServer();
                let coords = getNextArenaOffset(server);
                
                // Teleport and spawn boss logic goes here!
                player.teleportTo("sins:sin_purgatory", coords.x + 8, coords.y + 1, coords.z + 8, 0, 0); 
                player.sendSystemMessage(Text.of("§4Your trial has begun. Conquer your sins!§r"));
            } else {
                player.sendSystemMessage(Text.of("§cYou have no pending trials to accept right now.§r"));
            }
            return 1;
        });

        const resetBookBranch = Commands.literal("resetBook")
        .then(Commands.argument("target", Arguments.PLAYER.create(event))
            .executes(ctx => {
                let targetPlayer = Arguments.PLAYER.getResult(ctx, "target");
                if (!targetPlayer) return 0;

                let data = getSinData(targetPlayer);
                
                // Clear the book flag
                data.putInt('hasStarterBook', 0);

                ctx.source.sendSystemMessage(Text.of(`§aReset starter book flag for ${targetPlayer.username}. They will receive a new book next login!§r`));
                return 1;
            })
        );

        // Relive Memory subcommand
        const reliveBranch = Commands.literal("relive")
            .then(Commands.argument("bossId", Arguments.INTEGER.create(event))
                .executes(ctx => {
                    let player = ctx.source.player;
                    if (!player) return 0;
                    
                    let bossId = Arguments.INTEGER.getResult(ctx, "bossId");
                    
                    // 1. Read the JSON wrapper
                    let parsedJson = JsonIO.read('kubejs/config/bosses.json');
                    let bosses = null;
                    
                    // 2. Extract the actual bosses list safely
                    if (parsedJson && parsedJson.bosses) {
                        bosses = parsedJson.bosses;
                    }
                    
                    if (!bosses) {
                        player.sendSystemMessage(Text.of("§cError: Could not load the boss list! Check bosses.json§r"));
                        return 0;
                    }
                    
                    // 3. Run the boundaries check on the list length
                    if (bossId > 0 && bossId <= bosses.length) {
                        let boss = bosses[bossId - 1];
                        player.sendSystemMessage(Text.of(`§9Entering memory to face ${boss.name}...§r`));
                        
                        // Teleport and summon memory-instance logic goes here!
                    } else {
                        player.sendSystemMessage(Text.of(`§cInvalid boss ID. Select a trial from 1 to ${bosses.length}.§r`));
                    }
                    return 1;
                })
            );
        // Update Book subcommand so player can refresh their statistics anytime
        const updateBookBranch = Commands.literal("updateBook")
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                
                // Delete old codex from inventory
                player.inventory.clear(Item.of('minecraft:written_book').filter(stack => stack.name.string.includes("Codex")));
                
                // Generate and give a fresh one with new stats!
                let newCodex = generateDynamicCodex(player);
                player.give(newCodex);
                player.sendSystemMessage(Text.of("§aYour Codex of The Shattered Ego has been updated.§r"));
                return 1;
            });
        
        // Force Summon Trial subcommand
        const forceBranch = Commands.literal("force")
            .requires(src => src.hasPermission(2)) // Needs OP level 2
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                
                player.sendSystemMessage(Text.of("§4Force-triggering your current Judgement Trial...§r"));
                initiateJudgementTrial(player);
                return 1;
            });

        // Reset Gauntlet Progress subcommand
        const resetProgressBranch = Commands.literal("resetProgress")
            .requires(src => src.hasPermission(2)) // Needs OP level 2
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                
                let data = getSinData(player);
                data.putInt('gauntletProgress', 0);
                data.putString('trialState', 'none');
                
                player.sendSystemMessage(Text.of("§a[Sins] Your gauntlet progress has been reset to Trial 1!§r"));
                return 1;
            });

        // Return from Void subcommand
        const returnBranch = Commands.literal("return")
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                
                let data = getSinData(player);
                let state = data.getString('trialState') || 'none';
                
                if (state === 'victory_pending' && player.level.dimension.toString() === 'kubejs:void_arena') {
                    escapeVoidArena(player);
                } else {
                    player.sendSystemMessage(Text.of("§cYou are not currently in an active victory state inside the Void!§r"));
                }
                return 1;
            });

    event.register(
        sinsCommand
            .then(checkBranch)
            .then(modifyBranch)
            .then(acceptBranch)
            .then(resetBookBranch)
            .then(reliveBranch)
            .then(updateBookBranch)
            .then(forceBranch)
            .then(resetProgressBranch)
            .then(returnBranch)
    );
});

// Load this ONCE globally at the very top of your script
const SinsGsonClass = Java.loadClass('com.google.gson.Gson');
const sinsGsonInstance = new SinsGsonClass();

// Helper to build a visually perfect progression track bar
function getProgressTrackString(progressCount) {
    let bar = "";
    for (let i = 0; i < 14; i++) {
        if (i < progressCount) {
            bar += "▮";
        } else {
            bar += "▯";
        }
    }
    return `[ ${bar} ]`;
}

// Global compiler to create a customized Codex of The Shattered Ego for a player
function generateDynamicCodex(player) {
    let data = getSinData(player);
    let currentSins = data.getInt('score') || 0;
    
    // Explicitly parse as an integer to prevent string comparison bugs
    let progress = parseInt(data.getInt('gauntletProgress')) || 0; 
    
    // --- SAFE KUBEJS FILE READING ---
    let bosses = [];
    try {
        let parsedJson = JsonIO.read('kubejs/config/bosses.json');
        
        // Safely extract the bosses array
        if (parsedJson && parsedJson.bosses) {
            bosses = parsedJson.bosses;
        } else {
            console.error("COULD NOT FIND FILE: Check that 'kubejs/config/bosses.json' exists.");
        }
    } catch (e) {
        console.error("FAILED TO LOAD BOSSES.JSON: " + e);
    }
    
    // Calculate who the next judge is
    let nextJudgeName = "None (Gauntlet Completed!)";
    if (bosses && bosses.length > 0 && progress < bosses.length) {
        let nextBoss = bosses[progress];
        nextJudgeName = `${nextBoss.name} (Trial ${progress + 1})`;
    } else if (!bosses || bosses.length === 0) {
        nextJudgeName = "Error: bosses.json missing/empty";
    }

    let rawPages = [];

    // ==========================================
    // PAGE 1: Dynamic Progression Track
    // ==========================================
    rawPages.push([
        { text: "================\n   PROGRESSION TRACK\n================\n\n", bold: true },
        { text: `Current Sin Level: [ ${currentSins} / 100 ]\n\n` },
        { text: "Gauntlet Progress:\n" },
        { text: `${getProgressTrackString(progress)}\n\n`, color: "dark_red" },
        { text: "Next Judge:\n", bold: true },
        { text: `${nextJudgeName}\n\n`, color: "red" }
    ]);

    // ==========================================
    // PAGE 2: INDEX OF THE VOID (Table of Contents)
    // ==========================================
    rawPages.push([
        { text: "§0§lINDEX OF THE VOID§r\n\nClick a chapter to read:\n\n" },
        { 
            text: "§4§n1. The Lore§r\n\n", 
            clickEvent: { action: "change_page", value: "3" } 
        },
        { 
            text: "§4§n2. How the Gauntlet Works§r\n\n", 
            clickEvent: { action: "change_page", value: "4" } 
        },
        { 
            text: "§4§n3. The Call to Judgement§r\n\n", 
            clickEvent: { action: "change_page", value: "6" } 
        },
        { 
            text: progress > 0 ? "§4§n4. Defeated Judges§r\n\n" : "§84. Defeated Judges (Locked)§r\n\n", 
            clickEvent: progress > 0 ? { action: "change_page", value: "7" } : undefined 
        }
    ]);

    // ==========================================
    // PAGE 3: The Lore
    // ==========================================
    rawPages.push({
        text: "“This book is bound to your soul. Every block you mine, every chest you plunder, every life you extinguish… it leaves a stain.\n\nWhen your stains run deep, the sky shall tear open and the Void will demand its tribute. You cannot run. You cannot hide. You can only survive.”"
    });

    // ==========================================
    // PAGE 4: How the Gauntlet Works (Part 1)
    // ==========================================
    rawPages.push({
        text: "§0§lHow the Gauntlet Works§r\n\n§4• The Sin Meter:§r Your actions accrue Sin. When your meter hits 100, your current judge is summoned.\n\n§4• The Gauntlet:§r You must face all 14 legendary executioners in order."
    });

    // ==========================================
    // PAGE 5: How the Gauntlet Works (Part 2)
    // ==========================================
    rawPages.push({
        text: "§4• The Toll:§r If you fall in the arena, your progression halts. You will face the same Judge again when you next transgress.\n\nIf you succeed, you earn a piece of your shattered self."
    });

    // ==========================================
    // PAGE 6: The Call to Judgement (Accept Challenge Page)
    // ==========================================
    rawPages.push([
        { text: "“Do not wait for the Void to drag you kicking and screaming. Prove your defiance. When your sin is ripe, open this page and command the gate to open.”\n\n\n" },
        { 
            text: "[CLICK HERE TO FACE YOUR JUDGEMENT]", 
            color: "dark_red", 
            bold: true,
            underlined: true,
            clickEvent: { action: "run_command", value: "/sins accept" } 
        }
    ]);

    // ==========================================
    // PAGE 7+: UNLOCKED BOSS PAGES (Sleek & Compact)
    // Using a standard, error-free for-loop on the Java list wrapper
    // ==========================================
    if (bosses) {
        for (let i = 0; i < bosses.length; i++) {
            let boss = bosses[i];
            if (progress >= boss.id) {
                rawPages.push([
                    { text: `§0§lJudge ${boss.id}: ${boss.name}§r\n`, bold: true },
                    { text: `${boss.excerpt}\n\n`, color: "gray" },
                    { 
                        text: "[RELIVE MEMORY]", 
                        color: "dark_blue", 
                        bold: true, 
                        underlined: true,
                        clickEvent: { action: "run_command", value: `/sins relive ${boss.id}` } 
                    }
                ]);
            }
        }
    }

    // Convert all raw objects into Minecraft-compliant JSON strings
    let formattedPages = [];
    rawPages.forEach(page => {
        formattedPages.push(sinsGsonInstance.toJson(page));
    });

    // Construct the written book item
    return Item.of('minecraft:written_book', {
        "minecraft:written_book_content": {
            title: "Codex of The Shattered Ego",
            author: "The Void",
            pages: formattedPages
        }
    });
}

// ==========================================
// STARTER BOOK HANDOUT EVENT
// ==========================================
PlayerEvents.loggedIn(event => {
    const player = event.player;
    let data = getSinData(player);
    
    if (!data.getInt('hasStarterBook')) {
        let codex = generateDynamicCodex(player);
        player.give(codex);
        data.putInt('hasStarterBook', 1);
    }
});

// ==========================================
// 7. AUTO-UPDATE BOOK ON RIGHT-CLICK
// ==========================================

ItemEvents.rightClicked('minecraft:written_book', event => {
    let item = event.item;
    let player = event.player;
    
    // Check if the book the player is right-clicking is our custom Codex
    if (item.getHoverName().getString().includes("Codex")) {
        let hand = event.hand;
        
        // Dynamically compile a brand-new book using their absolute newest stats!
        let freshBook = generateDynamicCodex(player);
        
        // Silently swap the book in their hand before the GUI displays
        player.setItemInHand(hand, freshBook);
    }
});


// ==========================================
// ARENA CONFIGURATION (Dimension-Based)
// ==========================================
const ARENA_DIMENSION = 'kubejs:void_arena';
const ARENA_POS = { x: 0, y: 64, z: 0 }; // Clean, centered coordinates

function generateBedrockArena(serverLevel) {
    let radius = 15;
    let height = 8;
    
    // Generate a secure cage at the center of the void dimension
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            let dist = Math.sqrt(x*x + z*z);
            if (dist <= radius) {
                // Floor
                serverLevel.getBlock(ARENA_POS.x + x, ARENA_POS.y, ARENA_POS.z + z).set('minecraft:bedrock');
                // Ceiling
                serverLevel.getBlock(ARENA_POS.x + x, ARENA_POS.y + height, ARENA_POS.z + z).set('minecraft:barrier');
                
                // Outer ring walls
                if (dist > radius - 1) {
                    for (let y = 1; y < height; y++) {
                        serverLevel.getBlock(ARENA_POS.x + x, ARENA_POS.y + y, ARENA_POS.z + z).set('minecraft:bedrock');
                    }
                }
            }
        }
    }
}

// ==========================================
// ENTRANCE INTO PURGATORY (The Summoning)
// ==========================================
function initiateJudgementTrial(player) {
    let data = getSinData(player);
    let progress = parseInt(data.getInt('gauntletProgress')) || 0;
    
    // Read our bosses data
    let parsedJson = JsonIO.read('kubejs/config/bosses.json');
    let bosses = parsedJson ? parsedJson.bosses : [];
    
    if (!bosses || progress >= bosses.length) {
        player.sendSystemMessage(Text.of("§aYour sins have saturated, but the Gauntlet is already complete!§r"));
        data.putInt('score', 0); // Reset score anyway
        return;
    }
    
    let boss = bosses[progress];
    
    // Get the ServerLevel for the custom void dimension
    let server = player.server;
    let voidLevel = server.getLevel(ARENA_DIMENSION);
    
    if (!voidLevel) {
        player.sendSystemMessage(Text.of("§cFatal Error: Void Arena dimension is not loaded! Restart the game.§r"));
        return;
    }
    
    // 1. Build the arena safely inside the void dimension
    generateBedrockArena(voidLevel);
    
    // 2. Save their original position and dimension before entering
    data.putDouble('prevX', player.x);
    data.putDouble('prevY', player.y);
    data.putDouble('prevZ', player.z);
    data.putString('prevDim', player.level.dimension.toString());
    
    // Set our trial state to 'started' to trigger the loading check
    data.putString('trialState', 'started');
    
    // Teleport player to the arena
    player.teleportTo(ARENA_DIMENSION, ARENA_POS.x, ARENA_POS.y + 2, ARENA_POS.z, player.yaw, player.pitch);

    // 3. Teleport the player safely into the center of the bedrock cage in the void dimension
    player.teleportTo(ARENA_DIMENSION, ARENA_POS.x, ARENA_POS.y + 2, ARENA_POS.z, player.yaw, player.pitch);
    
    // 4. Play dramatic effects
    player.sendSystemMessage(Text.of(`§4§lTHE SKY RIPS OPEN...§r`));
    player.sendSystemMessage(Text.of(`§cYou have been dragged into the Void to face §l${boss.name}§r`));
    
    // 5. Reset Sin Score back to 0
    data.putInt('score', 0);
    
    // 6. Spawn the Boss Entity inside the void dimension
    let bossEntity = voidLevel.createEntity(boss.entity);
    if (bossEntity) {
        bossEntity.setPosition(ARENA_POS.x, ARENA_POS.y + 2, ARENA_POS.z + 5);
        
        // Set the visible boss name
        bossEntity.customName = Text.of(boss.name);
        
        // Use Minecraft's native, bulletproof Scoreboard Tags!
        bossEntity.addTag('SinsTrialBoss');
        bossEntity.addTag(`Owner_${player.username}`); // Format: Owner_Username
        
        bossEntity.spawn();
    } else {
        player.sendSystemMessage(Text.of("§cAn error occurred summoning the Boss Entity! Check if the mod is loaded.§r"));
    }
}

// ==========================================
// 8. STATE-MACHINE ARENA MONITOR & VICTORY
// ==========================================

// Global variable to prevent double-triggering victory logic
let victoryProcessing = {};

ServerEvents.tick(event => {
    let server = event.server;
    let voidLevel = server.getLevel('kubejs:void_arena');
    if (!voidLevel) return;

    if (server.tickCount % 10 !== 0) return;

    let entities = voidLevel.getEntities();
    let playersInArena = entities.filter(e => e.isPlayer());
    if (playersInArena.length === 0) return;

    playersInArena.forEach(player => {
        let username = player.username;
        let data = getSinData(player);
        let state = data.getString('trialState') || 'none';
        
        if (state === 'none') return; 
        if (victoryProcessing[username]) return;

        let playerBoss = entities.find(e => {
            return e.isAlive() && 
                   e.getTags().contains('SinsTrialBoss') && 
                   e.getTags().contains(`Owner_${username}`);
        });

        // STATE 1: Boss loading
        if (state === 'started') {
            if (playerBoss) {
                data.putString('trialState', 'engaged');
                player.sendSystemMessage(Text.of("§4§lLET THE TRIAL BEGIN!§r"));
                player.playSound("entity.ender_dragon.growl", 1.0, 0.8);
            }
            return;
        }

        // STATE 2: Actively fighting. On death, trigger the physical drop, NOT teleport!
        if (state === 'engaged') {
            if (!playerBoss) {
                victoryProcessing[username] = true;
                data.putString('trialState', 'victory_pending'); // Transition to manual return state
                executeVictoryDrop(player, voidLevel);
            }
        }
    });
});

// Instead of instantly leaving, we drop a physical key and tell them to return!
function executeVictoryDrop(player, voidLevel) {
    let username = player.username;
    let data = getSinData(player);
    
    // 1. Increment gauntlet progress
    let progress = data.getInt('gauntletProgress') || 0;
    data.putInt('gauntletProgress', progress + 1);
    
    // 2. Victory Cues
    player.sendSystemMessage(Text.of("§6§lVICTORY! Your Judgement has fallen.§r"));
    player.sendSystemMessage(Text.of("§eA Fragment of your Shattered Ego has materialized. Use it or type §b/sins return §eto leave the Void.§r"));
    player.playSound("ui.toast.challenge_complete", 1.0, 1.0);
    
    // 3. Spawn the physical "Return Key" item utilizing modern Data Components
    let keyItem = voidLevel.createEntity('item');
    
    // Define all components inline with safe types (completely error-free for 1.21.1!)
    let itemStack = Item.of('minecraft:nether_star')
        .withCustomName(Text.gold("Fragment of the Shattered Ego").italic(false))
        .withLore([
            Text.darkPurple("A crystalline piece of your soul, vibrating with the energy of").italic(true),
            Text.darkPurple("the Overworld. Right-click to escape the Void.").italic(true)
        ])

    itemStack.setCustomData({
        SinsReturnKey: true
    })

    itemStack.setGlintOverride(true)

    itemStack.setMaxStackSize(1)

    keyItem.setItem(itemStack);
    keyItem.setPosition(ARENA_POS.x, ARENA_POS.y + 1, ARENA_POS.z);
    keyItem.spawn();

    // Release checking lock
    delete victoryProcessing[username];
}

// Helper function to handle victory processing cleanly
function executeVictory(player, voidLevel) {
    let username = player.username;
    let data = getSinData(player);
    
    // 1. Increment gauntlet progress
    let progress = data.getInt('gauntletProgress') || 0;
    data.putInt('gauntletProgress', progress + 1);
    
    // 2. Victory Cues
    player.sendSystemMessage(Text.of("§6§lVICTORY! You have overcome your Judgement.§r"));
    player.playSound("ui.toast.challenge_complete", 1.0, 1.0);
    
    // 3. Teleport back to their exact original position
    let prevX = data.getDouble('prevX') || 0;
    let prevY = data.getDouble('prevY') || 64;
    let prevZ = data.getDouble('prevZ') || 0;
    let prevDim = data.getString('prevDim') || 'minecraft:overworld';
    
    player.teleportTo(prevDim, prevX, prevY, prevZ, player.yaw, player.pitch);
    
    // 4. Clean up stored dimension telemetry
    data.putString('prevDim', ''); 
    
    // 5. Clean up the bedrock arena blocks
    cleanUpBedrockArena(voidLevel);

    // Release victory lock after a short delay
    player.server.scheduleInTicks(40, () => {
        delete victoryProcessing[username];
    });
}

// Player Death Failure Penalty (If they die inside the arena)
EntityEvents.death(event => {
    let entity = event.entity || event.getEntity();
    if (entity && entity.isPlayer()) {
        let player = entity;
        if (player.level.dimension.toString() === 'kubejs:void_arena') {
            let data = getSinData(player);
            
            player.sendSystemMessage(Text.of("§4§lDEFEAT. You failed to face your Judgement. Progression halted.§r"));
            
            // Clean up state and coordinates
            data.putString('trialState', 'none');
            data.putString('prevDim', ''); 
            
            // Clean up the arena
            cleanUpBedrockArena(player.level);
        }
    }
});

// Suppress all loot drops and XP from trial/memory bosses
EntityEvents.drops(event => {
    let entity = event.entity;
    if (entity && entity.getTags() && entity.getTags().contains('SinsTrialBoss')) {
        event.cancel(); // Cancel the event using the correct KubeJS 1.21 method!
    }
});

// Helper to safely replace the arena blocks back to clean air
function cleanUpBedrockArena(level) {
    let radius = 16;
    let height = 9;
    
    for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
            for (let y = 0; y <= height; y++) {
                level.getBlock(ARENA_POS.x + x, ARENA_POS.y + y, ARENA_POS.z + z).set('minecraft:air');
            }
        }
    }
}

// ==========================================
// 9. MANUAL RETURN VIA KEY ITEM OR COMMAND
// ==========================================

ItemEvents.rightClicked('minecraft:nether_star', event => {
    let item = event.item;
    let player = event.player;

    let customData = item.getCustomData();

    // Only allow the Fragment of the Shattered Ego
    if (!customData.contains('SinsReturnKey') || !customData.getBoolean('SinsReturnKey')) {
        return;
    }

    let data = getSinData(player);
    let state = data.getString('trialState') || 'none';

    if (state === 'victory_pending') {
        // Spend the item
        item.shrink(1);

        // Execute the escape
        escapeVoidArena(player);
    }
});

// Master function to handle returning players home safely
function escapeVoidArena(player) {
    let data = getSinData(player);
    let level = player.level;
    
    player.sendSystemMessage(Text.of("§bShattering the fragment... Teleporting back to reality.§r"));
    player.playSound("entity.enderman.teleport", 1.0, 1.0);
    
    // Teleport back to saved dimensions
    let prevX = data.getDouble('prevX') || 0;
    let prevY = data.getDouble('prevY') || 64;
    let prevZ = data.getDouble('prevZ') || 0;
    let prevDim = data.getString('prevDim') || 'minecraft:overworld';
    
    player.teleportTo(prevDim, prevX, prevY, prevZ, player.yaw, player.pitch);
    
    // Reset state & clean telemetry
    data.putString('trialState', 'none');
    data.putString('prevDim', ''); 
    
    // Clean up the arena blocks in the void dimension
    let voidLevel = player.server.getLevel('kubejs:void_arena');
    if (voidLevel) {
        cleanUpBedrockArena(voidLevel);
    }
}