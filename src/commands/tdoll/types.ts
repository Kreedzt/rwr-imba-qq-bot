export interface ITDollDataBaseItem {
    // "10%"
    tileEffect1Time: string;
    skill1: string;
    // "伤害"
    tileEffect1: string;
    // "47"
    baseEva: string;
    // "AR"
    tdollClass: string;
    // "1690243200"
    timeStamp: string;
    // "03:46:00"
    productionTime: string;
    // "CM901"
    nameIngame: string;
    // "48"
    baseAcc: string;
    // "73"
    baseRate: string;
    // "0"
    mod: string;
    // "0"
    baseArmor: string;
    // "46"
    baseAtk: string;
    // "/w/CM901"
    url: string;
    // "突击步枪"
    type: string;
    // "https://www.gfwiki.org/images/6/68/Icon_No.394.png"
    avatar: string;
    // "116"
    baseHp: string;
    // "命中"
    tileEffect2: string;
    // "冲锋枪/突击步枪"
    tilesAffect: string;
    // "可通过常规制造获取/可通过重型制造获取"
    obtainMethod: string;
    // "1,0,1,1,2,1,1,0,1"
    tiles: string;
    // "4"
    rarity: string;
    // "394"
    id: string;
    // "30%"
    tileEffect2Time: string;
}

export interface ITDollDataModItem extends ITDollDataBaseItem {
    // "20%"
    modtileEffect1Time: string;
    // "50"
    modEva: string;
    // 'https://www.gfwiki.org/images/a/a7/Icon_No.55_Mod.png'
    avatarMod: string;
    // '50'
    modAcc: string;
    // '80'
    modRate: string;
    // '48'
    modAtk: string;
    // '0'
    modArmor: string;
    // '5'
    modRarity: string;
    // '突击步枪'
    tilesAffectMod: string;
    // '113'
    modHp: string;
    // '20%'
    modtileEffect2Time: string;
    // '0,1,1,0,2,1,0,1,1'
    tilesMod: string;
}

export type ITDollDataItem = ITDollDataBaseItem | ITDollDataModItem;

export type ITDollSkinDataItem = Array<{
    index: number;
    title: string;
    value: string;
}>;
