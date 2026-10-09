// KubeJS 1.21.1 (NeoForge) Server Script

function createCustomBow() {
    return Item.of('minecraft:bow', {
        'minecraft:enchantments': {
            levels: {
                'minecraft:flame': 10,
                'minecraft:power': 10,
                'minecraft:punch': 10,
                'minecraft:piercing': 10,
                'minecraft:infinity': 10,
                'minecraft:mending': 10,
                'minecraft:unbreaking': 10
            }
        }
    })
}

function createCustomCrossbow() {
    return Item.of('minecraft:crossbow', {
        'minecraft:enchantments': {
            levels: {
                'minecraft:flame': 10,
                'minecraft:power': 10,
                'minecraft:punch': 10,
                'minecraft:multishot': 10,
                'minecraft:piercing': 10,
                'minecraft:infinity': 10,
                'minecraft:mending': 10,
                'minecraft:unbreaking': 10
            }
        }
    })
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event

    event.register(
        Commands.literal('testDoppel')
            .requires(src => src.hasPermission(2))
            .then(
                Commands.argument('target', Arguments.PLAYER.create(event))
                    .executes(ctx => {
                        try {
                            let testDoppelPlayer = Arguments.PLAYER.getResult(ctx, 'target')
                            let targetName = testDoppelPlayer.getScoreboardName()
                            
                            spawnDoppelganger(testDoppelPlayer, targetName)
                        } catch (err) {
                            console.error(`[testDoppel Error] ${err}`)
                        }
                        return 1
                    })
            )
    )
})

function spawnDoppelganger(testDoppelPlayer, targetName) {
    let foundWeapon = null
    const inv = testDoppelPlayer.inventory

    // Priority check: Bow/Crossbow -> Sword
    foundWeapon = findFirstMatching(inv, stack => isRangedWeapon(stack))
    if (!foundWeapon) {
        foundWeapon = findFirstMatching(inv, stack => isSword(stack))
    }

    const isRanged = foundWeapon && isRangedWeapon(foundWeapon);

    // Override any detected ranged weapon to use custom bow
    if (isRanged) {
        foundWeapon = createCustomBow()
    }

    // Create entity
    const level = testDoppelPlayer.level
    const doppel = level.createEntity('playermob:player_mob')
    doppel.setPosition(testDoppelPlayer.x, testDoppelPlayer.y, testDoppelPlayer.z)

    // Tag entity so the tick listener tracks it and link its target player's name
    doppel.addTag('doppelganger')
    doppel.persistentData.putString('TargetPlayer', targetName)

    // Equip Weapon
    if (foundWeapon) {
        doppel.setMainHandItem(foundWeapon.copy())
    }

    // Equip Armor
    const head = testDoppelPlayer.getEquipment('head')
    const chest = testDoppelPlayer.getEquipment('chest')
    const legs = testDoppelPlayer.getEquipment('legs')
    const feet = testDoppelPlayer.getEquipment('feet')

    if (!head.empty) doppel.setHeadArmorItem(head.copy())
    if (!chest.empty) doppel.setChestArmorItem(chest.copy())
    if (!legs.empty) doppel.setLegsArmorItem(legs.copy())
    if (!feet.empty) doppel.setFeetArmorItem(feet.copy())

    const EquipmentSlot = Java.loadClass('net.minecraft.world.entity.EquipmentSlot')
    
    doppel.setDropChance(EquipmentSlot.MAINHAND, 0.0)
    doppel.setDropChance(EquipmentSlot.OFFHAND, 0.0)
    doppel.setDropChance(EquipmentSlot.HEAD, 0.0)
    doppel.setDropChance(EquipmentSlot.CHEST, 0.0)
    doppel.setDropChance(EquipmentSlot.LEGS, 0.0)
    doppel.setDropChance(EquipmentSlot.FEET, 0.0)

    // 1. Spawn into world
    doppel.spawn()

    // 2. Build NBT payload
    let nbtPayload = {
        SkinPlayerName: targetName,
        CustomName: `"${targetName}"`,
        Friendliness: -100,
        FightFlight: 100,
        PersistenceRequired: true,
        OrderInterruptible: false,
        ForcedTarget: true,
        Hostile: true
    };

    if (isRanged) {
        nbtPayload.Inventory = [
            {
                id: "minecraft:arrow",
                count: 64,
                Slot: 0
            },
            {
                id: "minecraft:firework_rocket",
                count: 64,
                Slot: 1,
                components: {
                    "minecraft:fireworks": {
                        flight_duration: 2,
                        explosions: [
                            { shape: "burst", has_twinkle: true, has_trail: true, colors: [0], fade_colors: [8914952] },
                            { shape: "small_ball", has_twinkle: true, has_trail: true, colors: [0], fade_colors: [8914952] },
                            { shape: "large_ball", has_twinkle: true, has_trail: true, colors: [0], fade_colors: [8914952] },
                            { shape: "star", has_twinkle: true, has_trail: true, colors: [16777215], fade_colors: [16777215] },
                            { shape: "creeper", has_twinkle: true, has_trail: true, colors: [16777215], fade_colors: [8914952] },
                            { shape: "star", colors: [2303] },
                            { shape: "star", colors: [16777006] }
                        ]
                    }
                }
            }
        ];
    }

    // 3. Merge NBT
    doppel.mergeNbt(nbtPayload);

    // 4. Issue persistent attack order
    const server = testDoppelPlayer.server
    const mobUUID = doppel.uuid.toString()
    server.runCommandSilent(`playermob order ${mobUUID} attack ${targetName} forever`)
}

