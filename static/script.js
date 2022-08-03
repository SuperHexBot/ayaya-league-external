
const { ipcRenderer } = require('electron');


let gameData = {};
let settings = {};

let assets = {};

function getChampionImage(name) {
    if (assets[name]) return assets[name];
    const img = createImg(`http://ddragon.leagueoflegends.com/cdn/12.14.1/img/champion/${name}.png`, name);
    img.hide();
    assets[name] = img;
}

function getSummonerImage(name) {
    if (assets[name]) return assets[name];
    const img = createImg(`http://ddragon.leagueoflegends.com/cdn/12.14.1/img/spell/${name}.png`, name);
    img.hide();
    assets[name] = img;
}

function addHandlars() {
    // ----- Screen size -----
    ipcRenderer.on('dataScreenSize', function (evt, message) {
        const data = JSON.parse(message);
        resizeCanvas(data.x, data.y);
    });
    ipcRenderer.send('requestScreenSize');


    // ----- Settings -----
    ipcRenderer.on('dataSettings', function (evt, message) {
        const data = JSON.parse(message);
        console.log('gotsettings', data)
        settings = data;
    });
    ipcRenderer.send('requestSettings');


    // ----- Game data -----
    ipcRenderer.on('gameData', function (evt, message) {
        const data = JSON.parse(message);
        gameData = data;
    });
}

function setup() {
    canvas = createCanvas(10, 10);
    addHandlars();
    // frameRate(50);
}

function drawOverlayEnemySpells() {
    push();

    textAlign(CENTER, CENTER);

    for (let i = 0; i < gameData.enemyChampions.length; i++) {

        const { spells, name } = gameData.enemyChampions[i];

        const x = 30;
        const y = 30 + 45 * i;


        const img = getChampionImage(name);
        try {
            if (!img) throw Error('noimage')
            image(img, x, y, 40, 40);
        } catch (ex) {
            noStroke();
            fill(0);
            rect(x, y, 40, 40);
        }

        fill(255);

        const spellImg1 = getSummonerImage(spells[4].name);
        try {
            if (!spellImg1) throw Error('noimage');
            image(spellImg1, x + 40 + 5, y, 40, 40);
            if (spells[4].cd > 0) {
                noStroke();
                fill(0, 0, 0, 100);
                rect(x + 40 + 5, y, 40, 40)
            }
        } catch (ex) { }

        const spellImg2 = getSummonerImage(spells[5].name);

        try {
            if (!spellImg2) throw Error('noimage');
            image(spellImg2, x + 40 + 5 + 40 + 5, y, 40, 40);
            if (spells[5].cd > 0) {
                noStroke();
                fill(0, 0, 0, 100);
                rect(x + 40 + 5 + 40 + 5, y, 40, 40)
            }
        } catch (ex) { }


        noStroke();
        fill(255);
        if (spells[4].cd > 0) text(spells[4].cd, x + 40 + 5, y, 40, 40);
        if (spells[5].cd > 0) text(spells[5].cd, x + 40 + 5 + 40 + 5, y, 40, 40);

    }

    pop();
}

function drawPlayerRange() {
    push();

    stroke(0, 220, 0);
    strokeWeight(3);
    noFill();

    const { me } = gameData;

    ellipse(me.x, me.y, me.range, me.range);

    pop();
}

function drawEnemiesRange() {
    push();

    stroke(0, 220, 0);
    strokeWeight(3);
    noFill();

    for (const enemy of gameData.enemyChampions) {
        const { x, y, vis, range } = enemy;
        if (!vis) continue;
        if (x > screen.width || y > screen.height || x < 0 || y < 0) continue;
        ellipse(x, y, range * 1.2, range * 1.2);
    }

    pop();
}

function drawEnemiesSpells() {
    push();

    stroke(0);
    strokeWeight(2);
    fill(0);

    for (const enemy of gameData.enemyChampions) {
        const { x, y, vis, spells } = enemy;
        if (spells.length < 6) continue;
        if (!vis) continue;
        if (x > screen.width || y > screen.height || x < 0 || y < 0) continue;
        text(`D: ${spells[4].cd} | F: ${spells[5].cd}`, x, y + 150);
    }

    pop();
}

function draw() {
    clear();

    if (!settings) return;

    if (gameData.me && settings.me && settings.me.range) drawPlayerRange();
    if (gameData.enemyChampions && settings.nmeChamps && settings.nmeChamps.range) drawEnemiesRange();
    if (gameData.enemyChampions && settings.nmeChamps && settings.nmeChamps.spells) drawEnemiesSpells();
    if (gameData.enemyChampions && settings.over && settings.over.nmeSpells) drawOverlayEnemySpells();

    textSize(20);
    noStroke();
    fill(255);
    if (gameData.performance && settings.over && settings.over.performance) {

        const _time = (gameData.performance.time || 0).toFixed(1);
        const max = (gameData.performance.max || 0).toFixed(1);
        const readings = (gameData.performance.readings || []).map(e => {
            return `${e.name}: ${e.delta.toFixed(1)}`
        });
        text(`Time: ${_time} ms\nMax: ${max}\nReads:\n${readings.join('\n')}`, 20, 250);
    }
}