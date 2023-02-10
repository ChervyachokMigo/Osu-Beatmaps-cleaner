
import { Dirent, appendFile, appendFileSync, 
    existsSync, 
    mkdirSync, 
    readdirSync, renameSync, unlink, unlinkSync } from 'fs';

import { osu_file_beatmap_property, beatmap_data, songs_get_all_beatmaps,
    beatmap_event_type, beatmap_event_layer, scanner_options } from 'osu_tools';

//import * as progress from './progress-bar.js';

import * as config from  './config.js';

import path from 'path';

const osu_path = path.normalize(config.osu_path);
const songs_path = path.normalize(path.join(osu_path, 'Songs'));

const bp = osu_file_beatmap_property;

const props: osu_file_beatmap_property[] = [
    bp.events_animations,
    bp.events_backgrounds,
    bp.events_samples,
    bp.events_sprites,
    bp.events_videos,
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
    checkAndCreateDirSync(config.osu_path);

    if (config.backup_files){
        checkAndCreateDirSync(config.backup_path);
    }

} catch (err: unknown) {
    throw new Error (err as string);
}


if (config.debug_cleanlogs){
    const log_files = [
        'delete_FilesNotInBeatmap', 'delete_Backgrounds', 'delete_Videos', 'delete_Samples', 'delete_BackgroundAnimations', 'delete_OtherAnimations',
        'delete_BackgroundSprites', 'delete_OtherSprites', 'unknown_file',
        'delete_FilesNotInBeatmap_failed', 'delete_Backgrounds_failed', 'delete_Videos_failed', 'delete_Samples_failed', 
        'delete_BackgroundAnimations_failed', 'delete_OtherAnimations_failed','delete_BackgroundSprites_failed', 'delete_OtherSprites_failed',
        'missing_BGs', 'missing_BGs_beamaps_id'
    ];

    for (let file of log_files){
        try {
            unlinkSync(`${file}.txt`);
        } catch (e) {
            console.log(`${file}.txt не был удален т.к. не существует`);
        }
    }
}



