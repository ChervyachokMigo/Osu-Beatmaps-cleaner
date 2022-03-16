var log = console.log.bind(console)
var fs = require('fs')
var path = require('path')

const config = require('./config.js')
const progress = require('./progress-bar.js')
const ExplorerOsu = require("./ExplorerOsu.js")

const existsFile = (file) => {
	try {
		fs.accessSync(file, fs.constants.F_OK | fs.constants.R_OK);
		return true;
	} catch (e) {
		return false;
	}
}

function deleteFile(delfile){
	try{
		fs.unlinkSync(delfile)
	} catch (e) {
		if (config.debug){
			log (e)
		}
	}
}

function getPropery(data,symbol=':',position=1){
	var res = data.split(symbol)
	return res[position].trim()
}

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

function uniqueBG(bgs){
	if (bgs.length==0)
		return []
	let res = []
	for (var i = 0; i<bgs.length;i++){
		if(res.length>0){
			for (var k = 0; k<res.length;k++)
				if (res[k].bg_i.toLowerCase()!==bgs[i].bg_i.toLowerCase()) {
					res.push(bgs[i])
					break
				}
		} else {
			res.push(bgs[i])
		}
	}
	return res
}

function error1(vari){
	log(vari)
	throw new Error
}

function spritesWithoutBgAndAudio(spr, bgs, audios){
	if (spr.length==0)
		return []

	if(bgs.length > 0){
		for (var b=0;b<bgs.length;b++){
			spr = spr.filter(function(item) {
				return item !== bgs[b]
			})
		}
	}

	if(audios.length > 0){
		for (var a=0;a<audios.length;a++){
			spr = spr.filter(function(item) {
				return item !== audios[a].tempdata_audio
			})
		}
	}
	return spr
}

function uniqueAudio(el,id,arr){
	return el.fullpathaudio === arr[id].fullpathaudio
}

class CleanerOsu extends ExplorerOsu {

	BeatmapsDBDublicates = []

	bgExists = []
	bgEmpty = []

	tempSprites = []
	tempVideos = []
	tempBgs = []
	allFolderFiles = []
	otherFiles = []
	audioFiles = []
	bgFiles = []	
	deleteShortMapsFiles = []

	checkFileExists(filepath,filetype,idmap){
		if (existsFile(filepath) == true){
		    if (filetype=='sprite'){
		    	if (config.deletesprites == 1){
		    		if (config.logs == 1){
			    		fs.appendFileSync('deleted_sprites.txt', filepath+"\n");
			    	}
		    		if (config.debug == 0){
						try{
			    			fs.unlinkSync(filepath)
						} catch (e) {
							fs.appendFileSync('deleted_sprites.txt', filepath+"\n");
						}
			    	}
		    	}
		    }
		    if (filetype=='video'){
		    	if (config.deletevideos == 1){
		    		if (config.logs == 1){
		    			fs.appendFileSync('deleted_videos.txt', filepath+"\n");
		    		}
		    		if (config.debug == 0){
		    			try{
			    			fs.unlinkSync(filepath)
						} catch (e) {
							fs.appendFileSync('deleted_videos.txt', filepath+"\n");
						}
		    		}
		    	}
		    }
		    if (filetype=='bg'){
		    	return true
		    }
		} else {
			if (filetype=='bg'){
				if (config.checkexsitsbg == 1){
					if (idmap === -2 || idmap === -1){
						fs.appendFileSync('bg_not_exists.html', "[no link] "+filepath+"\n</br>");
					} else {
						if (config.bloodcat == 1){
							fs.appendFileSync('bg_not_exists.html',"<a href=https://api.chimu.moe/v1/download/"+idmap+"?n=1>"+filepath+"</a>\n</br>")
						}else{
							fs.appendFileSync('bg_not_exists.html',"<a href=https://osu.ppy.sh/beatmapsets/"+idmap+"/download>"+filepath+"</a>\n</br>")
						}
					}
					return false
				}
			}
			if (filetype=='audio'){
				if (config.checkaudioexists == 1){
					if (idmap === -2 || idmap === -1){
						fs.appendFileSync('audio_not_exists.html',"[no link] "+filepath+"\n</br>");
					} else {
						if (config.bloodcat == 1){
							fs.appendFileSync('audio_not_exists.html',"<a href=https://api.chimu.moe/v1/download/"+idmap+"?n=1>"+filepath+"</a>\n</br>")
						}else{
							fs.appendFileSync('audio_not_exists.html',"<a href=https://osu.ppy.sh/beatmapsets/"+idmap+"/download>"+filepath+"</a>\n</br>")
						}
					}
				}
			}
		}
	}

