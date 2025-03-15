import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../utils.js';


async function attack({trigger: {entity: effect}, workflow}) {
    console.log("attack");
    if (workflow.targets.size !== 1 || workflow.isFumble) return;
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseAttack', {itemName: effect.name, attackTotal: workflow.attackTotal}));
    if (!selection) return;
    await workflowUtils.bonusAttack(workflow, '1d4');
    await workflowUtils.completeItemUse(effect, {consumeUsage: true}, {configureDialog: false});
    return;
}

async function checkBonus({trigger: {roll, entity: effect}}) {
    let oldTotal = roll.total;
    let detailsText = effect.name + ' (1d4)';
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: detailsText, rollTotal: oldTotal}));
    if (!selection) return;
    let newRoll = await rollUtils.addToRoll(roll, '1d4');
    await workflowUtils.completeItemUse(effect, {consumeUsage: true}, {configureDialog: false});
    return newRoll;
}

async function saveBonus({trigger: {saveId, roll, actor, entity: effect}}) {
    let oldTotal = roll.total;
    let detailsText = effect.name + ' (1d4)';
    let target = roll.options.targetValue;
    if (roll._total > target){
        return;
    }
    if(roll._total + 4 < target){
        return;
    }
    let selection = await dialogUtils.confirm(effect.name, genericUtils.format('CHRISPREMADES.Dialog.UseRollTotal', {itemName: detailsText, rollTotal: oldTotal}));
    if (!selection) return;
    let newRoll = await rollUtils.addToRoll(roll, '1d4');
    await workflowUtils.completeItemUse(effect, {consumeUsage: true}, {configureDialog: false});
    return newRoll;
}

export let builtforSuccess = {
    name: 'Built For Success',
    version: '0.12.37',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 50
            }
        ]
    },
    save: [
        {
            pass: 'bonus',
            macro: saveBonus,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'bonus',
            macro: checkBonus,
            priority: 50
        }
    ],
    check: [
        {
            pass: 'bonus',
            macro: checkBonus,
            priority: 50
        }
    ]
};