import { CachedClass } from "./CachedClass";
import AyayaLeague from '../LeagueReader';
import { readName } from "../StructureReader";
import { Vector2, Vector3 } from "./Vector";
import { ActiveSpellEntry } from './ActiveSpellEntry';
import { BuffManager } from './BuffManager';
import { factoryFromArray, worldToScreen, getChampionWindup, getChampionRadius, getChampionBaseAttackSpeed, getChampionWindupMod } from "../utils/Utils";
import { Spell } from "./Spell";
import * as SAT from 'sat';
import { AiManager } from './AiManager';
import OFFSET from '../consts/Offsets';

const Reader = AyayaLeague.reader;

export class Entity extends CachedClass {

    constructor(public address: number) { super(); };


    get netId(): number {
        return this.use('netId', () => Reader.readProcessMemory(this.address + OFFSET.oObjNetId, "VEC3"));
    }
    get name(): string {
        return this.use('name', () => readName(this.address + OFFSET.oObjName))
    }
    get gamePos(): Vector3 {
        return this.use('gamePos', () => Vector3.fromData(Reader.readProcessMemory(this.address + OFFSET.oObjPosition, "VEC3")));
    }
    get screenPos(): Vector2 {
        return worldToScreen(this.gamePos, CachedClass.get('screen'), CachedClass.get('matrix'));
    }
    get level(): number {
        return this.use('level', () => Reader.readProcessMemory(this.address + OFFSET.oObjLevel, "DWORD"));
    }
    get ad(): number {
        return this.use('ad', () => Reader.readProcessMemory(this.address + OFFSET.oObjStatAttackRange, "FLOAT"));

    }

    get armor(): number {
        return this.use('armor', () => Reader.readProcessMemory(this.address + OFFSET.oObjArmor, "FLOAT"));
    }
    get ap(): number {
        return this.use('ap', () => Reader.readProcessMemory(this.address + OFFSET.oObjStatAp, "FLOAT"));
    }



    // ----- Penetrations -----
    get magicPenFlat(): number {
        return this.use('magicPenFlat', () => Reader.readProcessMemory(this.address + OFFSET.oObjStatMagicPenFlat, "FLOAT"));
    }
    get magicPenPercent(): number {
        return this.use('magicPenPercent', () => (1 - Reader.readProcessMemory(this.address + OFFSET.oObjStatMagicPenPerc, "FLOAT")) * 100);
    }
    get armorPenPercent(): number {
        return this.use('armorPenPercent', () => (1 - Reader.readProcessMemory(this.address + OFFSET.oObjStatArmorPen, "FLOAT")) * 100);
    }
    get lethality(): number {
        return this.use('lethality', () => Reader.readProcessMemory(this.address + OFFSET.oObjStatLethality, "FLOAT"));
    }



    get magicResist(): number {
        return this.use('magicResist', () => Reader.readProcessMemory(this.address + OFFSET.oObjMagicRes, "FLOAT"));
    }
    get hp(): number {
        return this.use('hp', () => Reader.readProcessMemory(this.address + OFFSET.oObjHealth, "FLOAT"));
    }
    get maxHp(): number {
        return this.use('maxHp', () => Reader.readProcessMemory(this.address + OFFSET.oObjMaxHealth, "FLOAT"));
    }
    get mana(): number {
        return this.use('mana', () => Reader.readProcessMemory(this.address + OFFSET.oObjMana, "FLOAT"));
    }
    get maxMana(): number {
        return this.use('maxMana', () => Reader.readProcessMemory(this.address + OFFSET.oObjMaxMana, "FLOAT"));
    }
    get movSpeed(): number {
        return this.use('movSpeed', () => Reader.readProcessMemory(this.address + OFFSET.oObjStatMovSpeed, "FLOAT"));
    }
    get visible(): number {
        return this.use('visible', () => Reader.readProcessMemory(this.address + OFFSET.oObjVisible, "BOOL"));
    }
    get invulnerable(): boolean {
        return this.use('invulnerable', () => !Reader.readProcessMemory(this.address + OFFSET.oObjVulnerable, "BOOL"));
    }
    get targetable(): boolean {
        return this.use('targetable', () => Reader.readProcessMemory(this.address + OFFSET.oObjTargetable, "BOOL"));
    }
    get range(): number {
        return this.use('range', () => Reader.readProcessMemory(this.address + OFFSET.oObjStatAttackRange, "FLOAT"));
    }
    get team(): number {
        return this.use('team', () => Reader.readProcessMemory(this.address + OFFSET.oObjTeam, "DWORD"));
    }

