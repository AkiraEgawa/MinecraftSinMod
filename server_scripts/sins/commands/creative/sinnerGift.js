ServerEvents.recipes(event => {
    event.custom({
        type: 'minecraft:crafting_shaped',
        pattern: [
            'SGS',
            'GBG',
            'SGS'
        ],
        key: {
            'B': { item: 'minecraft:bundle' },
            'G': { item: 'minecraft:gold_ingot' },
            'S': { item: 'minecraft:string' }
        },
        result: {
            id: 'minecraft:bundle',
            count: 1,
            components: {
                // Sets the custom item name
                'minecraft:custom_name': '"Sinner\'s Gift"',
                
                // Sets the lore with formatting
                'minecraft:lore': [
                    '{"bold":true,"color":"dark_red","italic":true,"text":"Right click this for the gear of sinners"}'
                ],
                
                // This replaces the old raw NBT tag tracking
                'minecraft:custom_data': {
                    sinnerGift: true
                }
            }
        }
    }).id('kubejs:sinners_gift_bundle');
});

RecipeViewerEvents.removeEntries('item', event => {
	event.remove('minecraft:bundle')
})