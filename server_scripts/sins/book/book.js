// server_scripts/sins/book/book.js

// Load Gson globally once at the very top of your script
const SinsGsonClass = Java.loadClass('com.google.gson.Gson');
const sinsGsonInstance = new SinsGsonClass();

// Helper to build a visually perfect progression track bar
function getProgressTrackString(progressCount) {
    let bar = "";
    for (let i = 0; i < 14; i++) {
        bar += (i < progressCount) ? "▮" : "▯";
    }
    return `[ ${bar} ]`;
}

function generateDynamicCodex(player) {
    // 1. Fetch exact player state through your SinState API
    let state = SinState.get(player);
    
    // Read sins and level (defaulting cleanly if state is empty)
    let currentSins = Math.round(state.sins || 0);
    let progress = state.level || 0;

    // Grab current level threshold dynamically for the max value
    let thresholds = SinState.getThresholds();
    let targetThreshold = thresholds[progress] !== undefined 
        ? thresholds[progress] 
        : thresholds[thresholds.length - 1];

    // --- SAFE KUBEJS FILE READING ---
    let bosses = [];
    let codexConfig = null;

    try {
        let bossJson = JsonIO.read('kubejs/config/bosses.json');
        if (bossJson && bossJson.bosses) {
            bosses = bossJson.bosses;
        } else {
            console.error("[SINS] Could not find or parse 'kubejs/config/bosses.json'");
        }

        codexConfig = JsonIO.read('kubejs/config/codex_text.json');
        if (!codexConfig) {
            console.error("[SINS] Could not find or parse 'kubejs/config/codex_text.json'");
        }
    } catch (e) {
        console.error("[SINS] Error reading configuration files: " + e);
    }

    let info = codexConfig ? codexConfig.bookInfo : { title: "Codex of The Shattered Ego", author: "The Void" };
    let text = codexConfig ? codexConfig.staticPages : {};

    // Calculate next Judge
    let nextJudgeName = "None (Gauntlet Completed!)";
    
    // Convert 1-based level (Level 6 = Trial 6) to 0-based array index (Index 5 = Boss ID 6)
    let currentBossIndex = progress;

    if (bosses && bosses.length > 0 && currentBossIndex < bosses.length) {
        let nextBoss = bosses[currentBossIndex];
        nextJudgeName = `${nextBoss.name} (Trial ${nextBoss.id})`;
    } else if (!bosses || bosses.length === 0) {
        nextJudgeName = "Error: bosses.json missing/empty";
    }

    let rawPages = [];

    // ==========================================
    // PAGE 1: Dynamic Progression Track / Corrupted Page
    // ==========================================
    let currentStage = state.trialStage || state.status || "Idle";

    if (currentStage === "Pending" || currentStage === "Chased") {
        // Corrupted "FACE YOUR SINS" Interactive Page
        rawPages.push([
            // Vertical centering (push down 3 lines)
            { text: "\n\n\n" },
            
            // Top border of corrupted glyphs
            { text: "  ", bold: true },
            { text: "░▒▓█▓▒░▒▓█▓▒░", color: "dark_red", obfuscated: true },
            { text: "\n\n" },

            // Center row: Clickable blood-red title triggering /sins accept
            { text: "   " }, // Left margin padding
            { text: "§kXX§r ", color: "dark_red" },
            { 
                text: "FACE YOUR SINS", 
                color: "dark_red", 
                bold: true,
                underlined: true,
                clickEvent: { action: "run_command", value: "/sins accept" }
            },
            { text: " §kXX§r\n\n", color: "dark_red" },

            // Bottom border of corrupted glyphs
            { text: "  ", bold: true },
            { text: "░▒▓█▓▒░▒▓█▓▒░", color: "dark_red", obfuscated: true },

            // Subtle interactive prompt
            { text: "\n\n" },
            { text: "     [ CLICK TO ENTER ]", color: "gray", italic: true }
        ]);
    } else {
        // Standard Progression Track Page
        rawPages.push([
            { text: "================\n   PROGRESSION TRACK\n================\n\n", bold: true },
            { text: `Current Sin Level: [ ${currentSins} / ${targetThreshold} ]\n\n` },
            { text: "Gauntlet Progress:\n" },
            { text: `${getProgressTrackString(progress)}\n\n`, color: "dark_red" },
            { text: "Next Judge:\n", bold: true },
            { text: `${nextJudgeName}\n\n`, color: "red" }
        ]);
    }

    // ==========================================
    // PAGE 2: INDEX OF THE VOID (Table of Contents)
    // ==========================================
    let indexComponents = [];
    if (codexConfig && codexConfig.index) {
        indexComponents.push({ text: codexConfig.index.header });

        codexConfig.index.chapters.forEach(ch => {
            if (ch.lockedTitle && progress === 0) {
                indexComponents.push({ text: ch.lockedTitle });
            } else {
                indexComponents.push({
                    text: ch.title,
                    // FIX: change_page value MUST be a string representation of the page number in 1.21
                    clickEvent: { action: "change_page", value: String(ch.targetPage) }
                });
            }
        });
    } else {
        indexComponents.push({ text: "§0§lINDEX OF THE VOID§r\n\n(Error loading index config)" });
    }
    rawPages.push(indexComponents);

    // ==========================================
    // PAGE 3: Lore
    // ==========================================
    rawPages.push({ text: text.lore || "" });

    // ==========================================
    // PAGES 4 & 5: Gauntlet Rules
    // ==========================================
    rawPages.push({ text: text.rulesPart1 || "" });
    rawPages.push({ text: text.rulesPart2 || "" });

    // ==========================================
    // PAGE 6: Call to Judgement (Accept Challenge Page)
    // ==========================================
    let callConfig = codexConfig ? codexConfig.callToJudgement : {};
    rawPages.push([
        { text: callConfig.flavorText || "" },
        { 
            text: callConfig.buttonText || "[ACCEPT JUDGEMENT]", 
            color: "dark_red", 
            bold: true,
            underlined: true,
            clickEvent: { action: "run_command", value: callConfig.command || "/sins accept" } 
        }
    ]);

    // ==========================================
    // PAGE 7+: UNLOCKED BOSS PAGES (From bosses.json)
    // ==========================================
    if (bosses) {
        for (let i = 0; i < bosses.length; i++) {
            let boss = bosses[i];
            
            // Unlocks lore pages for defeated bosses
            if (progress >= boss.id) {
                // Page 1 gets ~150 chars (leaves room for header), continuation gets ~200 chars
                let fullText = boss.excerpt || "";
                
                // First pass: capture the first chunk for Page 1 with header space
                let words = fullText.trim().split(/\s+/);
                let firstPageWords = [];
                let remainingWords = [];
                let len = 0;
                
                for (let w of words) {
                    if (len + w.length + 1 <= 180 && remainingWords.length === 0) {
                        firstPageWords.push(w);
                        len += w.length + 1;
                    } else {
                        remainingWords.push(w);
                    }
                }

                let excerptPages = [firstPageWords.join(' ')];
                if (remainingWords.length > 0) {
                    let continuationText = remainingWords.join(' ');
                    let extraPages = paginateText(continuationText, 200);
                    excerptPages = excerptPages.concat(extraPages);
                }

                excerptPages.forEach((chunk, pageIndex) => {
                    let pageComponents = [];

                    if (pageIndex === 0) {
                        pageComponents.push({ text: `§0§lJudge ${boss.id}: ${boss.name}§r\n`, bold: true });
                    } else {
                        pageComponents.push({ text: `§0§lJudge ${boss.id} (Cont.)§r\n`, bold: true });
                    }

                    pageComponents.push({ text: `${chunk}\n\n`, color: "gray" });

                    // Add button on the final page of this boss's entry
                    if (pageIndex === excerptPages.length - 1) {
                        pageComponents.push({ 
                            text: "[RELIVE MEMORY]", 
                            color: "dark_blue", 
                            bold: true, 
                            underlined: true,
                            clickEvent: { action: "run_command", value: `/sins relive ${boss.id}` } 
                        });
                    }

                    rawPages.push(pageComponents);
                });
            }
        }
    }

    // FIX: Each page string inside written_book_content.pages MUST be wrapped as Filterable { raw: "..." }
    let formattedPages = [];
    rawPages.forEach(page => {
        let jsonString = sinsGsonInstance.toJson(page);
        formattedPages.push({ raw: jsonString });
    });

    // At the bottom of generateDynamicCodex(player) inside server_scripts/sins/book/book.js:

    return Item.of('minecraft:written_book', {
        "minecraft:written_book_content": {
            title: { raw: info.title || "Codex of The Shattered Ego" },
            author: info.author || "The Void",
            pages: formattedPages
        },
        "minecraft:custom_data": {
            is_sins_codex: true
        }
    });
}

