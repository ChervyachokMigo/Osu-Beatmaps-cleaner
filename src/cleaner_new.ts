
import {  appendFileSync,  existsSync,  mkdirSync, 
    readdirSync, renameSync, rmSync, unlinkSync } from 'fs';

import { osu_file_beatmap_property, beatmap_data, songs_get_all_beatmaps,
    beatmap_event_type, beatmap_event_layer, scanner_options,
    osu_db_load, beatmap_property, RankedStatus } from 'osu-tools';

import * as config from  '../config';

import * as path from 'path';
import { backupFile, create_dir, filterUnique, getFilesSync } from './tools';

const osu_path = path.normalize(config.osu_path);
const songs_path = path.normalize(path.join(osu_path, 'Songs'));
const backup_path = path.normalize(config.backup_path);
const osu_db_path = path.join(config.osu_path, 'osu!.db');

const bp = osu_file_beatmap_property;

const props: osu_file_beatmap_property[] = [
    bp.events_animations,
    bp.events_backgrounds,
    bp.events_samples,
    bp.events_sprites,
    bp.events_videos,
    bp.general_beatmap_filename,
    bp.general_gamemode,
    bp.general_audio_filename,
    bp.metadata_beatmap_md5,
    bp.metadata_beatmapset_id,
    bp.metadata_beatmap_id,
    bp.hit_objects_count
];

const options: scanner_options =  { 
    is_read_only: true, 
    is_hit_objects_only_count: true 
};

console.time('complete');

try{
    create_dir(osu_path);

    if (config.backup_files){
        create_dir(backup_path);
    }

} catch (err: unknown) {
    throw new Error (err as string);
}

const delete_beatmaps_gamemode = [
    'delete_std_beatmaps',
    'delete_taiko_beatmaps',
    'delete_ctb_beatmaps',
    'delete_mania_beatmaps'
];

const config_has_delete_beatmaps = config[delete_beatmaps_gamemode[0] as keyof typeof config] ||
    config[delete_beatmaps_gamemode[1] as keyof typeof config] || config[delete_beatmaps_gamemode[2] as keyof typeof config] ||
    config[delete_beatmaps_gamemode[3] as keyof typeof config];

if (config.debug_cleanlogs){
    const log_files = [
        'delete_FilesNotInBeatmap', 'delete_Backgrounds', 'delete_Videos', 'delete_Samples', 'delete_BackgroundAnimations', 'delete_OtherAnimations',
        'delete_BackgroundSprites', 'delete_OtherSprites', 'unknown_file',
        'delete_FilesNotInBeatmap_failed', 'delete_Backgrounds_failed', 'delete_Videos_failed', 'delete_Samples_failed', 
        'delete_BackgroundAnimations_failed', 'delete_OtherAnimations_failed','delete_BackgroundSprites_failed', 'delete_OtherSprites_failed',
        'missing_BGs', 'missing_BGs_beatmaps_id',
        delete_beatmaps_gamemode[0], delete_beatmaps_gamemode[1],delete_beatmaps_gamemode[2],delete_beatmaps_gamemode[3]
    ];

    for (let file of log_files){
        try {
            unlinkSync(`${file}.txt`);
        } catch (e) {
            if (config.debug){
                console.log(`${file}.txt не был удален т.к. не существует`);
            }
        }
    }
}

const type_names: {name: string, type: beatmap_event_type, bg_name?: string}[] = [
    {name: 'bg', type: beatmap_event_type.background},
    {name: 'video', type: beatmap_event_type.video},
    {name: 'sample', type: beatmap_event_type.sample},
    {name: 'animation', type: beatmap_event_type.animation, bg_name: 'bga'},
    {name: 'sprite', type: beatmap_event_type.sprite, bg_name: 'bgs'},
];

const log_name: { [key:string]: string } = {
    bg: 'delete_Backgrounds',
    video: 'delete_Videos',
    sample: 'delete_Samples',
    bga: 'delete_BackgroundAnimations',
    animation: 'delete_OtherAnimations',
    bgs: 'delete_BackgroundSprites',
    sprite: 'delete_OtherSprites'
};

const set_bg_delete: string[] = ['video', 'bga', 'animation', 'bgs', 'sprite'];
const set_all_files: string[] = ['bg', 'video', 'sample', 'bga', 'animation', 'bgs', 'sprite']; //without audio

//удаление по статусу
const beatmap_statuses_result = osu_db_load(osu_db_path, [
    beatmap_property.folder_name,
    beatmap_property.osu_filename,
    beatmap_property.ranked_status
]);

for (let beatmap of beatmap_statuses_result.beatmaps){
    if (config.delete_graveyard_beatmaps && beatmap.ranked_status_int === RankedStatus.graveyard ){
        try {
            const beatmap_path = path.join(songs_path, beatmap.folder_name as string, beatmap.osu_filename as string);
            rmSync(beatmap_path);
            console.log('deleted', beatmap_path);
        } catch (e) {
            //file not exists
        }
    }
    if (config.delete_unsubmitted_beatmaps && beatmap.ranked_status_int === RankedStatus.unsubmitted ){
        try {
            const beatmap_path = path.join(songs_path, beatmap.folder_name as string, beatmap.osu_filename as string);
            rmSync(beatmap_path);
            console.log('deleted', beatmap_path);
        } catch (e) {
            //file not exists
        }
    }
}