	checkInNotBeatmapFilesRecursive(fullpath,relativepath,allfoldersfilesArray){
		var fullpath_dir = (fullpath+"\\"+relativepath).toLowerCase()
		
		const DirTemp2 = fs.readdirSync(fullpath_dir, function(err, result) {
			if(err) console.log('error', err);
		})
		for (const file3 of DirTemp2){
			var fileinbeatmap = 0
			if (file3 !== undefined && file3 !== null && file3 !== '' && file3 !== '.' && file3 !== '..' ){
				for (var dirtemp2file of allfoldersfilesArray){
						if (dirtemp2file === (relativepath+"/"+file3).replace(/\\+/g, '/').replace(/^\/|\/$/g, '').toLowerCase() ){
							fileinbeatmap = 1
					}
				}
				if (fileinbeatmap == 0){
					var fullpathinnotbeatmap = (fullpath_dir+'\\'+file3).replace(/\\+/g, '\\').toLowerCase()
					var fileinbeatmapstatus = fs.lstatSync(fullpathinnotbeatmap)

					if (!fileinbeatmapstatus.isDirectory()) {
						if (config.logs == 1){
							fs.appendFileSync('files_not_in_beatmaps.txt', fullpathinnotbeatmap+"\n");
						}
						if (config.debug == 0){
							try{
								fs.unlinkSync(fullpathinnotbeatmap)
							} catch (e) {
								fs.appendFileSync('files_not_in_beatmaps.txt', filepath+"\n");
							}
							
						}
					}	else{
							this.checkInNotBeatmapFilesRecursive(fullpath,(relativepath+"\\"+file3).replace(/^\/|\/$/g, '').toLowerCase(),allfoldersfilesArray)
					}
				}
			}
		}
	}

	prepareTasks(task){
		let tasks = []
		if (task==1){
			if (config.deletesprites == 1){
				tasks.push ("Delete storyboards")
			}
			if (config.deletevideos == 1){
				tasks.push ("Delete videos")
			}
			if (config.deleteFilesNotInBeatmap == 1){
				tasks.push ("Delete skins, hitsounds")
			}
			if (config.deletestd == 1){
				tasks.push ("Delete osu!standart maps")
			}
			if (config.deletetaiko == 1){
				tasks.push ("Delete osu!taiko maps")
			}
			if (config.deletemania == 1){
				tasks.push ("Delete osu!mania maps")
			}
			if (config.deletectb == 1){
				tasks.push ("Delete osu!catch the beat maps")
			}
			if (config.deleteshortmaps == 1){
				tasks.push ("Delete short maps with < "+config.MinHitObjects+" hit objects")
			}
			if (config.checkexsitsbg == 1){
				tasks.push ("Checking bg exists")
				if (config.replaceEmptyBG == 1){
					tasks.push (" * Finding empty BGs")
				}
			}
			if (config.checkaudioexists == 1){
				tasks.push ("Checking audio exists")
			}
			if (config.deletebeatmapsdublicates == 1){
				tasks.push ("Drafting beatmaps list for dublicates")
			}
		}
		if (task==2){
			tasks.push ("Delete dublicates")
		}
		if (task==3){
			tasks.push ("Checking bg exists")
			tasks.push (" * Replacing BGs... ("+ Length +")")
		}
		if (task==4){
			if (config.deleteEmptyDir == 1){
				tasks.push ("Delete empty dirs")
			}
		}
		return tasks
	}

