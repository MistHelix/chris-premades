import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function early({trigger: {roll, entity: effect}}) {
    if (roll.data.details.cr != null){
        return;
    }
    if (effect.system.uses.value <= 0) return;
    let tokens = game.scenes.active.tokens.filter(actor => actor.name == effect.actor.name);
    let token = tokens[0];
    let testers = canvas.tokens.ownedTokens.filter(test => test.name == effect.actor.name);
    let test = testers[0];
    if (tokenUtils.getDistance(roll.data.token, token, {wallsBlock: true}) > 30) return;
    if (actorUtils.hasUsedReaction(test.actor)) return;
    if (tokenUtils.canSee(token, roll.data.token)) return;


    let mod = effect.actor.system.abilities.int.mod;
    let finalmod = '+' + effect.actor.system.abilities.int.mod.toString();

    const owner = game.users.find(u => u.name == "Kelton");
    const userId = owner?.id;
    if (roll.options.targetValue != null){
        let target = roll.options.targetValue;
        if (roll._total > target){
            return;
        }
        if(roll._total + mod < target){
            return;
        }
        let output = await dialogUtils.confirm(roll.data.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: effect.name, rollTotal: roll.total}), {userId: userId});

        if (output){
            await workflowUtils.completeItemUse(effect, {consumeUsage: true}, {configureDialog: false});
            return await rollUtils.addToRoll(roll, finalmod);

        }
    }
    let output = await dialogUtils.confirm(roll.data.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: effect.name, rollTotal: roll.total}), {userId: userId});
    if (output){
        await workflowUtils.completeItemUse(effect, {consumeUsage: true}, {configureDialog: false});
        return await rollUtils.addToRoll(roll, finalmod);
    }
    return;
}


export let flashofGenius = {
    name: 'Flash of Genius',
    version: '0.12.37',
    save: [
        {
            pass: 'sceneBonus',
            macro: early,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'sceneBonus',
            macro: early,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'sceneBonus',
            macro: early,
            priority: 50
        }
    ]

};