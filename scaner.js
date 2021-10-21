var log = console.log.bind(console)
var fs = require('fs').promises
var path = require('path')

var progressbar, progressbar_empty

function ProgressBarDefault(){
	progressbar = ""
	progressbar_empty = "▄▄▄▄▄▄▄▄▄▄"
}

function PrintProcents(procent){

	if ((procent*10 % 100) < 1){
		progressbar_empty = progressbar_empty.substring(0, progressbar_empty.length - 1);
		progressbar = progressbar + "█"
	}
	log ("╔══════════╗")
	log ("║"+progressbar+progressbar_empty+"║")
	log ("╚══════════╝")
	log (procent + "% ")
}

var scanner = {
	//путь к папке Songs (обратный слеш в пути экранируется еще одним - \\ )
	Songspath: 'H:\\Songs',

	///////////////////
	//1 = да, 0 = нет
	///////////////////
	//Удаляет пустые папки без найденных osu файлов
	deleteEmptyDir: 1,
	//удаляет спрайты/сториборды карт и часть хитсаундов
	deletesprites: 1,
	//удаляет видео карт
	deletevideos: 1,
	//удаляет скины, хитсаунды и файлы не относящиеся к карте
	deleteFilesNotInBeatmap: 1,
	//поиск дубликатов
	deletebeatmapsdublicates: 1,
	//удалить все карты стандартной осу
	deletestd: 0,
	//удалить карты тайко
	deletetaiko: 1,
	//удалить карты мании
	deletemania: 1,
	//удалить карты catch the beat
	deletectb: 1,

	//проверка отсутствующих бекграундов, результаты будут в txt файле
	checkexsitsbg: 0,
	//заменять отсутствующие бг рандомными
	replaceEmptyBG: 1,

	//проверка отсутствующих аудио файлов, результаты будут в txt файле
	checkaudioexists: 0,
	

	//не удалять файлы (режим отладки скрипта)
	debug: 0,
	//писать в txt файлы, что удалено. Не влияет на checkexsitsbg, checkaudioexists
	logs: 0,
	//заменить ссылки на bloodcat
	bloodcat: 1,

	BeatmapsDB: [],

	checkFileExists: async function(filepath,filetype,idmap){
	  	try
	  	{
		    await fs.access(filepath, fs.F_OK)
		    if (filetype=='sprite'){
		    	if (this.deletesprites == 1){
		    		if (this.logs == 1){
			    		await fs.appendFile('deleted_sprites.txt', filepath+"\n");
			    	}
		    		if (this.debug == 0){
		    			//log ("s")
			    		try{await fs.unlink(filepath)}catch(e){
			    			//donothing
			    		}
			    	}
		    	}
		    }
		    if (filetype=='video'){
		    	if (this.deletevideos == 1){
		    		if (this.logs == 1){
		    			await fs.appendFile('deleted_videos.txt', filepath+"\n");
		    		}
		    		if (this.debug == 0){
		    			//log ("v")
		    			await fs.unlink(filepath)
		    		}
		    	}
		    }
		    if (filetype=='bg'){
		    	return true
		    }
	  	} catch(error) {
			if (error.code === 'ENOENT') {
			  	if (filetype=='bg'){
			  		if (this.checkexsitsbg == 1){
			  			if (idmap === "-2" || idmap === "-1"){
			  				//log ("b")
				    		await fs.appendFile('bg_not_exists.html', "[no link] "+filepath+"\n</br>");
				    	} else {
				    		if (this.bloodcat == 1){
				    			await fs.appendFile('bg_not_exists.html',"<a href=https://api.chimu.moe/v1/download/"+idmap+"?n=1>"+filepath+"</a>\n</br>")
				    		}else{
				    			await fs.appendFile('bg_not_exists.html',"<a href=https://osu.ppy.sh/beatmapsets/"+idmap+"/download>"+filepath+"</a>\n</br>")
				    		}
				    	}
				    	return false
				    }
				}
				if (filetype=='audio'){
			    	if (this.checkaudioexists == 1){
			    		//log ("a")
			    		if (idmap === "-2" || idmap === "-1"){
			    			await fs.appendFile('audio_not_exists.html',"[no link] "+filepath+"\n</br>");
			    		} else {
			    			if (this.bloodcat == 1){
				    			await fs.appendFile('audio_not_exists.html',"<a href=https://api.chimu.moe/v1/download/"+idmap+"?n=1>"+filepath+"</a>\n</br>")
				    		}else{
				    			await fs.appendFile('audio_not_exists.html',"<a href=https://osu.ppy.sh/beatmapsets/"+idmap+"/download>"+filepath+"</a>\n</br>")
				    		}
				    	}
			    	}
			    }
			} else {
				throw 'unknown error'
			}
		}
	},

	checkInNotBeatmapFilesRecursive: async function(fullpath,relativepath,allfoldersfilesArray){
		var fullpath_dir = (fullpath+"\\"+relativepath).toLowerCase()
		
		const DirTemp2 = await fs.readdir(fullpath_dir)
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
					var fileinbeatmapstatus = await fs.lstat(fullpathinnotbeatmap)

					if (!fileinbeatmapstatus.isDirectory()) {
						if (this.logs == 1){
							await fs.appendFile('files_not_in_beatmaps.txt', fullpathinnotbeatmap+"\n");
						}
						if (this.debug == 0){
							await fs.unlink(fullpathinnotbeatmap)
						}
					}	else{
							await this.checkInNotBeatmapFilesRecursive(fullpath,(relativepath+"\\"+file3).replace(/^\/|\/$/g, '').toLowerCase(),allfoldersfilesArray)
					}
				}
			}
		}
	},

	run: async function(){
		var SongsDir
		try{
		  	SongsDir = await fs.readdir(this.Songspath);
		}catch(errorSongsPath){
			if (errorSongsPath.code === 'ENOENT'){
				log ("Incorrect path to Songs")
			}
			return
		}
	  	var rd 
	  	var itemnum = 0
	  	var itemnumproc = 0
	  	ProgressBarDefault()

		var bgExists = []
		var bgEmpty = []

 		for (const folder of SongsDir){

			if (itemnum % (SongsDir.length/1000) < 1 ){
 				process.stdout.write('\033c')
 				itemnumproc = Math.trunc(itemnum / SongsDir.length * 1000) / 10
 				log ("[Tasks]")
 				if (this.deletesprites == 1){
 					log ("Delete storyboards")
 				}
 				if (this.deletevideos == 1){
 					log ("Delete videos")
 				}
 				if (this.deleteFilesNotInBeatmap == 1){
 					log ("Delete skins, hitsounds")
 				}
 				if (this.deletestd == 1){
 					log ("Delete osu!standart maps")
 				}
 				if (this.deletetaiko == 1){
 					log ("Delete osu!taiko maps")
 				}
 				if (this.deletemania == 1){
 					log ("Delete osu!mania maps")
 				}
 				if (this.deletectb == 1){
 					log ("Delete osu!catch the beat maps")
 				}
 				if (this.deleteEmptyDir == 1){
 					log ("Delete empty dirs")
 				}
 				if (this.checkexsitsbg == 1){
 					log ("Checking bg exists")
 					if (this.replaceEmptyBG == 1){
 						log (" * Finding empty BGs")
 					}
 				}
 				if (this.checkaudioexists == 1){
 					log ("Checking audio exists")
 				}
 				log ("")
 				log ("Processing...")
		 		PrintProcents(itemnumproc)
			}
	   	 
	   		itemnum++

	  		if (folder !== undefined && folder !== null && folder !== '' && folder !== '.' && folder !== '..' ){
	  			var filePathTemp = (this.Songspath+'\\'+folder).replace(/\/+/g, '\\').replace(/\\+/g, '\\')
		   	 	var fileTemp = await fs.lstat(filePathTemp)

		   		if (fileTemp.isDirectory()){

		   			const DirTemp = await fs.readdir(filePathTemp)
		   			var findEmpty = 1

		   			var tempSprites = []
		   			tempSprites.length = 0
		   			var tempVideos = []
		   			tempVideos.length = 0
		   			var tempBgs = []
		   			tempBgs.length = 0
		   			var allFolderFiles = []
					allFolderFiles.length = 0
					var otherFiles = []
					otherFiles.length = 0
					var audioFiles = []
					audioFiles.length = 0
					var bgFiles = []
					bgFiles.length = 0			

		   			for (const checkingfile of DirTemp){
		   				if (checkingfile !== undefined && checkingfile !== null && checkingfile !== '' && checkingfile !== '.' && checkingfile !== '..' ){
		   					
		   					if (path.extname(checkingfile)=='.osu' || path.extname(checkingfile)=='.osb'){

		   						var tempdata = await fs.readFile((filePathTemp+"\\"+checkingfile).replace(/\/+/g, '\\').replace(/\\+/g, '\\'),'utf8')
		   						
			   					otherFiles.push(checkingfile.toLowerCase())

		   						tempdata = tempdata.toString().split("\n");
		   						
		   						var eventscheck = 0
		   						var tempdata_beatmapid = "0"
		   						var tempdata_beatmapsetid = "-2"
		   						var fullpathaudio = ""
		   						var tempdata_audio = ""
		   						var tempdatafilename = ""
		   						var tempdata_mode = ""
		   						var tempdata_diff = ""

		   						if (this.deleteEmptyDir == 1){
		   							if (path.extname(checkingfile)=='.osu'){
			   							findEmpty=0
			   						}
		   						}

		   						for(i in tempdata) {
		   								
	   								if (this.checkaudioexists == 1 || this.deleteFilesNotInBeatmap == 1 || this.deletebeatmapsdublicates == 1 || this.checkexsitsbg == 1){

	   									if(tempdata[i].startsWith("AudioFilename:") ){
												tempdata_audio = tempdata[i].split(":")
												tempdata_audio = (tempdata_audio[1].trim()).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
												fullpathaudio = (filePathTemp+"\\"+tempdata_audio).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
												otherFiles.push(tempdata_audio)
											}
		   								if(tempdata[i].startsWith("BeatmapID:") ){
	   										tempdata_beatmapid = tempdata[i].split(":")
	   										tempdata_beatmapid =  tempdata_beatmapid[1].trim()

		   								}
		   								if(tempdata[i].startsWith("BeatmapSetID:") ){
	   										tempdata_beatmapsetid = tempdata[i].split(":")
	   										tempdata_beatmapsetid =  tempdata_beatmapsetid[1].trim()
	   									}
	   									if(tempdata[i].startsWith("Version:") ){
	   										tempdata_diff = tempdata[i].split(":")
	   										tempdata_diff =  tempdata_diff[1].trim()
	   									}
	   									tempdatafilename = (folder+"\\"+checkingfile).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
	   								}

	   								if (this.deletectb == 1 || this.deletemania == 1 ||this.deletetaiko == 1 ||this.deletestd == 1 ){
	   									if(tempdata[i].startsWith("Mode:") === true){
	   										tempdata_mode = tempdata[i].split(":")
	   										tempdata_mode = tempdata_mode[1].trim()
	   										if ((tempdata_mode == "0" && this.deletestd == 1) || 
	   											(tempdata_mode == "1" && this.deletetaiko == 1) ||
	   											(tempdata_mode == "2" && this.deletectb == 1) ||
	   											(tempdata_mode == "3" && this.deletemania == 1)){

	   											if (this.logs == 1){
	   												await fs.appendFile('deleted_beatmaps.txt', filePathTemp+"\\"+checkingfile+"\n");
	   											}
	   											if (this.debug == 0){
	   												await fs.unlink(filePathTemp+"\\"+checkingfile)
	   											}
	   										}
	   									}
	   								}

	   								if (this.deletesprites== 1 || this.deletevideos == 1 || this.checkexsitsbg == 1 || this.deleteFilesNotInBeatmap == 1){
	   									var tempdata_sprite = ""
	   									var tempdata_video = ""
	   									var tempdata_bg = ""
		   								if (tempdata[i].startsWith("[Events]") === true){
		   									eventscheck = 1
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

		   										if (this.deletesprites == 1 || this.deleteFilesNotInBeatmap == 1){
			   										if (tempdata[i].startsWith("Animation,") === true || 
				   									tempdata[i].startsWith("Sprite,") === true || 
				   									tempdata[i].startsWith("Sample,") === true ||	
													tempdata[i].startsWith("4,") === true  ||
													tempdata[i].startsWith("5,") === true  ||
													tempdata[i].startsWith("6,") === true ){

			   											tempdata_sprite = tempdata[i].split(",")
			   											tempdata_sprite = tempdata_sprite[3].replace(/"/g, "").trim().replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
														tempSprites.push(tempdata_sprite)
													}
													
												}

												if (this.deletevideos== 1 || this.deleteFilesNotInBeatmap == 1){
													if (tempdata[i].startsWith("1,") === true || //video
													tempdata[i].startsWith("Video,") === true){

														tempdata_video = tempdata[i].split(",")
			   											tempdata_video = tempdata_video[2].replace(/"/g, "").trim().replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
													   	tempVideos.push(tempdata_video)
													}
												}

												if (this.checkexsitsbg == 1 || this.deletesprites == 1 || this.deleteFilesNotInBeatmap == 1){
		   											if(tempdata[i].startsWith("0,") === true){  //bg

			   											tempdata_bg = tempdata[i].split(",")
			   											tempdata_bg = tempdata_bg[2].replace(/"/g, "").trim().replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
												      	tempBgs.push(tempdata_bg)
													}
												}
		   									}

		   								}

									} 

								}	//end for

								if (this.deletebeatmapsdublicates == 1){
									if (path.extname(checkingfile)=='.osu'){
										if ( tempdata_beatmapid === "0" ||  tempdata_beatmapsetid ==="-1" || tempdata_beatmapsetid ==="-2" ){
											//do nothing
											
										}else {
											var NewBeatmap = {
												"BeatmapID":tempdata_beatmapid,
												"BeatmapSetID":tempdata_beatmapsetid,
												"BeatmapFilename":tempdatafilename,
												"BeatmapDifficulty":tempdata_diff
											}

											this.BeatmapsDB.push(NewBeatmap)
											
										}
									}
				   				}

				   				if (this.checkexsitsbg == 1 || this.deleteFilesNotInBeatmap == 1 || this.deletesprites == 1){
				   					for (var bg_i of tempBgs){
				   						bgFiles.push({bg_i, tempdata_beatmapsetid})
				   					}
				   				}

				   				if (this.checkaudioexists == 1 || this.deleteFilesNotInBeatmap == 1 || this.deletesprites == 1){
									if (fullpathaudio !== ""){
										audioFiles.push({fullpathaudio, tempdata_beatmapsetid, tempdata_audio})
									}
								}

		   					}
		   				}
		   			}

			   			
		   			//uniques
		   			if (this.deletesprites == 1 || this.deleteFilesNotInBeatmap == 1){
			   			tempSprites = tempSprites.filter(function(elem, pos) {
						    return tempSprites.indexOf(elem) == pos;
						})
					}
					
					if (this.deletevideos== 1 || this.deleteFilesNotInBeatmap == 1 ){
						tempVideos = tempVideos.filter(function(elem, pos) {
						    return tempVideos.indexOf(elem) == pos;
						})
					}
					
					if (this.deletesprites == 1 || this.checkexsitsbg == 1 || this.deleteFilesNotInBeatmap == 1){
						var bgFiles2 = []
						bgFiles.filter(function(el){
							var i = bgFiles2.findIndex(x=>(x.bg_i === el.bg_i))
							if(i <= -1){
						        bgFiles2.push(el);
							}
							return null;
						})
						bgFiles = bgFiles2
					}

					if (this.checkaudioexists == 1 || this.deletesprites == 1 || this.deleteFilesNotInBeatmap == 1 ){
						var audioFiles2 = []
						audioFiles.filter(function(el){
							var i = audioFiles2.findIndex(x=>(x.fullpathaudio === el.fullpathaudio))
							if(i <= -1){
						        audioFiles2.push(el);
							}
							return null;
						})
						audioFiles = audioFiles2
					}

					if (this.deletesprites == 1){
						tempSprites = tempSprites.filter (function(elem){
							var spriteisbg = false
							for (var tempbgcurrent of bgFiles){
								if (tempbgcurrent.bg_i===elem){
									spriteisbg = true
									break
								}
							}
							return !spriteisbg
						})
						tempSprites = tempSprites.filter (function(elem){
							var spriteisaudio = false
							for (var tempaudiocurrent of audioFiles){
								if (tempaudiocurrent.tempdata_audio===elem){
									spriteisaudio = true
									break
								}
							}
							return !spriteisaudio
						})
						for (var tempsprite of tempSprites){
							var fullpathprite = (filePathTemp+"\\"+tempsprite).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
				      		await scanner.checkFileExists(fullpathprite,'sprite',"-2")
						    
						}
					}

					if (this.deletevideos== 1){
						for (var tempvideo of tempVideos){
							var fullpathvideo = (filePathTemp+"\\"+tempvideo).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
				      		await scanner.checkFileExists(fullpathvideo,'video',"-2")
						    
						}
					}

					if (this.checkaudioexists == 1){
						for (var tempAudio of audioFiles){
							await scanner.checkFileExists(tempAudio.fullpathaudio,'audio',tempAudio.tempdata_beatmapsetid)
						}
					}

					if (this.checkexsitsbg == 1){

						for (var bgFile of bgFiles){
							var fullpathbg = (filePathTemp+"\\"+bgFile.bg_i).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
							var isBG = await scanner.checkFileExists(fullpathbg,'bg',bgFile.tempdata_beatmapsetid)
							let bgName = bgFile.bg_i
							let bgSetID = bgFile.tempdata_beatmapsetid
							if (this.replaceEmptyBG == 1 && isBG === true){
								bgExists.push ({fullpathbg, filePathTemp , bgName, bgSetID})
							}
							if (this.replaceEmptyBG == 1 && isBG === false){
								bgEmpty.push ({fullpathbg, filePathTemp , bgName, bgSetID})
							}
						}
					}

		   			if (this.deleteFilesNotInBeatmap == 1){
		   				tempBgs.length = 0
		   				for (var tempbg of bgFiles){
		   					tempBgs.push (tempbg.bg_i)
		   				}
						allFolderFiles = tempSprites.concat(tempBgs).concat(tempVideos).concat(otherFiles)
						await this.checkInNotBeatmapFilesRecursive(filePathTemp,"",allFolderFiles)
					}

					if (this.deleteEmptyDir == 1 && findEmpty==1){
		   				if (this.debug == 0){
			   				await fs.rmdir(filePathTemp, { recursive: true })
			   			}
			   			if (this.logs == 1){
			   				await fs.appendFile('deleted_dirs.txt', filePathTemp+"\n");
			   			}
		   			}

		   		}
			} 
		}

/////////////////////////

		if (this.deletebeatmapsdublicates == 1){			
			var beatmapsDB_sorting = []
			var beatmapsDB_dublicates = []
			var el_num = 0
			var el_num_proc = 0
			var BeatmapsDB_length = this.BeatmapsDB.length

			ProgressBarDefault()

			this.BeatmapsDB.filter(function(el){
				var i = beatmapsDB_sorting.findIndex(x=>(x.BeatmapID === el.BeatmapID && 
					x.tempdata_beatmapsetid === el.tempdata_beatmapsetid && x.BeatmapDifficulty === el.BeatmapDifficulty))
				if(i <= -1){
			      beatmapsDB_sorting.push(el);
				} else {
					beatmapsDB_dublicates.push(el)
				}

				if (el_num % (BeatmapsDB_length/1000) < 1 ){
					process.stdout.write('\033c')
					log ("[Tasks]")
					log ("Delete dublicates")
					log (" ")
					el_num_proc = Math.trunc(el_num / BeatmapsDB_length * 1000) / 10
					log ("Finding dublicates...")
		   	 		PrintProcents(el_num_proc)
		   	 	}
				el_num++

				return null;
			})
			this.BeatmapsDB = beatmapsDB_sorting

			log ("Dublicated finded: "+beatmapsDB_dublicates.length)
			//fs.writeFile('BeatmapsDB.json',JSON.stringify(this.BeatmapsDB));
			//fs.writeFile('beatmapsDB_dublicates.json',JSON.stringify(beatmapsDB_dublicates));

			for (var dublicated_beatmap of beatmapsDB_dublicates){
				if (this.debug==0){
					await fs.unlink(this.Songspath+"\\"+dublicated_beatmap.BeatmapFilename)
				}
				if (this.logs == 1){
					await fs.appendFile('deleted_dublicated_files.txt', this.Songspath+"\\"+dublicated_beatmap.BeatmapFilename+"\n");
				}
			}
			log ("All Dublicated Deleted.")

		}	//end if deletebeatmapdublicates

		//замена фонов рандомными
		if (this.checkexsitsbg == 1){
			if (this.replaceEmptyBG == 1){
				var el_num = 0
				var el_num_proc = 0
				ProgressBarDefault()
				for (var bge of bgEmpty){
					var bgCopy_IndexRandom = Math.floor(Math.random() * bgExists.length)
					try{
						await fs.access(bge.fullpathbg, fs.F_OK)
					}catch(errorBgExists){
						if (errorBgExists.code === 'ENOENT'){
							fs.copyFile(bgExists[bgCopy_IndexRandom].fullpathbg,bge.fullpathbg)
							//log ("copy "+bgExists[bgCopy_IndexRandom].fullpathbg+" to "+bge.fullpathbg)
							if (this.logs == 1){
								await fs.appendFile('replaced_bgs.txt', "copy "+bgExists[bgCopy_IndexRandom].fullpathbg+" to "+bge.fullpathbg+"\n");
							}
						}
					}
					if (el_num % (bgEmpty.length/1000) < 1 ){
						process.stdout.write('\033c')
						log ("[Tasks]")
						log ("Checking bg exists")
						log (" * Replacing BGs... ("+ bgEmpty.length +")")
						log (" ")
						el_num_proc = Math.trunc(el_num / bgEmpty.length * 1000) / 10
			   	 		PrintProcents(el_num_proc)
			   	 	}
					el_num++
				}
			}
		}	//end checkexsitsbg replaceEmptyBG

	//end function run
	}

}

main = async function(){
	return (await scanner.run())
}
main()