	checkForEmptyDirs(){
		if (config.deleteEmptyDir == 1){

			let SongsDir = fs.readdirSync(config.Songspath, function(err) {
			if(err) {
				log ("Incorrect path to Songs")
				throw new Error('Incorrect path to Songs')
			}
			})


			progress.setDefault(SongsDir.length,this.prepareTasks(4))

		  	for (let folder of SongsDir){

				progress.print()


	 			if (folder){
		  			let filePathTemp = (config.Songspath+'\\'+folder).replace(/\/+/g, '\\').replace(/\\+/g, '\\')
			   	 	let fileTemp = fs.lstatSync(filePathTemp)

			   		if (fileTemp.isDirectory()){

						let DirTemp = fs.readdirSync(filePathTemp)
			   			let findEmpty = 1
			   			for (const checkingfile of DirTemp){
			   				if (typeof checkingfile !== 'undefined' ){
			   					if (path.extname(checkingfile) === '.osu'){
			   						findEmpty=0
			   					}

			   			}}// end every file in folder

			   			if (config.deleteEmptyDir == 1 && findEmpty==1){
			   				if (config.debug == 0){
				   				fs.rmdirSync(filePathTemp, { recursive: true })
				   			}
				   			if (config.logs == 1){
				   				fs.appendFileSync('deleted_dirs.txt', filePathTemp+"\n");
				   			}
			   			}

			}}}//end every folder

		}
	}

	Prepare(){
		progress.setDefault(this.SongsDir.length,this.prepareTasks(1))
		if (config.debug_cleanlogs){
			deleteFile("deleted_beatmaps.txt")
			deleteFile("deleted_shortmaps.txt")
			deleteFile("deleted_dublicated_files.txt")
			deleteFile("replaced_bgs.txt")
			deleteFile("deleted_sprites.txt")
			deleteFile("deleted_videos.txt")
			deleteFile("files_not_in_beatmaps.txt")
			deleteFile("deleted_dirs.txt")
			deleteFile("bg_not_exists.html")
			deleteFile("audio_not_exists.html")

			log("All Logs cleared.")
		}
	}

	StartCheckingSubSongs(){
		progress.print()

		this.tempVideos.length = 0
		this.tempSprites.length = 0
		this.tempBgs.length = 0
		this.allFolderFiles.length = 0
		this.otherFiles.length = 0
		this.audioFiles.length = 0
		this.bgFiles.length = 0
		this.deleteShortMapsFiles.length = 0
	}

