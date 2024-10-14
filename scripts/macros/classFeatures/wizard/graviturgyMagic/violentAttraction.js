import {actorUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../../utils.js';


async function early({trigger: {entity: item, token}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (actorUtils.hasUsedReaction(token.actor)) return;
    if (tokenUtils.getDistance(token, workflow.token, {wallsBlock: true}) > 60) return;
    if (!tokenUtils.canSee(token, workflow.token)) return;
    let selection = await dialogUtils.confirm(token.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), {userId: socketUtils.firstOwner(item.parent, true)});
    if (!selection) return;
    await workflowUtils.bonusDamage(workflow, ' 1d10[bludgeoning]', {damageType: 'bludgeoning'});
    await workflowUtils.completeItemUse(item, {consumeUsage: true}, {configureDialog: false});
}


export let violentAttraction = {
    name: 'Violent Attraction',
    version: '0.12.37',
    midi: {
        actor: [
            {
                pass: 'sceneDamageRollComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};