import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import path from "node:path";


export const create_dir = async (dir: string) => {
    if (dir && !existsSync(dir)) {
        mkdirSync(dir , { recursive: true });
    }
}

export const filterUnique = (array: any[]) => array.filter((value: any, index: any) => array.indexOf(value) === index);

export const getFilesSync = (dir: string, baseDir: string = '', files: string[] = []) => {
    if (!baseDir)
        baseDir = dir;
    const filesInDirectory = readdirSync( dir, {withFileTypes: true} );
    for ( const file of filesInDirectory ) {
        const filePath = path.join(dir, file.name);
        if ( file.isFile() )
            files.push( path.normalize(filePath.replace(baseDir, '').substring(1).toLowerCase()) );
        else if ( file.isDirectory() ) 
            getFilesSync(filePath, baseDir, files);
        
    }
    return files;
}

export const backupFile = (filePath: string, backupDir: string, backupFileName: string | null = null): void => {
    const fileName = backupFileName || path.basename(filePath);
    const backupPath = path.join(backupDir, fileName);

    if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
    }

    renameSync(filePath, backupPath);
}