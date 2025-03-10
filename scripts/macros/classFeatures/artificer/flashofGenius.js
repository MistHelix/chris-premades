import {actorUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function early({trigger: {roll, entity: effect}}) {
    console.log("PLEASE GIVE ME A SIGN")
    console.log(roll);
    // console.log(entity);
    console.log(effect);
    if (roll.data.details.cr != null){
        console.log("ENEMY KILL THEM");
        return;
    }
    // if (roll.data.mod != null && roll.data.mod ?= 2){
    //     return
    // }
    let mod = effect.actor.system.abilities.int.mod;
    console.log()
    if (roll.options.targetValue != null){
        let target = roll.options.targetValue;
        console.log(target);
        if (roll._total > target){
            return;
        }
        if(roll._total + mod < target){
            return;
        }
        //TODO ask if they want to add
        console.log("boosting");
        return await rollUtils.addToRoll(roll, effect.actor.system.abilities.int.mod);
    }
    console.log(mod);
    return await rollUtils.addToRoll(roll, effect.actor.system.abilities.int.mod);
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