import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function early({trigger: {roll, entity: effect}}) {
    if (roll.data.details.cr != null){
        return;
    }

    let actors = game.scenes.active.tokens.filter(actor => actor.name == effect.actor.name);
    let actor = actors[0];
    if (tokenUtils.getDistance(roll.data.token, actor, {wallsBlock: true}) > 30) return;
    // if (actorUtils.hasUsedReaction(actor)) return;
    console.log(actor.token);
    console.log(tokenUtils.canSee(actor.token, roll.data.token));
    // if (!tokenUtils.canSee(actor.token, roll.data.token)) return;

    let mod = effect.actor.system.abilities.int.mod;
    let finalmod = '+' + effect.actor.system.abilities.int.mod.toString();

    if (roll.options.targetValue != null){
        let target = roll.options.targetValue;
        if (roll._total > target){
            return;
        }
        if(roll._total + mod < target){
            return;
        }
        let output = await dialogUtils.confirm(roll.data.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: effect.name, rollTotal: roll.total}));

        if (output){
            await workflowUtils.completeItemUse(effect, {consumeUsage: true}, {configureDialog: false});
            return await rollUtils.addToRoll(roll, finalmod);

        }
    }
    console.log(roll.data.name);
    let output = await dialogUtils.confirm(roll.data.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: effect.name, rollTotal: roll.total}));
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