songs_get_all_beatmaps( osu_path, props, options,
    ( beatmaps: beatmap_data[], current_folder: Dirent ) => {

    var full_folder_path = path.join(songs_path, current_folder.name);

    //get unique files

    var FilesFromBeatmaps : string[] = [];

    var AudioFiles : string[] = [];
    var BGFiles : string[] = [];
    var VideoFiles : string[] = [];
    var SamplesFiles : string[] = [];
    var BackgroundAnimations : string[] = [];
    var OtherAnimations : string[] = [];
    var BackgroundSprites : string[] = [];
    var OtherSprites : string[] = [];
        
    beatmaps.forEach( (beatmap) => {

        if (beatmap.general.audio_filename && beatmap.general.audio_filename.length>0){
            AudioFiles.push(path.normalize(beatmap.general.audio_filename.toLowerCase()));
        }

        if (beatmap.events && beatmap.events.length > 0) {

            beatmap.events.forEach((ev) => {

            if (ev.file_name && ev.file_name.length > 0) {
            let event_filename_lowercase = path.normalize(ev.file_name.toLowerCase());
                switch (ev.type) {

                case beatmap_event_type.background:
                    BGFiles.push(event_filename_lowercase);
                    break;

                case beatmap_event_type.video:
                    VideoFiles.push(event_filename_lowercase);
                    break;

                case beatmap_event_type.sample:
                    SamplesFiles.push(event_filename_lowercase);
                    break;

                case beatmap_event_type.animation:

                    switch (ev.layer) {
                    case beatmap_event_layer.Background:
                        BackgroundAnimations.push(event_filename_lowercase);
                        break;

                    default:
                        OtherAnimations.push(event_filename_lowercase);
                        break;
                    }
                    break;

                case beatmap_event_type.sprite:
                    
                    switch (ev.layer) {
                    case beatmap_event_layer.Background:
                        BackgroundSprites.push(event_filename_lowercase);
                        break;
                    default:
                        OtherSprites.push(event_filename_lowercase);
                        break;
                    }
                    break;

                }

            } else {

                if (config.debug){
                    appendFileSync("unknown_file.txt", path.join(current_folder.name, "???") + "\n");
                }
            
            }

            });

        }

    });

    const filterUnique = (array: any[]) => array.filter((value: any, index: any) => array.indexOf(value) === index);

    AudioFiles = filterUnique(AudioFiles);
    BGFiles = filterUnique(BGFiles);
    VideoFiles = filterUnique(VideoFiles);
    SamplesFiles = filterUnique(SamplesFiles);
    BackgroundAnimations = filterUnique(BackgroundAnimations);
    OtherAnimations = filterUnique(OtherAnimations);
    BackgroundSprites = filterUnique(BackgroundSprites);
    OtherSprites = filterUnique(OtherSprites);

    const fileArrays = [
        AudioFiles, BGFiles, VideoFiles, SamplesFiles, BackgroundAnimations,
        OtherAnimations, BackgroundSprites, OtherSprites
    ]

    fileArrays.forEach( val => {
        if (val.length > 0) {
            FilesFromBeatmaps.push(...val);
        }
    });

    //get folder filelist
    const allFilesInFolder = getFilesSync(full_folder_path, full_folder_path);

    const filesNotInBeatmap = allFilesInFolder
        .filter(file => !FilesFromBeatmaps.includes(file))
        .filter(file => !file.endsWith('.osu') && !file.endsWith('.osb'));

    //убрать из списков бгшки
    if (!config.delete_Backgrounds){
        const filterBackgrounds = (filesList:string[]) => filesList.filter(file => !BGFiles.includes(file));
        VideoFiles = filterBackgrounds(VideoFiles);
        BackgroundAnimations = filterBackgrounds(BackgroundAnimations);
        OtherAnimations = filterBackgrounds(OtherAnimations);
        BackgroundSprites = filterBackgrounds(BackgroundSprites);
        OtherSprites = filterBackgrounds(OtherSprites);
    }

    const BGFiles_in_beatmap = BGFiles.slice();

    //оставить только существующие файлы
    const filterFilesInFolder = (filesList:string[]) => filesList.filter(file => allFilesInFolder.includes(file));

    BGFiles = filterFilesInFolder(BGFiles);
    VideoFiles = filterFilesInFolder(VideoFiles);
    SamplesFiles = filterFilesInFolder(SamplesFiles);
    BackgroundAnimations = filterFilesInFolder(BackgroundAnimations);
    OtherAnimations = filterFilesInFolder(OtherAnimations);
    BackgroundSprites = filterFilesInFolder(BackgroundSprites);
    OtherSprites = filterFilesInFolder(OtherSprites);
    
    handleDeletion(current_folder.name, filesNotInBeatmap, 'delete_FilesNotInBeatmap');

    handleDeletion(current_folder.name, BGFiles, 'delete_Backgrounds');
    handleDeletion(current_folder.name, VideoFiles, 'delete_Videos');
    handleDeletion(current_folder.name, SamplesFiles, 'delete_Samples');
    handleDeletion(current_folder.name, BackgroundAnimations, 'delete_BackgroundAnimations');
    handleDeletion(current_folder.name, OtherAnimations, 'delete_OtherAnimations');
    handleDeletion(current_folder.name, BackgroundSprites, 'delete_BackgroundSprites');
    handleDeletion(current_folder.name, OtherSprites, 'delete_OtherSprites');

    if (config.check_missing_bg){
        const missing_BGs = BGFiles_in_beatmap.filter( file => !BGFiles.includes(file) );
        if (missing_BGs.length > 0) {
            appendFileSync('missing_BGs.txt', `${current_folder.name}:\n${missing_BGs.join('\n')}\n` );

            let beatmapsetId;

            if (!isNaN(Number(current_folder.name.split(' ')[0]))) {
                beatmapsetId = Number(current_folder.name.split(' ')[0]);
            } else if (!isNaN(Number(beatmaps[0].metadata.beatmapset_id))) {
                beatmapsetId = Number(beatmaps[0].metadata.beatmapset_id);
            } else {
                console.log('missing bg map is missing beatmapset id!', current_folder.name);
            }

            if (beatmapsetId){
                appendFileSync('missing_BGs_beamaps_id.txt', `${beatmapsetId}\n` );
            }
            
        }
    }


});

console.timeEnd('complete');



function getFilesSync(dir: string, baseDir: string, files: string[] = []) {

    const filesInDirectory = readdirSync(dir, {withFileTypes: true});
  
    for ( const file of filesInDirectory ) {

        const filePath = path.join(dir, file.name);

        if ( file.isFile() ) {

            files.push( path.normalize(filePath.replace(baseDir, '').substring(1).toLowerCase()) );

        } else if ( file.isDirectory() ) {

            getFilesSync(filePath, baseDir, files);
        
        }
    }
  
    return files;
}



function checkAndCreateDirSync(dir: string){
    if (dir && !existsSync(dir)) {
        mkdirSync(dir , { recursive: true });
    }
}

function handleDeletion(currentFolderName: string, files: string[], configKey: string) {
    if (files.length === 0 || !config[configKey as keyof typeof config]) {
        return;
    }

    
    const logFile = `${configKey}${config.backup_files ? "_failed" : ""}.txt`;
    

    files.forEach(file => {
        const filePath =  path.join(songs_path, currentFolderName, file);
        try {
            if (config.debug) {
                appendFileSync( `${configKey}.txt`, `${currentFolderName}:\n${files.join('\n')}\n` );
            } else if (config.backup_files) {
                backupFile( filePath, path.join( config.backup_path, currentFolderName, path.dirname(file) ) );
            } else {
                unlinkSync( filePath );
            }
        } catch (e) {
            console.log(e)
            appendFileSync(logFile, `${filePath}\n`);
        }
    });
}

function backupFile(filePath: string, backupDir: string, backupFileName: string | null = null): void {
    const fileName = backupFileName || path.basename(filePath);
    const backupPath = path.join(backupDir, fileName);

    if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
    }

    renameSync(filePath, backupPath);
}