import {actorUtils, combatUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils, templateUtils, workflowUtils} from '../../../../utils.js';


async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let template = workflow.template;
    if (!template) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await genericUtils.update(template, {
        flags: {
            'chris-premades': {
                template: {
                    name: workflow.item.name
                },
                castData: {...workflow.castData, saveDC: itemUtils.getSaveDC(workflow.item)},
                macros: {
                    template: ['eventHorizonTemplate']
                },
            }
        }
    });
}

async function enterOrTurn({trigger: {entity: template, castData, token}}) {
    console.log("Start of this tokens turn.");
    console.log(token);
    // let [targetCombatant] = game.combat.getCombatantsByToken(token.document);
    // if (!targetCombatant) return;
    // let sourceActor = (await templateUtils.getSourceActor(template)) ?? token.actor;
    // await workflowUtils.syntheticItemDataRoll(featureData, sourceActor, [token]);
}

export let eventHorizon = {
    name: 'Event Horizon',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};

export let eventHorizonTemplate = {
    name: 'Event Horizon: Template',
    version: eventHorizon.version,
    template: [
        {
            pass: 'turnStart',
            macro: enterOrTurn,
            priority: 50
        }
    ]
};