// ==========================================
// 7. AUTO-UPDATE BOOK ON RIGHT-CLICK
// ==========================================

ItemEvents.rightClicked('minecraft:written_book', event => {
    let item = event.item;
    let player = event.player;
    
    // Check if the book's display name contains "Codex"
    let itemName = item.hoverName ? item.hoverName.string : "";
    
    if (itemName.includes("Codex")) {
        let hand = event.hand;
        
        // Dynamically compile a brand-new book using their absolute newest stats!
        let freshBook = generateDynamicCodex(player);
        
        // Silently swap the book in their hand before the GUI displays
        player.setHeldItem(hand, freshBook);
    }
});

/**
 * Accurately splits long lore text into page-sized chunks without dropping words.
 * @param {string} text 
 * @param {number} maxCharsPerPage Defaults to 180 for standard book margins.
 * @returns {string[]}
 */
function paginateText(text, maxCharsPerPage) {
    if (!text) return [];
    let limit = maxCharsPerPage || 180;
    
    let words = text.trim().split(/\s+/);
    let pages = [];
    let currentWords = [];
    let currentLength = 0;

    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        // Account for space length when joining words
        let addedLength = (currentWords.length > 0 ? 1 : 0) + word.length;

        if (currentLength + addedLength > limit && currentWords.length > 0) {
            // Push completed page and start fresh window with the current word
            pages.push(currentWords.join(' '));
            currentWords = [word];
            currentLength = word.length;
        } else {
            currentWords.push(word);
            currentLength += addedLength;
        }
    }

    if (currentWords.length > 0) {
        pages.push(currentWords.join(' '));
    }

    return pages;
}