// Tick event for dynamic distance check and weapon switching
LevelEvents.tick(event => {
    const level = event.level
    // Throttle checks to run every 10 ticks (~0.5 seconds)
    if (level.isClientSide() || level.getTime() % 10 !== 0) return

    const server = level.server
    // FIX: Use e.tags.contains() instead of e.hasTag() for entity tags
    const doppels = level.getEntities().filter(e => e.type === 'playermob:player_mob' && e.tags.contains('doppelganger'))

    doppels.forEach(doppel => {
        const targetName = doppel.persistentData.getString('TargetPlayer')
        if (!targetName) return

        const player = server.getPlayerList().getPlayerByName(targetName)
        if (!player || player.level !== level) return

        // Calculate squared distance (10 blocks = 100 squared)
        const distSqr = doppel.distanceToSqr(player)
        const inv = player.inventory

        let sword = findFirstMatching(inv, stack => isSword(stack))
        let rangedWeapon = findFirstMatching(inv, stack => isRangedWeapon(stack))

        // Convert any detected ranged weapon to custom bow
        /*
        if (rangedWeapon) {
            rangedWeapon = createCustomBow()
        }
        */

        let currentWeapon = doppel.getMainHandItem()

        if (distSqr <= 25) {
            // Within 10 blocks: Use Sword if available
            if (sword && currentWeapon.id !== sword.id) {
                doppel.setMainHandItem(sword.copy())
            }
        } else {
            // Further than 10 blocks: Swap to custom Bow
            if (rangedWeapon && currentWeapon.id !== rangedWeapon.id) {
                doppel.setMainHandItem(rangedWeapon.copy())

                // Re-inject arrows/fireworks when swapping back to ranged
                doppel.mergeNbt({
                    Inventory: [
                        {
                            id: "minecraft:arrow",
                            count: 64,
                            Slot: 0
                        },
                        {
                            id: "minecraft:firework_rocket",
                            count: 64,
                            Slot: 1,
                            components: {
                                "minecraft:fireworks": {
                                    flight_duration: 2,
                                    explosions: [
                                        { shape: "burst", has_twinkle: true, has_trail: true, colors: [0], fade_colors: [8914952] },
                                        { shape: "small_ball", has_twinkle: true, has_trail: true, colors: [0], fade_colors: [8914952] },
                                        { shape: "large_ball", has_twinkle: true, has_trail: true, colors: [0], fade_colors: [8914952] },
                                        { shape: "star", has_twinkle: true, has_trail: true, colors: [16777215], fade_colors: [16777215] },
                                        { shape: "creeper", has_twinkle: true, has_trail: true, colors: [16777215], fade_colors: [8914952] },
                                        { shape: "star", colors: [2303] },
                                        { shape: "star", colors: [16777006] }
                                    ]
                                }
                            }
                        }
                    ]
                })
            }
        }
    })
})

function findFirstMatching(inventory, predicate) {
    for (let i = 0; i < inventory.containerSize; i++) {
        let stack = inventory.getItem(i)
        if (!stack.empty && predicate(stack)) {
            return stack
        }
    }
    return null
}

function isSword(stack) {
    return stack.id.endsWith('_sword') || stack.hasTag('c:tools/swords') || stack.hasTag('minecraft:swords')
}

function isBow(stack) {
    return stack.id === 'minecraft:bow' || stack.hasTag('c:tools/bows') || stack.hasTag('minecraft:bows')
}

function isCrossbow(stack) {
    return stack.id === 'minecraft:crossbow' || stack.hasTag('c:tools/crossbows') || stack.hasTag('minecraft:crossbows')
}

function isRangedWeapon(stack) {
    return isBow(stack) || isCrossbow(stack) || stack.id === 'ars_nouveau:spell_bow' || stack.id === 'ars_nouveau:spell_crossbow'
}

EntityEvents.drops(event => {
    const entity = event.entity
    
    // Safety check for the specific mob and tag
    if (entity && entity.type === 'playermob:player_mob' && entity.tags.contains('doppelganger')) {
        event.drops.clear()
    }
})