	checkFileSubSongs(){
		
		var isOsu = path.extname(this.checkingfile) === '.osu';
		var isOsb = path.extname(this.checkingfile) === '.osb';

		if ( !isOsu && !isOsb) return false


		var tempdatafilename = this.CheckFileFullPath.toLowerCase().replace(/\/+/g, '\\').replace(/\\+/g, '\\')

		var tempdata = fs.readFileSync(this.CheckFileFullPath,'utf8')			
		this.otherFiles.push(this.checkingfile.toLowerCase())
		tempdata = tempdata.toString().split("\n");

		var eventscheck = 0
		var tempdata_beatmapid = 0
		var tempdata_beatmapsetid = -2
		var fullpathaudio = ""
		var tempdata_audio = ""
		var tempdata_mode = ""
		//var tempdata_diff = ""
		var HitObjectsFind = 0
		var HitObjects = 0

		for(var i in tempdata) {

			if(tempdata[i].startsWith("AudioFilename:") ){
				tempdata_audio = getPropery(tempdata[i]).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
				fullpathaudio = (this.checkingSubSongsPath+"\\"+tempdata_audio).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
				this.otherFiles.push(tempdata_audio)
			}

			if(tempdata[i].startsWith("BeatmapID:") ){
				tempdata_beatmapid = parseInt(getPropery(tempdata[i]))
			}

			if(tempdata[i].startsWith("BeatmapSetID:") ){
				tempdata_beatmapsetid = parseInt(getPropery(tempdata[i]))
			}

			if(tempdata[i].startsWith("Mode:") ){
				tempdata_mode = getPropery(tempdata[i])
				if ((tempdata_mode == "0" && config.deletestd == 1) || 
					(tempdata_mode == "1" && config.deletetaiko == 1) ||
					(tempdata_mode == "2" && config.deletectb == 1) ||
					(tempdata_mode == "3" && config.deletemania == 1)){

					if (config.logs == 1){
						fs.appendFileSync('deleted_beatmaps.txt',  this.CheckFileFullPath+"\n");
					}
					if (config.debug == 0){
						try{
							fs.unlinkSync(this.CheckFileFullPath)
						} catch (e){
							fs.appendFileSync('deleted_beatmaps.txt', e+"\n");
						}
					}
				}
			}
			
			if (tempdata[i].startsWith("[Events]") === true){
				if (config.deletesprites == 1 || config.deleteFilesNotInBeatmap == 1 ||
				config.deletevideos== 1 || config.checkexsitsbg == 1){

					eventscheck = 1
				}
			}

			if (tempdata[i].startsWith("[TimingPoints]") === true || tempdata[i].startsWith("[HitObjects]") === true){
				eventscheck = 0
			}

			if (eventscheck == 1){
						//не нужные строки
				if (tempdata[i].length == 0 || tempdata[i].length == 1 || tempdata[i].length == 2 ||
					tempdata[i].startsWith("[Events]") === true ||
					tempdata[i].startsWith("//") === true ||
					tempdata[i].startsWith(",") === true ||

					tempdata[i].startsWith(" V,") === true  ||
					tempdata[i].startsWith("  V,") === true  ||
					tempdata[i].startsWith(" S,") === true  ||
					tempdata[i].startsWith("_S,") === true  ||
					tempdata[i].startsWith("  S,") === true  ||
					tempdata[i].startsWith(" R,") === true  ||
					tempdata[i].startsWith("  R,") === true  ||
					tempdata[i].startsWith("_R,") === true  ||
					tempdata[i].startsWith("__R,") === true  ||
					tempdata[i].startsWith(" M,") === true  ||
					tempdata[i].startsWith("_M,") === true  ||
					tempdata[i].startsWith(" N,") === true  ||
					tempdata[i].startsWith("  M,") === true  ||
					tempdata[i].startsWith(" L,") === true  ||
					tempdata[i].startsWith("_F,") === true  ||
					tempdata[i].startsWith("__F,") === true  ||
					tempdata[i].startsWith(" F,") === true  ||
					tempdata[i].startsWith("  F,") === true  ||
					tempdata[i].startsWith(" C,") === true  ||
					tempdata[i].startsWith("  C,") === true  ||
					tempdata[i].startsWith(" MY,") === true  ||
					tempdata[i].startsWith("__MY,") === true  ||
					tempdata[i].startsWith("_MY,") === true  ||
					tempdata[i].startsWith("  MY,") === true  ||
					tempdata[i].startsWith(" MX,") === true  ||
					tempdata[i].startsWith("__MX,") === true  ||
					tempdata[i].startsWith("_MX,") === true  ||
					tempdata[i].startsWith("  MX,") === true  ||
					tempdata[i].startsWith(" P,") === true ||
					tempdata[i].startsWith("_P,") === true  ||
					tempdata[i].startsWith("  P,") === true ||
					tempdata[i].startsWith(" T,") === true ||
					tempdata[i].startsWith("_L,") === true  ||
					tempdata[i].startsWith("2,") === true ||
					tempdata[i].startsWith("3,") === true
				) {
					//ничего не делать
				} else {						
					if (tempdata[i].startsWith("Animation,") === true || 
					tempdata[i].startsWith("Sprite,") === true || 
					tempdata[i].startsWith("Sample,") === true ||	
					tempdata[i].startsWith("4,") === true  ||
					tempdata[i].startsWith("5,") === true  ||
					tempdata[i].startsWith("6,") === true ){
						this.tempSprites.push(getPropery(tempdata[i],',',3).replace(/"/g, "").replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase())
					}
					

					if (tempdata[i].startsWith("1,") === true || //video
					tempdata[i].startsWith("Video,") === true){
						this.tempVideos.push(getPropery(tempdata[i],',',2).replace(/"/g, "").replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase())
					}

					if(tempdata[i].startsWith("0,") === true){  //bg
						
						this.tempBgs.push(getPropery(tempdata[i],',',2).replace(/"/g, "").replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase())
						
					}
				}

			}

			
			if (config.deleteshortmaps == 1){
					
				if (tempdata[i].startsWith("[")== true ){
					HitObjectsFind = 0
				}

				if (tempdata[i].toLowerCase().startsWith("[hitobjects]") == true ){
					HitObjectsFind = 1
				}

				if (HitObjectsFind == 1){
					HitObjects++
				}

			}
		}	//end for
		
		if (config.deletebeatmapsdublicates == 1){
			if ( isOsu ){
				if ( tempdata_beatmapid === 0 ||  tempdata_beatmapsetid ===-1 || tempdata_beatmapsetid ===-2 ){
					//do nothing
					
				} else {
					var NewBeatmap = {
						BeatmapID: tempdata_beatmapid,
						BeatmapSetID: tempdata_beatmapsetid,
						BeatmapFilename: tempdatafilename,
						BeatmapFolder: this.CurrentCheckingDir
					}

					this.BeatmapsDBDublicates.push(NewBeatmap)
					
				}
			}
		}

		for (const bg_i of this.tempBgs){
			this.bgFiles.push({bg_i, tempdata_beatmapsetid})
		}
		
		if (fullpathaudio !== ""){
			this.audioFiles.push({fullpathaudio, tempdata_beatmapsetid, tempdata_audio})
		}
		
		if (config.deleteshortmaps == 1 && HitObjects<config.MinHitObjects){
			if ( isOsu ){
				let objdeleteshortmap = {HitObjects: HitObjects, FullMapPath: this.CheckFileFullPath}
				this.deleteShortMapsFiles.push(objdeleteshortmap)
			}
		}		
	}

	endCheckSubSongs(){
		//uniques
		if (config.deletesprites == 1 || config.deleteFilesNotInBeatmap == 1){
			this.tempSprites = this.tempSprites.filter(onlyUnique)
		}
		
		if (config.deletevideos== 1 || config.deleteFilesNotInBeatmap == 1 ){
			this.tempVideos = this.tempVideos.filter(onlyUnique)
		}
		
		if (config.deletesprites == 1 || config.checkexsitsbg == 1 || config.deleteFilesNotInBeatmap == 1){
			
			this.bgFiles = uniqueBG (this.bgFiles)

			this.tempBgs.length = 0
			for (var tempbg of this.bgFiles){
				this.tempBgs.push (tempbg.bg_i)
			}				
			
			this.tempBgs = this.tempBgs.filter(onlyUnique)
			
		}

		if (config.checkaudioexists == 1 || config.deletesprites == 1 || config.deleteFilesNotInBeatmap == 1 ){
			this.audioFiles = this.audioFiles.filter(uniqueAudio)
		}

		if (config.deletesprites == 1){
			this.tempSprites = spritesWithoutBgAndAudio(this.tempSprites,this.tempBgs,this.audioFiles)

			for (var tempsprite of this.tempSprites){
				
				var fullpathprite = ( this.checkingSubSongsPath+"\\"+tempsprite).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()

				  this.checkFileExists(fullpathprite,'sprite',-2)
			}
		}

		if (config.deletevideos== 1){
			for (var tempvideo of this.tempVideos){
				var fullpathvideo = ( this.checkingSubSongsPath+"\\"+tempvideo).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
				  this.checkFileExists(fullpathvideo,'video',-2)
				
			}
		}

		if (config.checkaudioexists == 1){
			for (var tempAudio of this.audioFiles){
				this.checkFileExists(tempAudio.fullpathaudio,'audio',tempAudio.tempdata_beatmapsetid)
			}
		}

		if (config.checkexsitsbg == 1){

			for (var bgFile of this.bgFiles){
				var fullpathbg = ( this.checkingSubSongsPath+"\\"+bgFile.bg_i).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
				var isBG = this.checkFileExists(fullpathbg, 'bg', bgFile.tempdata_beatmapsetid)
				let bgName = bgFile.bg_i
				let bgSetID = bgFile.tempdata_beatmapsetid
				let thispathfolder = this.checkingSubSongsPath
				if (config.replaceEmptyBG == 1 && isBG === true){

					this.bgExists.push ({fullpathbg, thispathfolder , bgName, bgSetID})
				}
				if (config.replaceEmptyBG == 1 && isBG === false){
					this.bgEmpty.push ({fullpathbg, thispathfolder , bgName, bgSetID})
				}
			}
		}

		if (config.deleteFilesNotInBeatmap == 1){
			this.allFolderFiles = this.tempSprites.concat(this.tempBgs).concat(this.tempVideos).concat(this.otherFiles)
			this.allFolderFiles = this.allFolderFiles.filter(onlyUnique)
			this.checkInNotBeatmapFilesRecursive(this.checkingSubSongsPath,"",this.allFolderFiles)
		}

		if (config.deleteshortmaps == 1){

			if (config.logs == 1){
				for (var tempshortmap of this.deleteShortMapsFiles){
					   fs.appendFileSync('deleted_shortmaps.txt', tempshortmap.HitObjects+" "+tempshortmap.FullMapPath+"\n");
				   }
				   
			   }
			   if (config.debug==0){
				for (var tempshortmap of this.deleteShortMapsFiles){
					try{
						fs.unlinkSync(tempshortmap.FullMapPath)
					} catch (e){
						fs.appendFileSync('deleted_shortmaps.txt', e+"\n");
					}
				   }
			}
		}
	}

	replaceAllBG(){
		//замена фонов рандомными
		if (config.checkexsitsbg == 1){
			if (config.replaceEmptyBG == 1){

				progress.setDefault(this.bgEmpty.length,this.prepareTasks(3))

				for (var bge of this.bgEmpty){
					var bgCopy_IndexRandom = Math.floor(Math.random() * this.bgExists.length)
					if (!accessSync(bge.fullpathbg)){
						if (errorBgExists.code === 'ENOENT'){
							fs.copyFile( this.bgExists[bgCopy_IndexRandom].fullpathbg, bge.fullpathbg )
							if (config.logs == 1){
								fs.appendFileSync('replaced_bgs.txt', "copy "+this.bgExists[bgCopy_IndexRandom].fullpathbg+" to "+bge.fullpathbg+"\n");
							}
						}
					}

					progress.print()
				}
			}
		}	//end checkexsitsbg replaceEmptyBG
	}

	deleteDublicateOsuFiles(){
		if (config.deletebeatmapsdublicates == 1){			
			var beatmapsDB_sorting = []
			var beatmapsDB_dublicates = []

			progress.setDefault(this.BeatmapsDBDublicates.length,this.prepareTasks(2))

			this.BeatmapsDBDublicates.filter(function(el){
				var i = beatmapsDB_sorting.findIndex(x=> 
					x.BeatmapID === el.BeatmapID && 
					x.BeatmapSetID === el.BeatmapSetID && 
					x.BeatmapFolder !== el.BeatmapFolder )

				if(i <= -1){
			      beatmapsDB_sorting.push(el);
				} else {
					el.DublicateBeatmap = beatmapsDB_sorting[i]
					beatmapsDB_dublicates.push(el)
				}

				progress.print()

				return false
			})
			this.BeatmapsDBDublicates = beatmapsDB_sorting

			log ("Dublicated finded: "+beatmapsDB_dublicates.length)
			//fs.writeFileSync('BeatmapsDB.json',JSON.stringify(this.BeatmapsDB));
			//fs.writeFile('beatmapsDB_dublicates.json',JSON.stringify(beatmapsDB_dublicates));

			for (var dublicated_beatmap of beatmapsDB_dublicates){

				if (config.logs == 1){
					//fs.appendFileSync('deleted_dublicated_files.txt', `${dublicated_beatmap.DublicateBeatmap.BeatmapFilename} => ${dublicated_beatmap.BeatmapFilename}\n`);
					fs.appendFileSync('deleted_dublicated_files.txt', `${dublicated_beatmap.BeatmapFilename}\n`);
				}
				if (config.debug==0){
					try{
						fs.unlinkSync(dublicated_beatmap.BeatmapFilename)
					} catch (e){
						fs.appendFileSync('deleted_dublicated_files.txt', e+"\n");
					}
				}
			}
			log ("All Dublicated Deleted.")

		}
	}

	run(){
		this.Explore()
		this.deleteDublicateOsuFiles()
		this.replaceAllBG()
		this.checkForEmptyDirs();
	}

}

mainloop = function(){
	var CleanerOsu1 = new CleanerOsu("C:\\osu",config.Songspath)

	var StartScriptTime = new Date()
	CleanerOsu1.run()
	var EndScriptTime = new Date()

	var diffTime = (EndScriptTime - StartScriptTime )/60000
	log("start: "+StartScriptTime)
	log("end: "+EndScriptTime)
	log("diff: "+diffTime+" min")
}
mainloop()
