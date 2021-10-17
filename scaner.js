var log = console.log.bind(console)
var fs = require('fs').promises
var path = require('path')


var scanner = {
	//путь к папке Songs (обратный слеш в пути экранируется еще одним - \\ )
	Songspath: 'H:\\Songs',

	///////////////////
	//1 = да, 0 = нет
	///////////////////
	//Удаляет пустые папки без найденных osu файлов
	deleteEmptyDir: 1,
	//удаляет спрайты/сториборды карт и часть хитсаундов
	deletesprites: 0,
	//удаляет видео карт
	deletevideos: 0,
	//удаляет скины, хитсаунды и файлы не относящиеся к карте
	deleteFilesNotInBeatmap: 0,
	//проверка отсутствующих бекграундов, результаты будут в txt файле
	checkexsitsbg: 0,
	//проверка отсутствующих аудио файлов, результаты будут в txt файле
	checkaudioexists: 0,
	//удалить все карты стандартной осу
	deletestd: 0,
	//удалить карты тайко
	deletetaiko: 0,
	//удалить карты мании
	deletemania: 0,
	//удалить карты catch the beat
	deletectb: 0,

	//пока не работает
	deletebeatmapsdublicates: 1,

	debug: 0,

	BeatmapsDB: [],

	checkFileExists: async function(filepath,filetype,idmap){
	  	try
	  	{
		    await fs.access(filepath, fs.F_OK)
		    if (filetype=='sprite'){
		    	if (this.deletesprites == 1){
		    		await fs.appendFile('deleted_sprites.txt', filepath+"\n");
		    		if (this.debug == 0){
			    		await fs.unlink(filepath)
			    	}
		    	}
		    }
		    if (filetype=='video'){
		    	if (this.deletevideos == 1){
		    		await fs.appendFile('deleted_videos.txt', filepath+"\n");
		    		if (this.debug == 0){
		    			await fs.unlink(filepath)
		    		}
		    	}
		    }
	  	} catch(error) {
			if (error.code === 'ENOENT') {
			  	if (filetype=='bg'){
			  		if (this.checkexsitsbg == 1){
			  			if (idmap === "-2" || idmap === "-1"){
				    		await fs.appendFile('bg_not_exists.html', "[no link] "+filepath+"\n</br>");
				    	} else {
				    		await fs.appendFile('bg_not_exists.html',"<a href=https://osu.ppy.sh/beatmapsets/"+idmap+"/download>"+filepath+"</a>\n</br>");
				    	}
				    }
				}
				if (filetype=='audio'){
			    	if (this.checkaudioexists == 1){
			    		if (idmap === "-2" || idmap === "-1"){
			    			await fs.appendFile('audio_not_exists.html',"[no link] "+filepath+"\n</br>");
			    		} else {
				    		await fs.appendFile('audio_not_exists.html',"<a href=https://osu.ppy.sh/beatmapsets/"+idmap+"/download>"+filepath+"</a>\n</br>");
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
						await fs.appendFile('files_not_in_beatmaps.txt', fullpathinnotbeatmap+"\n");
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

	  	const SongsDir = await fs.readdir(this.Songspath);
	  	var rd 
	  	var itemnum = 0
	  	var itemnumproc = 0

 		for (const file of SongsDir){

			if (itemnum % (SongsDir.length/1000) < 1 ){
 				process.stdout.write('\033c')
 				itemnumproc = Math.trunc(itemnum / SongsDir.length * 1000) / 100
 				log ("Processing...")
		 		log ( itemnumproc + "%" )
			}
	   	 
	   		itemnum++

	  		if (file !== undefined && file !== null && file !== '' && file !== '.' && file !== '..' ){
	  			var filePathTemp = (this.Songspath+'\\'+file).replace(/\/+/g, '\\').replace(/\\+/g, '\\')
		   	 	var fileTemp = await fs.lstat(filePathTemp)

		   		if (fileTemp.isDirectory()){

		   			const DirTemp = await fs.readdir(filePathTemp)
		   			var findEmpty = 0

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
		   			//log ('processing '+file)

		   			for (const file2 of DirTemp){
		   				if (file2 !== undefined && file2 !== null && file2 !== '' && file2 !== '.' && file2 !== '..' ){
		   					
		   					if (path.extname(file2)=='.osu' || path.extname(file2)=='.osb'){
		   						//log ('reading '+filePathTemp+"\\"+file2)
			   						var tempdata = await fs.readFile((filePathTemp+"\\"+file2).replace(/\/+/g, '\\').replace(/\\+/g, '\\'),'utf8')
			   						if (this.deleteFilesNotInBeatmap == 1){
				   						otherFiles.push(file2.toLowerCase())
				   					}

			   						tempdata = tempdata.toString().split("\n");
			   						
			   						var eventscheck = 0
			   						var tempdata_beatmapid = "0"
			   						var tempdata_beatmapsetid = "-2"
			   						var fullpathaudio = ""

			   						for(i in tempdata) {
			   								
		   								if (this.checkaudioexists == 1 || this.deleteFilesNotInBeatmap == 1 || this.deletebeatmapsdublicates == 1){

		   									if(tempdata[i].startsWith("AudioFilename:") ){
													var tempdata_audio = tempdata[i].split(":")
													fullpathaudio = (filePathTemp+"\\"+tempdata_audio[1].trim()).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
													if (this.deleteFilesNotInBeatmap == 1){
														otherFiles.push((tempdata_audio[1].trim()).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase())
													}
												}
			   								if(tempdata[i].startsWith("BeatmapID:") ){
		   										tempdata_beatmapid = tempdata[i].split(":")
		   										tempdata_beatmapid =  tempdata_beatmapid[1].trim()

			   								}
			   								if(tempdata[i].startsWith("BeatmapSetID:") ){
		   										tempdata_beatmapsetid = tempdata[i].split(":")
		   										tempdata_beatmapsetid =  tempdata_beatmapsetid[1].trim()
		   									}

		   									var tempdatafilename = (file+"\\"+file2).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
		   								}

		   								if (this.deletectb == 1 || this.deletemania == 1 ||this.deletetaiko == 1 ||this.deletestd == 1 ){
		   									if(tempdata[i].startsWith("Mode:") === true){
		   										var tempdata_mode = tempdata[i].split(":")
		   										tempdata_mode = tempdata_mode[1].trim()
		   										if (tempdata_mode == "0" && this.deletestd == 1){
		   											await fs.appendFile('deleted_beatmaps.txt', filePathTemp+"\\"+file2+"\n");
		   											if (this.debug == 0){
		   												await fs.unlink(filePathTemp+"\\"+file2)
		   											}
		   										}
		   										if (tempdata_mode == "1" && this.deletetaiko == 1){
		   											await fs.appendFile('deleted_beatmaps.txt', filePathTemp+"\\"+file2+"\n");
		   											if (this.debug == 0){
		   												await fs.unlink(filePathTemp+"\\"+file2)
		   											}
		   										}
		   										if (tempdata_mode == "2" && this.deletectb == 1){
		   											await fs.appendFile('deleted_beatmaps.txt', filePathTemp+"\\"+file2+"\n");
		   											if (this.debug == 0){
		   												await fs.unlink(filePathTemp+"\\"+file2)
		   											}
		   										}
		   										if (tempdata_mode == "3" && this.deletemania == 1){
		   											await fs.appendFile('deleted_beatmaps.txt', filePathTemp+"\\"+file2+"\n");
		   											if (this.debug == 0){
		   												await fs.unlink(filePathTemp+"\\"+file2)
		   											}
		   										}
		   									}
		   								}

		   								if (this.deletesprites== 1 || this.deletevideos == 1 || this.checkexsitsbg == 1){
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

			   										//await fs.appendFile('events.txt', tempdata[i]);

			   										if (this.deletesprites == 1 || this.deleteFilesNotInBeatmap == 1){
				   										if (tempdata[i].startsWith("Animation,") === true || 
					   									tempdata[i].startsWith("Sprite,") === true || 
					   									tempdata[i].startsWith("Sample,") === true ||	
															tempdata[i].startsWith("4,") === true  ||
															tempdata[i].startsWith("5,") === true  ||
															tempdata[i].startsWith("6,") === true ){
				   											var tempdata_sprite = tempdata[i].split(",")
				   											tempdata_sprite = tempdata_sprite[3].replace(/"/g, "").replace(/\/+/g, '\\').replace(/\\+/g, '\\').trim().toLowerCase()
														   	tempSprites.push(tempdata_sprite)
															}
														}

														if (this.deletevideos== 1 || this.deleteFilesNotInBeatmap == 1){
															if (tempdata[i].startsWith("1,") === true ||//video
															tempdata[i].startsWith("Video,") === true){
																//await fs.appendFile('events.txt', tempdata[i]);
																var tempdata_video = tempdata[i].split(",")
				   											tempdata_video = tempdata_video[2].replace(/"/g, "").replace(/\/+/g, '\\').replace(/\\+/g, '\\').trim().toLowerCase()
														   	tempVideos.push(tempdata_video)
															}
														}

														if (this.checkexsitsbg == 1 || this.deletesprites == 1 || this.deleteFilesNotInBeatmap == 1){
				   										if(tempdata[i].startsWith("0,") === true //bg
															){
				   											var tempdata_bg = tempdata[i].split(",")
				   											tempdata_bg = tempdata_bg[2].replace(/"/g, "").replace(/\/+/g, '\\').replace(/\\+/g, '\\').trim().toLowerCase()
													      	tempBgs.push(tempdata_bg)
															}
														}

			   									}
			   									
			   								}

			   							}

										}	//end for
									
								  ////////////
									if (this.deletebeatmapsdublicates == 1){
										if (path.extname(file2)=='.osu'){
											if ( tempdata_beatmapid === "0" ||  tempdata_beatmapsetid ==="-1" || tempdata_beatmapsetid ==="-2" ){

												
											}else {
												var NewBeatmap = {
													"BeatmapID":tempdata_beatmapid,
													"BeatmapSetID":tempdata_beatmapsetid,
													"BeatmapFilename":tempdatafilename
												}

												this.BeatmapsDB.push(NewBeatmap)
												
												/*log (tempdata_beatmapid)
												log(tempdata_beatmapsetid)
												log(tempdatafilename)*/
											}
										}
				   				}

				   				if (this.checkexsitsbg == 1 ){
				   					for (var bg_i of tempBgs){
				   						bgFiles.push({bg_i, tempdata_beatmapsetid})
				   					}
				   				}

				   				if (this.checkaudioexists == 1){
										
										if (fullpathaudio !== ""){
											audioFiles.push({fullpathaudio, tempdata_beatmapsetid})
										}
										
									}

		   						if (this.deleteEmptyDir == 1){
		   							if (path.extname(file2)=='.osu'){
			   							findEmpty=1
			   						}
		   						}

		   					}
		   				}
		   			}

		   			
		   			//uniques
		   			tempSprites = tempSprites.filter(function(elem, pos) {
						    return tempSprites.indexOf(elem) == pos;
						})
						/*tempBgs = tempBgs.filter(function(elem, pos) {
						    return tempBgs.indexOf(elem) == pos;
						})*/
						tempVideos = tempVideos.filter(function(elem, pos) {
						    return tempVideos.indexOf(elem) == pos;
						})
					
						var bgFiles2 = []
						bgFiles.filter(function(el){
							var i = bgFiles2.findIndex(x=>(x.bg_i === el.bg_i))
							if(i <= -1){
						        bgFiles2.push(el);
							}
							return null;
						})
						bgFiles = bgFiles2

						var audioFiles2 = []
						audioFiles.filter(function(el){
							var i = audioFiles2.findIndex(x=>(x.fullpathaudio === el.fullpathaudio))
							if(i <= -1){
						        audioFiles2.push(el);
							}
							return null;
						})
						audioFiles = audioFiles2

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
							for (var tempsprite of tempSprites){
								var fullpathprite = (filePathTemp+"\\"+tempsprite).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
					      	scanner.checkFileExists(fullpathprite,'sprite',"-2")
							    
							}
						}

						if (this.deletevideos== 1){
							for (var tempvideo of tempVideos){
								var fullpathvideo = (filePathTemp+"\\"+tempvideo).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
					      	scanner.checkFileExists(fullpathvideo,'video',"-2")
							    
							}
						}

						if (this.checkaudioexists == 1){
							for (var tempAudio of audioFiles){
								scanner.checkFileExists(tempAudio.fullpathaudio,'audio',tempAudio.tempdata_beatmapsetid)
							}
						}

						if (this.checkexsitsbg == 1){
							for (var bgFile of bgFiles){
								var fullpathbg = (filePathTemp+"\\"+bgFile.bg_i).replace(/\/+/g, '\\').replace(/\\+/g, '\\').toLowerCase()
								scanner.checkFileExists(fullpathbg,'bg',bgFile.tempdata_beatmapsetid)
							}
						}

		   			if (this.deleteEmptyDir == 1 && findEmpty==0){
		   				if (this.debug == 0){
			   				await fs.rmdir(filePathTemp, { recursive: true })
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


		   		}
			} 
   		}

/////////////////////////

   /*	if (this.deletebeatmapsdublicates == 1){
    //fs.writeFile('beatmapsDB.json',JSON.stringify(this.BeatmapsDB));
    const SongsDir2 = await fs.readdir(this.Songspath);
	itemnum = 0
  	itemnumproc = 0
    for (const file4 of SongsDir2){

		if (itemnum % (SongsDir.length/10000) < 1 ){
			process.stdout.write('\033c')
			itemnumproc = Math.trunc(itemnum / SongsDir.length * 10000) / 100
	   	 	log ( "cheking dublicates: "+ itemnumproc + "%" )
	   	 }
	   	 
	   	itemnum++

  		if (file !== undefined && file !== null && file !== '' && file !== '.' && file !== '..' ){
  			filePathTemp = (this.Songspath+'\\'+file).replace(/\\+/g, '\\')
	   	 	fileTemp = await fs.lstat(filePathTemp)

	   		if (fileTemp.isDirectory()){

	   			const DirTemp3 = await fs.readdir(filePathTemp)
	   			for (file2 of DirTemp3){
   					if (file2 !== undefined && file2 !== null && file2 !== '' && file2 !== '.' && file2 !== '..' ){
		   					
	   					if (path.extname(file2)=='.osu' || path.extname(file2)=='.osb'){
		   						
	   						var tempdata2 = await fs.readFile((filePathTemp+"\\"+file2).replace(/\\+/g, '\\'),'utf8')
			   						
			   				tempdata2 = tempdata2.toString().split("\n");
			   						
			   				for(i in tempdata2) {
   								if (this.deletebeatmapsdublicates == 1){

   									if(tempdata2[i].startsWith("BeatmapID:")){
   										var tempdata_beatmapid_check  = tempdata2[i].split(":")
   										tempdata_beatmapid_check  =  tempdata_beatmapid_check[1].trim()

   									}
   									if(tempdata2[i].startsWith("BeatmapSetID:")){
   										var tempdata_beatmapsetid_check = tempdata2[i].split(":")
   										tempdata_beatmapsetid_check  =  tempdata_beatmapsetid_check [1].trim()
   									}
   									var tempdatafilename_check  = (file+"\\"+file2).replace(/\\+/g, '\\')
   									
   								}
   							}

   							if (this.deletebeatmapsdublicates == 1){
						    	if (tempdata_beatmapid_check  !== "0" || tempdata_beatmapsetid_check  !== "-1"){
							    	
							    	var isBeatmapDup = this.BeatmapsDB.filter(function(el){
							    		return tempdata_beatmapid_check === el.BeatmapID && tempdata_beatmapsetid_check === el.BeatmapSetID
							    	})

							    	log (isBeatmapDup)
			   						
			   					}
		   					}
		   				}
   						}}
   					}
   				}
	   		}
	   	}*/

/////////////

		if (this.deletebeatmapsdublicates == 1){
			//log ("To unique "+this.BeatmapsDB.length)
			
			var beatmapsDB_sorting = []
			var beatmapsDB_dublicates = []
			var el_num = 0
			var el_num_proc = 0
			var BeatmapsDB_length = this.BeatmapsDB.length
			this.BeatmapsDB.filter(function(el){
				var i = beatmapsDB_sorting.findIndex(x=>(x.BeatmapID === el.BeatmapID && x.tempdata_beatmapsetid === el.tempdata_beatmapsetid))
				if(i <= -1){
			      beatmapsDB_sorting.push(el);
				} else {
					beatmapsDB_dublicates.push(el)
				}
				if (el_num % (BeatmapsDB_length/1000) < 1 ){
 				process.stdout.write('\033c')
 				el_num_proc = Math.trunc(el_num / BeatmapsDB_length * 1000) / 100
 					log ("Finding dublicates...")
	   	 		log ( el_num_proc + "%" )
	   	 	}
				el_num++

				return null;
			})
			this.BeatmapsDB = beatmapsDB_sorting
			//log ("Uniques "+this.BeatmapsDB.length)
			log ("Dublicated finded: "+beatmapsDB_dublicates.length)
			//fs.writeFile('BeatmapsDB.json',JSON.stringify(this.BeatmapsDB));
			//fs.writeFile('beatmapsDB_dublicates.json',JSON.stringify(beatmapsDB_dublicates));

			//second cycle
			for (var dublicated_beatmap of beatmapsDB_dublicates){
				if (this.debug==0){
					await fs.unlink(this.Songspath+"\\"+dublicated_beatmap.BeatmapFilename)
				}
				await fs.appendFile('deleted_dublicated_files.txt', this.Songspath+"\\"+dublicated_beatmap.BeatmapFilename+"\n");
			}
			log ("All Dublicated Deleted.")

		}	//end if deletebeatmapdublicates


//end function run
	}

}

main = async function(){
	return (await scanner.run())
}
main()