import {constants} from '../../constants.js';
import {errors} from '../../events/errors.js';
import {dialogUtils} from '../../utilities/dialogUtils.js';
import {effectUtils} from '../../utilities/effectUtils.js';
import {genericUtils} from '../../utilities/genericUtils.js';
import {itemUtils} from '../../utilities/itemUtils.js';
async function use(workflow) {
    if (!workflow.targets.size) return;
    let buttons = Object.entries(CONFIG.DND5E.abilities).map(i => [i.label, i.abbreviation]);
    let selection = await dialogUtils.buttonMenu({title: workflow.item.name, description:'CHRISPREMADES.Hex.SelectAbility', buttons: buttons});
    if (!selection) return;
    let seconds;
    switch (workflow.castData.castLevel) {
        case 3:
        case 4:
            seconds = 28800;
            break;
        case 5:
        case 6:
        case 7:
        case 8:
        case 9:
            seconds = 86400;
            break;
        default:
            seconds = 3600;
    }
    let durationScale = workflow.item.system.duration.value;
    seconds = Math.min(seconds * durationScale, 86400);
    let targetEffectData = {
        name: genericUtils.translate('CHRISPREMADES.Hex.Hexed'),
        icon: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: seconds
        },
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.check.' + selection,
                mode: 0,
                value: true,
                priority: 20
            }
        ]
    };
    let targetEffects = [];
    for (let i of workflow.targets) {
        if (i.actor) {
            let targetEffect = await effectUtils.createEffect(i.actor, targetEffectData, {concentrationItem: workflow.item, identifier: 'hexed'});
            targetEffects.push(targetEffect);
        }
    }
    let casterEffectData = {
        name: workflow.item.name,
        icon: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: seconds
        },
        flags: {
            'chris-premades': {
                hex: Array.from(workflow.targets).map(i => i.uuid)
            }
        }
    };
    effectUtils.addOnUseMacros(casterEffectData, 'midi.actor', ['hex']);
    let featureData = itemUtils.getItemFromCompendium(constants.packs.spellFeatures, 'Hex: Move', {getDescription: true, translate: true, identifier: 'hexMove'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let casterEffect = await effectUtils.createEffect(workflow.actor, casterEffectData, {concentrationItem: workflow.item, identifier: 'hex', vae: {button: featureData.name}});
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: casterEffect, section: genericUtils.translate('CHRISPREMADES.section.spellFeatures')});
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    await genericUtils.update(concentrationEffect, {'duration.seconds': seconds});
}
async function damage(workflow) {
    if (!workflow.targets.size) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'hex');
    if (!effect) return;
    let validTargetUuids = effect.flags['chris-premades'].hex;
    if (!workflow.hitTargets.find(i => validTargetUuids.includes(i.uuid))) return;


}
async function move(workflow) {

}
export let hex = {
    name: 'Hex',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'postDamageRollComplete',
                macro: damage,
                priority: 250
            }
        ]
    },
    config: [
        {
            key: 'damageType',
            type: 'select',
            default: 'necrotic',
            options: constants.damageTypeOptions
        }
    ]
};
export let hexMove = {
    name: 'Hex - Move',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'RollComplete',
                macro: move,
                priority: 50
            }
        ]
    }
};