songs_get_all_beatmaps( osu_path, props, options,
    ( beatmaps: beatmap_data[], current_folder: string ) => {

    const full_folder_path = path.join(songs_path, current_folder);

    const beatmap_files: { [key:string]: string[] } = {
        audio: [],
        bg: [],
        video: [],
        sample: [],
        bga: [],
        animation: [],
        bgs: [],
        sprite: [],
    };

    beatmaps.forEach( ({ general, events }) => {

        if (general.audio_filename && general.audio_filename.length>0){
            beatmap_files.audio.push(path.normalize(general.audio_filename.toLowerCase()));
        }

        if (events && events.length > 0) {
            events.forEach( ({file_name, type, layer}) => {

                if (file_name && file_name.length > 0) {
                    const name_lc = path.normalize(file_name.toLowerCase());

                    for (let x of type_names){
                        if (x.type === type){
                            let name = x.name;
                            if (x.bg_name)
                                if (layer === beatmap_event_layer.Background)
                                    name = x.bg_name;
                            beatmap_files[name].push(name_lc);
                        }
                    }

                } else {

                    if (config.debug){
                        appendFileSync("unknown_file.txt", path.join(current_folder, "???") + "\n");
                    }
                
                }

            });
        }

    });

    let FilesFromBeatmaps : string[] = [];

    for (let key of Object.keys(beatmap_files)){
        beatmap_files[key] = filterUnique(beatmap_files[key]);
        FilesFromBeatmaps = FilesFromBeatmaps.concat(beatmap_files[key]);
    }

    //получить список всех файлов
    const allFilesInFolder = getFilesSync(full_folder_path);

    const filesNotInBeatmap = allFilesInFolder
        .filter(file => FilesFromBeatmaps.indexOf(file) === -1)
        .filter(file => !file.endsWith('.osu') && !file.endsWith('.osb'));

    //убрать из списков бгшки
    if (!config.delete_Backgrounds){
        for (let key of set_bg_delete){
            beatmap_files[key] = beatmap_files[key].filter(file => beatmap_files.bg.indexOf(file) === -1);
        }
    }

    const BGFiles_in_beatmap =  beatmap_files.bg.slice();

    //оставить только существующие файлы
    for (let key of set_all_files){
        beatmap_files[key] = beatmap_files[key].filter(file => allFilesInFolder.indexOf(file) > -1);
    }
    
    //удаление файлов по каждой категории
    handleDeletion(current_folder, filesNotInBeatmap, 'delete_FilesNotInBeatmap');

    for (let key of set_all_files){
        handleDeletion(current_folder, beatmap_files[key], log_name[key]);
    }

    //проверка отсутствующих бг
    if (config.check_missing_bg){
        const missing_BGs = BGFiles_in_beatmap.filter( file => beatmap_files.bg.indexOf(file) === -1);

        if (missing_BGs.length > 0) {
            appendFileSync('missing_BGs.txt', `${current_folder}:\n${missing_BGs.join('\n')}\n` );

            let beatmapsetId = Number(current_folder.split(' ')[0]);
            if (isNaN(beatmapsetId))
                beatmapsetId = beatmaps[0].metadata.beatmapset_id || 0;

            if (beatmapsetId)
                appendFileSync('missing_BGs_beatmaps_id.txt', `${beatmapsetId}\n` );
            else 
                console.log('missing bg map is missing beatmapset id!', current_folder);
        }
    }

    //удаление по модам
    if (config_has_delete_beatmaps){
        delete_beatmaps_gamemode.forEach( (config_key, delete_gamemode ) => {
            
            if (config[config_key as keyof typeof config]){                    

                const beatmaps_delete_filenames: string[] =
                    beatmaps.filter(beatmap => beatmap.general.gamemode === delete_gamemode)
                    .map( b => b.general.beatmap_filename as string);

                handleDeletion(current_folder, beatmaps_delete_filenames, config_key);
            }
        });
    }
    
    //удаление пустых папок
    if (config.delete_empty_directories){
        let files_after_deletion = readdirSync(full_folder_path).filter( file => path.extname(file) === '.osu' );
        if (files_after_deletion.length === 0){
            if (config.debug){
                console.log('Need to delete the folder:', current_folder);
            } else if (config.backup_files){
                renameSync(full_folder_path, path.join( backup_path, current_folder) );
            } else {
                rmSync(full_folder_path, { recursive: true, force: true });
            }
        }
    }

});

console.timeEnd('complete');

function handleDeletion(currentFolderName: string, files: string[], configKey: string) {
    if (files.length === 0 || !config[configKey as keyof typeof config]) {
        return;
    }

    const logFile = `${configKey}${config.backup_files ? "_failed" : ""}.txt`;

    files.forEach(file => {
        const filePath =  path.join(songs_path, currentFolderName, file);
        try {
            if (config.debug) {
                appendFileSync( `${configKey}.txt`, `${currentFolderName}: ${file}\n` );
            } else if (config.backup_files) {
                backupFile( filePath, path.join( backup_path, currentFolderName, path.dirname(file) ) );
            } else {
                unlinkSync( filePath );
            }
        } catch (e) {
            console.log(e);
            appendFileSync(logFile, `${filePath}\n`);
        }
    });
}

