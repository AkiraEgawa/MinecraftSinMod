// KubeJS Server Script - Adding items to tags

ServerEvents.tags('item', event => {
    // Add Ars Nouveau items to vanilla & common tags
    event.add('minecraft:bows', 'ars_nouveau:spell_bow')
    event.add('minecraft:bow', 'ars_nouveau:spell_bow')
    event.add('c:tools/bows', 'ars_nouveau:spell_bow')

    event.add('minecraft:crossbow', 'ars_nouveau:spell_crossbow')
    event.add('minecraft:crossbows', 'ars_nouveau:spell_crossbow')
    event.add('c:tools/crossbows', 'ars_nouveau:spell_crossbow')
})