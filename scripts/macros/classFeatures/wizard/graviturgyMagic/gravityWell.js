import {crosshairUtils, genericUtils} from '../../../../utils.js';

async function save({trigger: {entity: item}, workflow}) {
    let token = workflow.token;
    if (workflow.targets.size !== 1) return;
    if (workflow.failedSaves.size !== 1) return;
    if(workflow.item.type == "spell"){
        let targetToken = Array.from(workflow.hitTargets)[0];
        let position = await crosshairUtils.aimCrosshair({
            token,
            maxRange:5,
            drawBoundries: true,
            centerpoint: targetToken.center,
            trackDistance: true, 
            crosshairsConfig: {
                size: canvas.grid.distance * targetToken.document.width / 2,
                icon: targetToken.document.texture.src,
                resolution: (targetToken.document.width % 2) ? 1 : -1
            }
        });
        let xOffset = targetToken.document.width * canvas.grid.size / 2;
        let yOffset = targetToken.document.height * canvas.grid.size / 2;
        let newX = (position.x ?? targetToken.document.center.x) - xOffset;
        let newY = (position.y ?? targetToken.document.center.y) - yOffset;
        if (!position.cancelled && position.valid) await genericUtils.update(targetToken.document, {x: newX, y: newY});
    }
}

export let gravityWell = {
    name: 'Gravity Well',
    version: '0.12.37',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: save,
                priority: 50
            }
        ]
    }
};