import {dialogUtils, genericUtils, workflowUtils} from '../../../../utils.js';

async function damage({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    let matchingTypes = Array.from(workflowUtils.getDamageTypes(workflow.damageRolls).intersection(new Set(['acid', 'fire', 'necrotic', 'poison', 'healing'])));
    if (!matchingTypes.length) return;
    let damageType;
    if (matchingTypes.length > 1) {
        damageType = await dialogUtils.buttonDialog(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}), 
            matchingTypes.map(i => [CONFIG.DND5E.damageTypes[i].label, i])
        );
    }
    if (!damageType) damageType = matchingTypes[0];
    console.log(workflow.actor.system.abilities.int.mod);
    await workflowUtils.bonusDamage(workflow, `${workflow.actor.system.abilities.int.mod}`, {damageType});
}
export let alchemicalSavant = {
    name: 'Alchemical Savant',
    version: '1.0.37',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};