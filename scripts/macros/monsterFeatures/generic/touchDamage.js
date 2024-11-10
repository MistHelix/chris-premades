import {constants, tokenUtils, workflowUtils} from '../../../utils.js';

async function hit({trigger:{entity: item, token}, workflow}) {
    if (!constants.meleeAttacks.includes(workflow.item.system.actionType)) return;
    if (tokenUtils.getDistance(token, workflow.token) > 5) return;
    await workflowUtils.syntheticItemRoll(item, [workflow.token]);
}
export let touchDamage = {
    name: 'Touch Damage',
    translation: 'CHRISPREMADES.Macros.TouchDamage.Name',
    version: '0.12.82',
    midi: {
        actor: [
            {
                pass: 'onHit',
                macro: hit,
                priority: 50
            }
        ]
    },
    isGenericFeature: true,
    genericConfig: []
};