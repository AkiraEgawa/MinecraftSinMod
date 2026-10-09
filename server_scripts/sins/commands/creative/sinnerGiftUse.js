ItemEvents.rightClicked('minecraft:bundle', event => {
    let item = event.item;
    let player = event.player;

    // Grab customData JS object natively
    let customData = item.customData;

    // Verify the sinnerGift tag
    if (!customData || !customData.sinnerGift) {
        return;
    }

    // Spend 1 bundle
    item.shrink(1);

    // ==========================================
    // REWARD ITEM DEFINITIONS
    // ==========================================

    // 1. Enchanter's Sword (Coward's Demise + Flamberge Enchantments)
    let enchantersSword = Item.of(`ars_nouveau:enchanters_sword[unbreakable={},ars_nouveau:spell_caster={spells:{0:{color:{b:180,g:25,id:"ars_nouveau:constant",r:255},name:"Coward's Demise",particleTimeline:{},recipe:["ars_nouveau:glyph_touch","ars_nouveau:glyph_snare","ars_nouveau:glyph_burst","ars_nouveau:glyph_aoe","ars_nouveau:glyph_aoe","ars_nouveau:glyph_sensitive","arsomega:glyph_propagate_self","ars_elemental:glyph_propagator_homing","ars_nouveau:glyph_aoe","ars_nouveau:glyph_aoe","ars_nouveau:glyph_aoe","ars_nouveau:glyph_aoe","ars_nouveau:glyph_aoe","ars_zero:effect_beam","ars_nouveau:glyph_amplify","ars_nouveau:glyph_amplify","ars_nouveau:glyph_amplify","ars_nouveau:glyph_aoe","ars_nouveau:glyph_aoe","ars_nouveau:glyph_aoe","ars_nouveau:glyph_extend_time","ars_nouveau:glyph_extend_time"],sound:{}}}},enchantments={levels:{"minecraft:bane_of_arthropods":10,"minecraft:fire_aspect":10,"minecraft:knockback":2,"minecraft:looting":10,"minecraft:mending":10,"minecraft:sharpness":10,"minecraft:smite":10,"minecraft:sweeping_edge":10,"minecraft:unbreaking":10}}]`);

// 2. Spell Bow (Phantom Storm)
    let spellBow = Item.of(`ars_nouveau:spell_bow[ars_nouveau:spell_caster={spells:{0:{color:{b:180,g:25,id:"ars_nouveau:constant",r:255},name:"Phantom Storm",particleTimeline:{},recipe:["ars_nouveau:glyph_projectile","ars_nouveau:glyph_burst","ars_nouveau:glyph_aoe","ars_nouveau:glyph_aoe","ars_nouveau:glyph_aoe","ars_nouveau:glyph_sensitive","ars_nouveau:glyph_phantom_block","ars_nouveau:glyph_extend_time","ars_nouveau:glyph_lightning","ars_nouveau:glyph_amplify","ars_nouveau:glyph_amplify","ars_nouveau:glyph_delay","ars_nouveau:glyph_extend_time","ars_nouveau:glyph_lightning","ars_nouveau:glyph_amplify","ars_nouveau:glyph_amplify","ars_nouveau:glyph_delay","ars_nouveau:glyph_extend_time","ars_nouveau:glyph_lightning","ars_nouveau:glyph_amplify","ars_nouveau:glyph_amplify"],sound:{}}}},enchantments={levels:{"minecraft:flame":1,"minecraft:infinity":1,"minecraft:mending":1,"minecraft:power":10,"minecraft:punch":2,"minecraft:unbreaking":1}},unbreakable={}]`);

    // 3. Netherite Mage Chestplate
    let mageChestplate = Item.of(`irons_spellbooks:netherite_mage_chestplate[attribute_modifiers=[{amount:20,id:"armor",operation:"add_value",slot:"chest",type:"generic.armor"}],enchantments={levels:{"minecraft:blast_protection":10,"minecraft:fire_protection":10,"minecraft:mending":10,"minecraft:protection":10,"minecraft:projectile_protection":10,"minecraft:thorns":10,"minecraft:unbreaking":10}},irons_spellbooks:spell_container={data:[],maxSpells:1,mustEquip:1b,spellWheel:1b},irons_spellbooks:upgrade_data={slot:"chest",upgrades:{"irons_spellbooks:blood_power":10,"irons_spellbooks:cooldown":10,"irons_spellbooks:evocation_power":10,"irons_spellbooks:mana":500}},unbreakable={}]`);

    // 4. Netherite Mage Helmet
    let mageHelmet = Item.of(`irons_spellbooks:netherite_mage_helmet[attribute_modifiers=[{amount:20,id:"armor",operation:"add_value",slot:"head",type:"generic.armor"}],enchantments={levels:{"minecraft:aqua_affinity":10,"minecraft:blast_protection":10,"minecraft:fire_protection":10,"minecraft:mending":10,"minecraft:projectile_protection":10,"minecraft:protection":10,"minecraft:respiration":10,"minecraft:thorns":10,"minecraft:unbreaking":10}},irons_spellbooks:spell_container={data:[],maxSpells:1,mustEquip:1b,spellWheel:1b},irons_spellbooks:upgrade_data={slot:"head",upgrades:{"irons_spellbooks:blood_power":10,"irons_spellbooks:cooldown":10,"irons_spellbooks:evocation_power":10,"irons_spellbooks:mana":500}},unbreakable={}]`);

    // 5. Netherite Mage Leggings
    let mageLeggings = Item.of(`irons_spellbooks:netherite_mage_leggings[attribute_modifiers=[{amount:20,id:"armor",operation:"add_value",slot:"legs",type:"generic.armor"}],enchantments={levels:{"minecraft:blast_protection":10,"minecraft:fire_protection":10,"minecraft:mending":10,"minecraft:protection":10,"minecraft:projectile_protection":10,"minecraft:swift_sneak":3,"minecraft:thorns":10,"minecraft:unbreaking":10}},irons_spellbooks:spell_container={data:[],maxSpells:1,mustEquip:1b,spellWheel:1b},irons_spellbooks:upgrade_data={slot:"legs",upgrades:{"irons_spellbooks:blood_power":10,"irons_spellbooks:cooldown":10,"irons_spellbooks:evocation_power":10,"irons_spellbooks:mana":500}},unbreakable={}]`);

    // 6. Netherite Mage Boots
    let mageBoots = Item.of(`irons_spellbooks:netherite_mage_boots[attribute_modifiers=[{amount:20,id:"armor",operation:"add_value",slot:"feet",type:"generic.armor"}],enchantments={levels:{"minecraft:blast_protection":10,"minecraft:depth_strider":10,"minecraft:feather_falling":10,"minecraft:fire_protection":10,"minecraft:frost_walker":2,"minecraft:mending":10,"minecraft:projectile_protection":10,"minecraft:protection":10,"minecraft:soul_speed":3,"minecraft:thorns":10,"minecraft:unbreaking":10}},irons_spellbooks:spell_container={data:[],maxSpells:1,mustEquip:1b,spellWheel:1b},irons_spellbooks:upgrade_data={slot:"feet",upgrades:{"irons_spellbooks:blood_power":10,"irons_spellbooks:cooldown":10,"irons_spellbooks:evocation_power":10,"irons_spellbooks:mana":500}},unbreakable={}]`);

    // 7. Cursed Doll Spell Book
    let cursedDollBook = Item.of(`irons_spellbooks:cursed_doll_spell_book[irons_spellbooks:affinity_data={bonuses:{"irons_spellbooks:blood_slash":1,"irons_spellbooks:blood_step":1}},irons_spellbooks:spell_container={data:[{id:"irons_spellbooks:raise_dead",index:0,level:20},{id:"irons_spellbooks:blood_needles",index:1,level:20},{id:"irons_spellbooks:blood_slash",index:2,level:20},{id:"irons_spellbooks:wither_skull",index:3,level:20},{id:"irons_spellbooks:devour",index:4,level:20},{id:"irons_spellbooks:ray_of_siphoning",index:5,level:20},{id:"irons_spellbooks:sacrifice",index:6,level:20},{id:"irons_spellbooks:heartstop",index:7,level:20},{id:"irons_spellbooks:acupuncture",index:8,level:20},{id:"irons_spellbooks:blood_step",index:9,level:20},{id:"irons_spellbooks:spectral_hammer",index:10,level:5}],maxSpells:11,mustEquip:1b,spellWheel:1b},irons_spellbooks:upgrade_data={slot:"spellbook",upgrades:{"irons_spellbooks:blood_power":20,"irons_spellbooks:spell_resistance":20}}]`);

    // 8. Legionnaire Flamberge
    let legionnaireFlamberge = Item.of(`irons_spellbooks:legionnaire_flamberge[unbreakable={},enchantments={levels:{"minecraft:bane_of_arthropods":10,"minecraft:fire_aspect":10,"minecraft:knockback":2,"minecraft:looting":10,"minecraft:sharpness":10,"minecraft:smite":10,"minecraft:sweeping_edge":10,"minecraft:mending":10,"minecraft:unbreaking":10}}]`);

    // 9. Spell Crossbow (Decoy Swarm)
    let spellCrossbow = Item.of(`ars_nouveau:spell_crossbow[ars_nouveau:spell_caster={spells:{0:{color:{b:180,g:25,id:"ars_nouveau:constant",r:255},name:"Decoy Swarm",particleTimeline:{},recipe:["ars_nouveau:glyph_projectile","ars_nouveau:glyph_summon_decoy","ars_nouveau:glyph_orbit","ars_nouveau:glyph_summon_decoy","ars_nouveau:glyph_orbit","ars_nouveau:glyph_summon_decoy","ars_nouveau:glyph_orbit","ars_nouveau:glyph_summon_decoy","ars_nouveau:glyph_orbit","ars_nouveau:glyph_summon_decoy","ars_nouveau:glyph_orbit","ars_nouveau:glyph_lightning","ars_nouveau:glyph_amplify","ars_nouveau:glyph_amplify"],sound:{}}}},enchantments={levels:{"minecraft:infinity":1,"minecraft:mending":1,"minecraft:multishot":1,"minecraft:piercing":4,"minecraft:quick_charge":3,"minecraft:unbreaking":1}},unbreakable={}]`);

    // 10. Merlin's Annotated Codex
    let merlinsCodex = Item.of(`ars_nouveau:annotated_codex[ars_nouveau:codex_data={playerName:"Merlin",uuid:[I;1,2,3,4],glyphIds:["toomanyglyphs:glyph_reverse_direction","ars_nouveau:glyph_invisibility","not_enough_glyphs:glyph_ride","ars_controle:glyph_filter_xnor","ars_elemental:glyph_bubble_shield","ars_nouveau:glyph_summon_wolves","ars_nouveau:glyph_dampen","ars_nouveau:glyph_gravity","ars_elemental:glyph_poison_spores","toomanyglyphs:glyph_filter_item","ars_elemental:glyph_slip_feet","toomanyglyphs:glyph_filter_monster","ars_nouveau:glyph_snare","toomanyglyphs:glyph_ray","ars_zero:effect_conjure_blight","not_enough_glyphs:glyph_propagate_plane","ars_astrologique:glyph_stalwart","ars_nouveau:glyph_conjure_water","ars_nouveau:glyph_pickup","ars_nouveau:glyph_smelt","not_enough_glyphs:glyph_filter_dark","ars_controle:glyph_filter_or","ars_nouveau:glyph_blink","ars_elemental:glyph_nullify_defense","ars_technica:glyph_fuse","ars_nouveau:glyph_glide","ars_zero:temporal_context_form","ars_nouveau:glyph_leap","ars_controle:glyph_filter_not","toomanyglyphs:glyph_filter_player","ars_nouveau:glyph_fangs","ars_nouveau:glyph_exchange","ars_trinkets:glyph_water_spear","not_enough_glyphs:glyph_plow","toomanyglyphs:glyph_chaining","ars_nouveau:glyph_place_block","ars_nouveau:glyph_harvest","ars_elemental:glyph_mist","ars_elemental:glyph_discharge","ars_scalaes:glyph_resize","ars_zero:augment_amplify_two","toomanyglyphs:glyph_filter_entity","ars_additions:glyph_retaliate","ars_elemental:glyph_not_aerial_filter","ars_zero:select_effect","ars_nouveau:glyph_randomize","ars_elemental:glyph_cauterize","arsomega:glyph_advanced_grow","ars_technica:glyph_obliterate","ars_trinkets:glyph_red_lightning","ars_nouveau:glyph_rune","not_enough_glyphs:glyph_trail","ars_nouveau:glyph_wind_shear","ars_nouveau:glyph_slowfall","ars_nouveau:glyph_delay","ars_elemental:glyph_propagator_arc","ars_zero:effect_beam","ars_nouveau:glyph_hex","not_enough_glyphs:glyph_contingency_fall","ars_zero:push_effect","ars_elemental:glyph_phantom_grasp","ars_elemental:glyph_oxidize","ars_astrologique:glyph_bless","ars_elemental:glyph_spike","ars_astrologique:glyph_invigorate","ars_elemental:glyph_summon_slime","arsomega:glyph_propagate_missile","arsomega:glyph_overhead","ars_technica:glyph_apply","ars_additions:glyph_mark","ars_zero:discard_effect","ars_nouveau:glyph_crush","ars_technica:glyph_polish","ars_nouveau:glyph_lightning","ars_elemental:glyph_homing_projectile","arsomega:glyph_flatten","ars_nouveau:reset","ars_nouveau:glyph_animate_block","arsomega:glyph_propagate_overhead","ars_nouveau:glyph_bounce","ars_zero:conjure_voxel_effect","ars_zero:effect_convergence","ars_zero:augment_sphere","ars_zero:augment_aoe_two","ars_trinkets:glyph_soul_inspector","ars_nouveau:glyph_sensitive","ars_nouveau:glyph_redstone_signal","ars_elemental:glyph_undead_filter","ars_zero:sustain_effect","ars_nouveau:glyph_prestidigitation","ars_elemental:glyph_fiery_filter","ars_elemental:glyph_arc_projectile","ars_trinkets:glyph_sun_flare","toomanyglyphs:glyph_filter_animal","not_enough_glyphs:glyph_contingency_blink","ars_technica:glyph_insert","ars_nouveau:glyph_summon_vex","ars_elemental:glyph_cavitate","ars_technica:glyph_telefeast","ars_nouveau:glyph_orbit","arsomega:glyph_propagate_self","ars_nouveau:glyph_accelerate","ars_technica:glyph_superheat","ars_elemental:glyph_aquatic_filter","ars_nouveau:glyph_burst","ars_technica:glyph_whirl","not_enough_glyphs:glyph_filter_light","ars_elemental:glyph_conflagrate","not_enough_glyphs:glyph_contingency_heal","toomanyglyphs:glyph_filter_block","ars_elemental:glyph_not_fiery_filter","ars_nouveau:glyph_sense_magic","ars_nouveau:glyph_bubble","ars_nouveau:glyph_pierce","ars_technica:glyph_press","ars_zero:anchor_effect","ars_nouveau:glyph_underfoot","ars_nouveau:glyph_dispel","ars_elemental:glyph_propagator_homing","ars_nouveau:glyph_phantom_block","ars_nouveau:glyph_fortune","ars_zero:augment_aoe_three","ars_nouveau:glyph_cut","ars_elemental:glyph_life_link","ars_nouveau:glyph_name","ars_nouveau:glyph_split","ars_zero:augment_cube","ars_elemental:glyph_not_aquatic_filter","ars_trinkets:glyph_bullet","toomanyglyphs:glyph_filter_living","ars_nouveau:glyph_rotate","ars_controle:glyph_filter_random","ars_nouveau:rewind","ars_nouveau:glyph_ignite","not_enough_glyphs:glyph_contingency_fire","toomanyglyphs:glyph_filter_is_mature","ars_nouveau:glyph_fell","ars_nouveau:glyph_intangible","ars_nouveau:glyph_ender_inventory","ars_nouveau:glyph_interact","ars_elemental:glyph_charm","ars_elemental:glyph_geyser","ars_astrologique:glyph_false_life","ars_controle:glyph_filter_below","ars_controle:glyph_precise_delay","starbunclemania:glyph_pickup_fluid","ars_elemental:glyph_not_summon_filter","ars_elemental:glyph_not_insect_filter","ars_elemental:glyph_watery_grave","ars_nouveau:glyph_freeze","ars_nouveau:glyph_pantomime","ars_nouveau:glyph_summon_steed","ars_zero:effect_geometrize","ars_elemental:glyph_insect_filter","not_enough_glyphs:glyph_feed","toomanyglyphs:glyph_filter_living_not_player","ars_nouveau:glyph_aoe","ars_elemental:glyph_conjure_terrain","ars_trinkets:glyph_sword","ars_astrologique:glyph_empower","ars_nouveau:glyph_summon_undead","ars_elemental:glyph_summon_bee","ars_nouveau:glyph_pull","ars_technica:glyph_pack","ars_nouveau:glyph_extract","ars_nouveau:glyph_cold_snap","ars_nouveau:glyph_summon_decoy","starbunclemania:glyph_place_fluid","ars_technica:glyph_carve","ars_nouveau:glyph_light","ars_zero:zero_gravity_effect","ars_elemental:glyph_not_undead_filter","ars_nouveau:glyph_toss","ars_nouveau:glyph_wither","ars_nouveau:glyph_grow","arsomega:glyph_propagate_underfoot","ars_elemental:glyph_envenom","arsomega:glyph_missile","ars_nouveau:glyph_firework","ars_controle:glyph_filter_level","ars_nouveau:wololo","ars_zero:augment_hollow","ars_nouveau:glyph_evaporate","not_enough_glyphs:glyph_contingency_time","ars_elemental:glyph_water_jet","ars_nouveau:glyph_launch","toomanyglyphs:glyph_filter_is_baby","not_enough_glyphs:glyph_momentum","ars_zero:near_form","ars_nouveau:glyph_amplify","ars_nouveau:glyph_heal","ars_elemental:glyph_spark","ars_nouveau:glyph_duration_down","not_enough_glyphs:glyph_contingency_health","ars_nouveau:glyph_gust","ars_zero:augment_amplify_three","ars_nouveau:glyph_wind_burst","ars_trinkets:glyph_aura","ars_controle:glyph_filter_above","ars_nouveau:glyph_wall","ars_additions:glyph_recall","ars_controle:glyph_filter_xor","ars_nouveau:glyph_decelerate","ars_nouveau:glyph_extend_time","arsomega:glyph_propagate_projectile","ars_nouveau:glyph_flare","ars_elemental:glyph_summon_filter","ars_nouveau:glyph_explosion","ars_elemental:glyph_aerial_filter","ars_elemental:glyph_rage","ars_nouveau:glyph_craft","ars_trinkets:glyph_filter_not_self","not_enough_glyphs:glyph_contingency_death","ars_nouveau:glyph_infuse","toomanyglyphs:glyph_filter_living_not_monster","ars_nouveau:glyph_linger","ars_astrologique:glyph_alacrity","ars_trinkets:glyph_filter_self","ars_zero:augment_flatten"]}]`);

    // 11. Hellrazor Scythe (Unbreakable, Level 10 Raise Hell, Reactive Caster)
    let hellrazorScythe = Item.of(`irons_spellbooks:hellrazor[unbreakable={},irons_spellbooks:spell_container={data:[{id:"irons_spellbooks:raise_hell",index:0,level:10,locked:1b}],maxSpells:1,mustEquip:0b,spellWheel:1b},ars_nouveau:reactive_caster={spells:{0:{color:{b:180,g:25,id:"ars_nouveau:constant",r:255},name:"",particleTimeline:{},recipe:["ars_nouveau:glyph_touch","ars_nouveau:glyph_snare","ars_nouveau:glyph_fangs","ars_nouveau:glyph_amplify","ars_nouveau:glyph_amplify","ars_nouveau:glyph_accelerate","ars_nouveau:glyph_lightning","ars_nouveau:glyph_amplify","ars_nouveau:glyph_amplify","ars_nouveau:glyph_extend_time"],sound:{}}}},enchantments={levels:{"ars_nouveau:reactive":4,"minecraft:bane_of_arthropods":1,"minecraft:fire_aspect":10,"minecraft:knockback":2,"minecraft:looting":10,"minecraft:mending":10,"minecraft:sharpness":10,"minecraft:smite":10,"minecraft:sweeping_edge":10,"minecraft:unbreaking":10}}]`);

    let drygmyCharms = Item.of('ars_nouveau:drygmy_charm', 40);

    // 13. 20x Starbuncle Charms
    let starbuncleCharms = Item.of('ars_nouveau:starbuncle_charm', 20);

    // 14. 64x Lapis Lazuli Blocks
    let lapisBlocks = Item.of('minecraft:lapis_block', 64);


    // 15. Pickaxe - Nature's Bounty (Silk Touch)
    let naturesBounty = Item.of('minecraft:netherite_pickaxe[custom_name=\'{"text":"Nature\\\'s Bounty"}\',unbreakable={},enchantments={levels:{"minecraft:efficiency":10,"minecraft:mending":10,"minecraft:silk_touch":10,"minecraft:unbreaking":10}}]');

    // 16. Pickaxe - Nature's Touch (Fortune X)
    let naturesTouch = Item.of('minecraft:netherite_pickaxe[custom_name=\'{"text":"Nature\\\'s Touch"}\',unbreakable={},enchantments={levels:{"minecraft:efficiency":10,"minecraft:fortune":10,"minecraft:mending":10,"minecraft:unbreaking":10}}]');

    // 17. Axe - Axecutioner
    let axecutionerAxe = Item.of('minecraft:netherite_axe[custom_name=\'{"text":"Axecutioner"}\',unbreakable={},enchantments={levels:{"minecraft:bane_of_arthropods":10,"minecraft:efficiency":10,"minecraft:fortune":10,"minecraft:mending":10,"minecraft:sharpness":10,"minecraft:smite":10,"minecraft:unbreaking":10}}]');

    // 18. Shovel - Axecutioner
    let terraformer = Item.of('minecraft:netherite_shovel[custom_name=\'{"text":"Terraformer"}\',unbreakable={},enchantments={levels:{"minecraft:efficiency":10,"minecraft:fortune":10,"minecraft:mending":10,"minecraft:unbreaking":10}}]');

    // 19. Sword - Bug Slayer
    let bugSlayer = Item.of('minecraft:netherite_sword[custom_name=\'{"text":"Bug Slayer"}\',unbreakable={},enchantments={levels:{"minecraft:bane_of_arthropods":10,"minecraft:looting":10,"minecraft:mending":10,"minecraft:sharpness":10,"minecraft:smite":10,"minecraft:sweeping_edge":10,"minecraft:unbreaking":10}}]');

    // ==========================================
    // REWARD DISTRIBUTION
    // ==========================================

    let rewards = [
        enchantersSword,
        spellBow,
        mageChestplate,
        mageHelmet,
        mageLeggings,
        mageBoots,
        cursedDollBook,
        legionnaireFlamberge,
        spellCrossbow,
        merlinsCodex,
        hellrazorScythe,
        drygmyCharms,
        starbuncleCharms,
        lapisBlocks,
        naturesBounty,
        naturesTouch,
        axecutionerAxe,
        terraformer,
        bugSlayer
    ];

    rewards.forEach(rewardStack => {
        player.give(rewardStack);
    });

    // Audio & Chat Feedback
    player.playSound('entity.player.levelup', 1.0, 1.0);
    player.tell(Text.darkRed('The Sinner\'s Gift unleashes forbidden magical arsenal upon you!'));

    // Prevent bundle GUI from opening
    player.swing(event.hand, true);
    event.cancel();
});