    get dead() {
        return this.use('dead', () => {

            // const t = Reader.readProcessMemory(this.address + 0x20C, "DWORD");
            // const x1 = Reader.readProcessMemory(t + 0x20C, "DWORD");
            // const x2 = t + 0x1D8;
            // let x4 = Reader.readProcessMemory(x1 + x2 + 2, "DWORD");
            // const x5 = Reader.readProcessMemory(x2 + 5, "DWORD");
            // x4 ^= ~(x5 ^ xorKey);
            // x4 ^= x5 ^ 0xA0;
            // return x4;

            return this.hp <= 0 || (this.mana <= 0 && this.maxMana > 0);

        });
    }

    get spells(): Spell[] {
        return this.use('spells', () => {
            if (this.team != 100 && this.team != 200) return [];
            if (this.name.startsWith('PracticeTool')) return [];
            return factoryFromArray(Spell, AyayaLeague.getSpellsOf(this.address))
        });
    }

    get activeSpellEntry() {
        return this.use('activeSpellEntry', () => new ActiveSpellEntry(Reader.readProcessMemory(this.address + OFFSET.oSpellBook + OFFSET.oSpellBookActiveSpellEntry, "DWORD")));
    }

    get buffManager() {
        return this.use('buffManager', () => new BuffManager(this.address + OFFSET.oBuffManager));
    }

    get AiManager(): AiManager {
        return this.use('AiManager', () => {
            const v1 = Reader.readProcessMemory(this.address + OFFSET.oObjAiManager, "BYTE");
            const v2 = this.address + OFFSET.oObjAiManager - 8;
            const v3 = Reader.readProcessMemory(v2 + 4, "DWORD");
            let v4 = Reader.readProcessMemory(v2 + (4 * v1 + 12), "DWORD");
            v4 = v4 ^ ~v3;
            const aiManagerAddress = Reader.readProcessMemory(v4 + 0x8, "DWORD");
            return new AiManager(aiManagerAddress);
        });
    }

    get attackDelay() {
        return 1000 / CachedClass.get<any>('webapi_me').championStats.attackSpeed;
    }

    get windupTime() {
        const windupPercent = 100 / getChampionWindup(this.name);
        const baseAttackSpeed = getChampionBaseAttackSpeed(this.name);
        const bWindupTime = 1 / baseAttackSpeed * windupPercent;
        const totalAttackSpeed: number = CachedClass.get<any>('webapi_me').championStats.attackSpeed;
        const cAttackTime = 1 / totalAttackSpeed;
        const windupModifier = getChampionWindupMod(this.name) == 0 ? 0 : 100 / getChampionWindupMod(this.name);
        const result = bWindupTime + ((cAttackTime * windupPercent) - bWindupTime) * windupModifier;
        return (1 / totalAttackSpeed * 1000) * result / 20;
    }


    get baseDrawingOffset(): number {
        return this.use('baseDrawingPos', () => {
            const base = 0x2F01;
            const v4 = Reader.readProcessMemory(this.address + 0x2ED1, "BYTE");
            const vTmp = Reader.readProcessMemory((this.address + (base + 0x7)), "BYTE");
            let v5 = Reader.readProcessMemory(this.address + (0x4 * vTmp) + (base + 0xB), "DWORD");
            const vTmp2 = Reader.readProcessMemory(this.address + (base + 0x3), "DWORD");
            v5 ^= ~vTmp2;
            const o1 = Reader.readProcessMemory(v5 + 0x10, "DWORD");
            const o2 = Reader.readProcessMemory(o1 + 0x4, "DWORD");
            const o3 = Reader.readProcessMemory(o2 + 0x1C, "DWORD");
            const height = Reader.readProcessMemory(o3 + 0x88, "FLOAT");
            return height;
        });
    }

    get boundingBox() {
        return this.use('boundingBox', () => getChampionRadius(this.name));
    }

    get satHitbox() {
        return this.use('satHitbox', () => new SAT.Circle(new SAT.Vector(this.screenPos.x, this.screenPos.y), 60));
    }

}