/* eslint-disable no-case-declarations */
import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {effectAuras} from '../../../../utility/effectAuras.js';
let choices = [
    'Shadowy Tendrils',
    'Teleport',
    'Intangible Spirit',
    'Magic Infusion',
    'Retribution',
    'Protective Lights',
    'Flowers and Vines',
    'Bolt of Light'
];
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let effect = chris.findEffect(workflow.actor, 'Wild Surge');
    if (effect) {
        await chris.removeEffect(effect);
        await warpgate.wait(100);
    }
    if(actor.getFlag("chris-premades", "keyLevel") >= 2){
        level2(workflow, token, actor);
    }
    let rollFormula = '1d8';
    let controlledSurge = chris.getItem(workflow.actor, 'Controlled Surge');
    if (controlledSurge) rollFormula = '2d8';
    let roll = await new Roll(rollFormula).roll({'async': true});
    roll.toMessage({
        rollMode: 'roll',
        speaker: {'alias': name},
        flavor: workflow.item.name
    });
    let selection;
    if (controlledSurge) {
        let roll1 = roll.terms[0].values[0] - 1;
        let roll2 = roll.terms[0].values[1] - 1;
        if (roll1 === roll2) {
            selection = await chris.dialog(workflow.item.name, choices.map(i => [i, i]), 'Which effect?');
        } else {
            selection = await chris.dialog(workflow.item.name, [[choices[roll1], choices[roll1]], [choices[roll2], choices[roll2]]], 'Which effect?');
        }
    } else {
        selection = choices[roll.total - 1];
    }
    let effectData;
    let featureData;
    let feature;
    let options = {
        'permanent': false,
        'name': 'Wild Surge',
        'description': 'Wild Surge'
    };
    async function effectMacro() {
        await warpgate.revert(token.document, 'Wild Surge');
    }
    async function doMutate(featureName) {
        let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Wild Surge - ' + featureName);
        if (!featureData) return;
        featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Wild Surge - ' + featureName);
        delete featureData._id;
        let effectData = {
            'name': 'Wild Surge',
            'icon': workflow.item.img,
            'origin': workflow.item.uuid,
            'duration': {
                'seconds': 60
            },
            'flags': {
                'effectmacro': {
                    'onDelete': {
                        'script': chris.functionToString(effectMacro)
                    }
                },
                'chris-premades': {
                    'vae': {
                        'button': featureData.name
                    }
                }
            }
        };
        let updates = {
            'embedded': {
                'Item': {
                    [featureData.name]: featureData
                },
                'ActiveEffect': {
                    [effectData.name]: effectData
                }
            }
        };
        await warpgate.mutate(workflow.token.document, updates, {}, options);
    }
    let results_html;
    switch(selection) {
        case 'Shadowy Tendrils':
            results_html = `<h3>Shadowy Tendrils!</h3>
            <p>Each creature of your choice that you can see within 30 feet of you must succeed on a Constitution saving throw or take 1d12 necrotic damage. You also gain 1d12 temporary hit points.</p>`;
            ChatMessage.create({
                content: results_html
            });
            featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Wild Surge - Shadowy Tendrils');
            if (!featureData) return;
            featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Wild Surge - Shadowy Tendrils');
            delete featureData._id;
            feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
            await warpgate.wait(100);
            await feature.use();
            let tRoll = await new Roll('1d12[temphp]').roll({async: true});
            tRoll.toMessage({
                rollMode: 'roll',
                speaker: {'alias': name},
                flavor: featureData.name
            });
            await chris.applyDamage([workflow.token], tRoll.total, 'temphp');
            return;
        case 'Teleport':
            results_html = `<h3>Teleport!</h3>
            <p>You teleport up to 30 feet to an unoccupied space you can see. Until your rage ends, you can use this effect again on each of your turns as a bonus action.</p>`;
            ChatMessage.create({
                content: results_html
            });
            await doMutate('Teleport');
            feature = workflow.actor.items.getName('Wild Surge - Teleport');
            if (feature) await feature.use();
            return;
        case 'Intangible Spirit':
            results_html = `<h3>Intangible Spirit!</h3>
            <p>An intangible spirit, which looks like a flumph or a pixie (your choice), appears within 5 feet of one creature of your choice that you can see within 30 feet of you. At the end of the current turn, the spirit explodes, and each creature within 5 feet of it must succeed on a Dexterity saving throw or take 1d6 force damage. Until your rage ends, you can use this effect again, summoning another spirit, on each of your turns as a bonus action.</p>`;
            ChatMessage.create({
                content: results_html
            });
            await doMutate('Intangible Spirit');
            feature = workflow.actor.items.getName('Wild Surge - Intangible Spirit');
            if (feature) await feature.use();
            return;
        case 'Magic Infusion':
            results_html = `<h3>Magic Infusion!</h3>
            <p>Magic infuses one weapon of your choice that you are holding. Until your rage ends, the weapon's damage type changes to force, and it gains the light and thrown properties, with a normal range of 20 feet and a long range of 60 feet. If the weapon leaves your hand, the weapon reappears in your hand at the end of the current turn.</p>`;
            ChatMessage.create({
                content: results_html
            });
            let weapons = workflow.actor.items.filter(i => i.type === 'weapon');
            if (!weapons.length) return;
            let weapon;
            if (weapons.length === 1) {
                weapon = weapons[0];
            } else {
                [weapon] = await chris.selectDocument('What weapon?', weapons);
                if (!weapon) return;
            }
            let damage = duplicate(weapon.toObject()).system.damage;
            for (let i = 0; i < damage.parts.length; i++) {
                damage.parts[i] = [
                    damage.parts[i][0].replaceAll(damage.parts[i][1], 'force'),
                    damage.parts[i][1] = 'force'
                ];
            }
            let versatile = weapon.system.damage.versatile.toLowerCase();
            if (versatile != '') {
                let flavors = new Set();
                let versatileRoll = await new Roll(weapon.system.damage.versatile, workflow.actor.getRollData()).evaluate({'async': true});
                for (let i of versatileRoll.terms) {
                    if (i.flavor != '') flavors.add(i.flavor);
                }
                for (let i of Array.from(flavors)) {
                    versatile = versatile.replaceAll(i, 'force');
                }
                damage.versatile = versatile;
            }
            effectData = {
                'name': 'Wild Surge',
                'icon': workflow.item.img,
                'origin': workflow.item.uuid,
                'duration': {
                    'seconds': 60
                },
                'flags': {
                    'effectmacro': {
                        'onDelete': {
                            'script': chris.functionToString(effectMacro)
                        }
                    },
                    'chris-premades': {
                        'vae': {
                            'button': weapon.name
                        }
                    }
                }
            };
            let updates = {
                'embedded': {
                    'Item': {
                        [weapon.name]: {
                            'system': {
                                'damage': damage,
                                'properties': {
                                    'thr': true,
                                    'lgt': true
                                },
                                'range': {
                                    'long': 60,
                                    'value': 20
                                }
                            }
                        }
                    },
                    'ActiveEffect': {
                        [effectData.name]: effectData
                    }
                }
            };
            await warpgate.mutate(workflow.token.document, updates, {}, options);
            return;
        case 'Retribution':
            results_html = `<h3>Retribution!</h3>
            <p>Whenever a creature hits you with an attack roll before your rage ends, that creature takes 1d6 force damage, as magic lashes out in retribution.</p>`;
            ChatMessage.create({
                content: results_html
            });
            await doMutate('Retribution');
            return;
        case 'Protective Lights':
            results_html = `<h3>Protective Lights!</h3>
            <p>Until your rage ends, you are surrounded by multicolored, protective lights; you gain a +1 bonus to AC, and while within 10 feet of you, your allies gain the same bonus.</p>`;
            ChatMessage.create({
                content: results_html
            });
            effectData = {
                'icon': workflow.item.img,
                'origin': workflow.item.uuid,
                'duration': {
                    'seconds': 60
                },
                'name': 'Wild Surge',
                'changes': [
                    {
                        'key': 'flags.chris-premades.aura.protectiveLights.name',
                        'mode': 5,
                        'value': 'protectiveLights',
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.protectiveLights.castLevel',
                        'mode': 5,
                        'value': 1,
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.protectiveLights.range',
                        'mode': 5,
                        'value': '10',
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.protectiveLights.disposition',
                        'mode': 5,
                        'value': 'ally',
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.protectiveLights.effectName',
                        'mode': 5,
                        'value': 'Wild Surge - Protective Lights',
                        'priority': 20
                    },
                    {
                        'key': 'flags.chris-premades.aura.protectiveLights.macroName',
                        'mode': 5,
                        'value': 'protectiveLights',
                        'priority': 20
                    }
                ],
                flags: {
                    'effectmacro': {
                        'onDelete': {
                            'script': 'await chrisPremades.macros.wildSurge.protectiveLights.end(token);'
                        }
                    }
                }
            };
            let flagAuras = {
                'protectiveLights': {
                    'name': 'protectiveLights',
                    'castLevel': 1,
                    'range': 10,
                    'disposition': 'ally',
                    'effectName': 'Wild Surge - Protective Lights',
                    'macroName': 'protectiveLights'
                }
            };
            await chris.createEffect(workflow.actor, effectData);
            effectAuras.add(flagAuras, workflow.token.document.uuid, true);
            return;
        case 'Flowers and Vines':
            results_html = `<h3>Flowers and Vines!</h3>
            <p>Flowers and vines temporarily grow around you; until your rage ends, the ground within 15 feet of you is difficult terrain for your enemies.</p>`;
            ChatMessage.create({
                content: results_html
            });
            let templateData = {
                't': 'circle',
                'x': workflow.token.center.x,
                'y': workflow.token.center.y,
                'distance': 15,
                'direction': 0,
                'angle': 0,
                'user': game.user,
                'fillColor': game.user.color
            };
            let template = await chris.createTemplate(templateData);
            await warpgate.wait(200);
            await tokenAttacher.attachElementsToToken([template], workflow.token, false);
            effectData = {
                'icon': workflow.item.img,
                'origin': workflow.item.uuid,
                'duration': {
                    'seconds': 60
                },
                'name': 'Wild Surge',
                'flags': {
                    'effectmacro': {
                        'onDelete': {
                            'script': 'let template = await fromUuid("' + template.uuid + '"); if (template) await template.delete();'
                        }
                    }
                }
            };
            await chris.createEffect(workflow.actor, effectData);
            return;
        case 'Bolt of Light':
            results_html = `<h3>Bolt of Light!</h3>
            <p>A bolt of light shoots from your chest. Another creature of your choice that you can see within 30 feet of you must succeed on a Constitution saving throw or take 1d6 radiant damage and be blinded until the start of your next turn. Until your rage ends, you can use this effect again on each of your turns as a bonus action.</p>`;
            ChatMessage.create({
                content: results_html
            });
            await doMutate('Bolt of Light');
            feature = workflow.actor.items.getName('Wild Surge - Bolt of Light');
            if (feature) {
                let targets;
                let nearbyTargets = chris.findNearby(workflow.token, 30, 'enemy', true);
                if (!nearbyTargets.length) return;
                if (nearbyTargets.length === 1) {
                    targets = [nearbyTargets[0].uuid];
                } else {
                    let selection = await chris.selectTarget(feature.name, constants.okCancel, nearbyTargets, true, 'one', false, false, 'Select a target:');
                    if (!selection.buttons) return;
                    targets = selection.inputs.filter(i => i);
                }
                let [config, options] = constants.syntheticItemWorkflowOptions(targets);
                await MidiQOL.completeItemUse(feature, config, options);
            }
            return;
    }
}
async function protectiveLightsEnd(token) {
    effectAuras.remove('protectiveLights', token.document.uuid);
}
async function protectiveLightsAura(token, selectedAura) {
    let originToken = await fromUuid(selectedAura.tokenUuid);
    if (!originToken) return;
    let originActor = originToken.actor;
    let auraEffect = chris.findEffect(originActor, 'Wild Surge');
    if (!auraEffect) return;
    let originItem = auraEffect.parent;
    if (!originItem) return;
    let effectData = {
        'name': 'Wild Surge - Protective Lights',
        'icon': originItem.img,
        'origin': originItem.uuid,
        'duration': {
            'seconds': 604800
        },
        'changes': [
            {
                'key': 'system.attributes.ac.bonus',
                'mode': 2,
                'value': '+1',
                'priority': 20
            }
        ],
        'flags': {
            'chris-premades': {
                'aura': true,
                'effect': {
                    'noAnimation': true
                }
            }
        }
    };
    let effect = chris.findEffect(token.actor, effectData.name);
    if (effect?.origin === effectData.origin) return;
    if (effect) await chris.removeEffect(effect);
    await chris.createEffect(token.actor, effectData);
}
async function intangibleSpirit({speaker, actor, token, character, item, args, scope, workflow}) {
    let sourceActor = game.actors.getName('CPR - Intangible Spirit');
    if (!sourceActor) return;
    let tokenDocument = await sourceActor.getTokenDocument();
    let options = {
        'controllingActor': workflow.actor,
        'crosshairs': {
            'interval': tokenDocument.width % 2 === 0 ? 1 : -1
        }
    };
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Class Feature Items', 'Wild Surge - Intangible Spirit Explode');
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Wild Surge - Intangible Spirit Explode');
    featureData.system.save.dc = chris.getSpellDC(workflow.item);
    let updates = {
        'embedded': {
            'Item': {
                [featureData.name]: featureData
            }
        }
    };
    let type = await chris.dialog(workflow.item.name, [['Flumph', 'flumph'], ['Pixie', 'pixie']], 'What form does the intangible spirit take?') ?? 'flumph';
    let originItem = chris.getItem(workflow.actor, 'Wild Surge');
    if (!originItem) return;
    let avatarImg = chris.getConfiguration(originItem, type + '-avatar');
    let tokenImg = chris.getConfiguration(originItem, type + '-token');
    if (avatarImg) setProperty(updates, 'actor.img', avatarImg);
    if (tokenImg) {
        setProperty(updates, 'actor.prototypeToken.texture.src', tokenImg);
        setProperty(updates, 'token.texture.src', tokenImg);
    }
    let spawnedTokens = await warpgate.spawn(tokenDocument, updates, {}, options);
    if (!spawnedTokens) return;
    let spawnedToken = game.canvas.scene.tokens.get(spawnedTokens[0]);
    if (!spawnedToken) return;
    let effectData = {
        'name': workflow.item.name,
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 6
        },
        'flags': {
            'effectmacro': {
                'onTurnEnd': {
                    'script': 'let token = await fromUuid("' + spawnedToken.uuid + '"); if (!token) return; let feature = token.actor.items.getName("Wild Surge - Intangible Spirit Explode"); if (feature) await feature.use(); await warpgate.dismiss("' + spawnedToken.id + '"); await effect.delete();'
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
}
async function retribution(workflow, token) {
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    if (workflow.hitTargets.size != 1) return;
    let feature = token.actor.items.getName('Wild Surge - Retribution');
    if (!feature) return;
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.token.document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
}
async function level2(workflow, token, actor){
    //check all of nyxs equiped to make sure its only the axe.
    let items = actor.items.filter(i => i.type==='weapon' && i.system.equipped);
    let shields = actor.items.filter(i => i.system.type?.value === 'shield' && i.system.equipped);
    if(shields.length){
        return;
    }
    if(items.length == 1){
        console.log("Only 1 item equiped");
        let rollFormula = '1d3';
        let roll = await new Roll(rollFormula).roll({'async': true});
        roll.toMessage({
            rollMode: 'roll',
            speaker: {'alias': name},
            flavor: workflow.item.name
        });
        console.log("Roll total" + roll.total);
        console.log(roll.total);
        let results_html;
        let effectData;
        let effect;
        //Change to probably be +2 str, dex, or con. Save bless for an upgrade letter down the line and lean into the randomness maybe.
        switch(roll.total) {
            case 1:
                // +2 Con
                results_html = `<h3>Feral Constitution!</h3>
                <p>The metal of your axe flows into you reinforcing your skin. You gain +2 Con Score.</p>`;
                ChatMessage.create({
                    content: results_html
                });
                effectData = {
                    'name': 'Feral Constitution',
                    'icon': workflow.item.img,
                    'origin': workflow.item.uuid,
                    'duration': {
                        'seconds': 60
                    },
                    'changes': [
                        {
                            'key': 'system.abilities.con.value',
                            'mode': 2,
                            'value': '2',
                            'priority': 20
                        }
                    ],
                    'flags': {
                        'chris-premades': {
                            'aura': false,
                            'effect': {
                                'noAnimation': true
                            }
                        }
                    }
                };
                effect = chris.findEffect(token.actor, effectData.name);
                if (effect?.origin === effectData.origin) return;
                if (effect) await chris.removeEffect(effect);
                await chris.createEffect(token.actor, effectData);
                //Should heal after giving con = to level
                let level = actor.system.details.level;
                await actor.update({"system.attributes.hp.value" : actor.system.attributes.hp.value + level})
                break;
            case 2:
                // +2 Dex
                results_html = `<h3>Untamed Reflexes!</h3>
                <p>Your body sears in pain as your brain begins to accelerate. You gain +2 Dex Score.</p>`;
                ChatMessage.create({
                    content: results_html
                });
                effectData = {
                    'name': 'Untamed Reflexes',
                    'icon': workflow.item.img,
                    'origin': workflow.item.uuid,
                    'duration': {
                        'seconds': 60
                    },
                    'changes': [
                        {
                            'key': 'system.abilities.dex.value',
                            'mode': 2,
                            'value': '2',
                            'priority': 20
                        }
                    ],
                    'flags': {
                        'chris-premades': {
                            'aura': false,
                            'effect': {
                                'noAnimation': true
                            }
                        }
                    }
                };
                effect = chris.findEffect(token.actor, effectData.name);
                if (effect?.origin === effectData.origin) return;
                if (effect) await chris.removeEffect(effect);
                await chris.createEffect(token.actor, effectData);
                break;
            case 3:
                //+2 Str
                results_html = `<h3>Feral Strength!</h3>
                <p>You feel the power of all those you have slain flow into you. You gain +2 Str Score.</p>`;
                ChatMessage.create({
                    content: results_html
                });
                effectData = {
                    'name': 'Feral Strength',
                    'icon': workflow.item.img,
                    'origin': workflow.item.uuid,
                    'duration': {
                        'seconds': 60
                    },
                    'changes': [
                        {
                            'key': 'system.abilities.str.value',
                            'mode': 2,
                            'value': '2',
                            'priority': 20
                        }
                    ],
                    'flags': {
                        'chris-premades': {
                            'aura': false,
                            'effect': {
                                'noAnimation': true
                            }
                        }
                    }
                };
                effect = chris.findEffect(token.actor, effectData.name);
                if (effect?.origin === effectData.origin) return;
                if (effect) await chris.removeEffect(effect);
                await chris.createEffect(token.actor, effectData);
                break;
            case 500:
                //Wild Bless
                results_html = `<h3>Wild Bless!</h3>
                <p>Your axe surges with power blessing you with increased strength.</p>`;
                ChatMessage.create({
                    content: results_html
                });
                let blessBonus = '1d4'
                effectData = {
                    'name': 'Wild Bless',
                    'icon': workflow.item.img,
                    'origin': workflow.item.uuid,
                    'duration': {
                        'seconds': 60
                    },
                    'changes': [
                        {
                            'key': 'system.bonuses.abilities.save',
                            'mode': 2,
                            'value': blessBonus,
                            'priority': 20
                        },
                        {
                            'key': 'system.bonuses.mwak.attack',
                            'mode': 2,
                            'value': blessBonus,
                            'priority': 20
                        },
                        {
                            'key': 'system.bonuses.msak.attack',
                            'mode': 2,
                            'value': blessBonus,
                            'priority': 20
                        },
                        {
                            'key': 'system.bonuses.rsak.attack',
                            'mode': 2,
                            'value': blessBonus,
                            'priority': 20
                        },
                        {
                            'key': 'system.bonuses.rwak.attack',
                            'mode': 2,
                            'value': blessBonus,
                            'priority': 20
                        }
                    ],
                    'flags': {
                        'chris-premades': {
                            'aura': false,
                            'effect': {
                                'noAnimation': true
                            }
                        }
                    }
                };
                effect = chris.findEffect(token.actor, effectData.name);
                if (effect?.origin === effectData.origin) return;
                if (effect) await chris.removeEffect(effect);
                await chris.createEffect(token.actor, effectData);
                break;
        }

    }
}
export let wildSurge = {
    'item': item,
    'intangibleSpirit': intangibleSpirit,
    'retribution': retribution,
    'protectiveLights': {
        'end': protectiveLightsEnd,
        'aura': protectiveLightsAura
    },
    'level2': level2
};