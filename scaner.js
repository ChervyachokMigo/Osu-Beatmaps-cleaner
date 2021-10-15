var log = console.log.bind(console)
var fs = require('fs').promises
var path = require('path')


var scanner = {
	Songspath: 'H:\\Songs',

	arrayFiles: [],
	BeatmapsDB: [],

	deleteEmptyDir: 1,

	deletesprites: 1,
	deletevideos: 1,

	deleteFilesNotInBeatmap: 0,

	checkexsitsbg: 0,
	checkaudioexists: 0,

	deletestd: 0,
	deletetaiko: 1,
	deletemania: 1,
	deletectb: 1,

	//deletebeatmapsdublicates: 0,

	checkFileExists: async function(filepath,filetype){
	  	try
	  	{
		    await fs.access(filepath, fs.F_OK)
		    if (filetype=='sprite'){
		    	if (this.deletesprites == 1){
		    		await fs.appendFile('deleted_sprites.txt', filepath+"\n");
		    		await fs.unlink(filepath)
		    	}
		    }
		    if (filetype=='video'){
		    	if (this.deletevideos == 1){
		    		await fs.appendFile('deleted_videos.txt', filepath+"\n");
		    		await fs.unlink(filepath)
		    	}
		    }
	  	} catch(error) {
			if (error.code === 'ENOENT') {
			  	if (filetype=='bg'){
			  		if (this.checkexsitsbg == 1){
				    	await fs.appendFile('bg_not_exists.txt', filepath+"\n");
				    }
				}
				if (filetype=='audio'){
			    	if (this.checkaudioexists == 1){
			    		await fs.appendFile('audio_not_exists.txt', filepath+"\n");
			    	}
			    }
			} else {
				throw 'unknown error'
			}
		}
	},

	checkInNotBeatmapFilesRecursive: async function(fullpath,relativepath,allfoldersfilesArray){
		var fullpath_dir = fullpath+"\\"+relativepath
		
		const DirTemp2 = await fs.readdir(fullpath_dir)
		for (const file3 of DirTemp2){
			var fileinbeatmap = 0
			if (file3 !== undefined && file3 !== null && file3 !== '' && file3 !== '.' && file3 !== '..' ){
				for (var dirtemp2file of allfoldersfilesArray){
						if (dirtemp2file === (relativepath+"/"+file3).replace(/\\+/g, '/').replace(/^\/|\/$/g, '') ){
							fileinbeatmap = 1
					}
				}
				if (fileinbeatmap == 0){
					var fullpathinnotbeatmap = (fullpath_dir+'\\'+file3).replace(/\\+/g, '\\')
					var fileinbeatmapstatus = await fs.lstat(fullpathinnotbeatmap)

					if (!fileinbeatmapstatus.isDirectory()) {
						await fs.appendFile('files_not_in_beatmaps.txt', fullpathinnotbeatmap+"\n");
						await fs.unlink(fullpathinnotbeatmap)
					}	else{
							await this.checkInNotBeatmapFilesRecursive(fullpath,(relativepath+"\\"+file3).replace(/^\/|\/$/g, ''),allfoldersfilesArray)
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

 			if (itemnum % (SongsDir.length/10000) < 1 ){
 				process.stdout.write('\033c')
 				itemnumproc = Math.trunc(itemnum / SongsDir.length * 10000) / 100
	   	 		log ( itemnumproc + "%" )
	   	 	}
	   	 
	   		itemnum++

	  		if (file !== undefined && file !== null && file !== '' && file !== '.' && file !== '..' ){
	  			var filePathTemp = (this.Songspath+'\\'+file).replace(/\\+/g, '\\')
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
		   			//log ('processing '+file)

		   			for (const file2 of DirTemp){
		   				if (file2 !== undefined && file2 !== null && file2 !== '' && file2 !== '.' && file2 !== '..' ){
		   					
		   					if (path.extname(file2)=='.osu' || path.extname(file2)=='.osb'){
		   						//log ('reading '+filePathTemp+"\\"+file2)
			   						var tempdata = await fs.readFile((filePathTemp+"\\"+file2).replace(/\\+/g, '\\'),'utf8')
			   						if (this.deleteFilesNotInBeatmap == 1){
				   						otherFiles.push(file2)
				   					}

			   						tempdata = tempdata.toString().split("\n");
			   						
			   						var eventscheck = 0

			   						for(i in tempdata) {
			   								/*if (this.deletebeatmapsdublicates == 1){

			   									if(tempdata[i].startsWith("BeatmapID:")){
			   										var tempdata_beatmapid = tempdata[i].split(":")
			   										tempdata_beatmapid =  tempdata_beatmapid[1].trim()

			   									}
			   									if(tempdata[i].startsWith("BeatmapSetID:")){
			   										var tempdata_beatmapsetid = tempdata[i].split(":")
			   										tempdata_beatmapsetid =  tempdata_beatmapsetid[1].trim()
			   									}
			   									var tempdatafilename = (file+"\\"+file2).replace(/\\+/g, '\\')
			   									
			   								}*/

			   								if (this.deletectb == 1 || this.deletemania == 1 ||this.deletetaiko == 1 ||this.deletestd == 1 ){
			   									if(tempdata[i].startsWith("Mode:") === true){
			   										var tempdata_mode = tempdata[i].split(":")
			   										tempdata_mode = tempdata_mode[1].trim()
			   										if (tempdata_mode == "0" && this.deletestd == 1){
			   											await fs.appendFile('deleted_beatmaps.txt', filePathTemp+"\\"+file2+"\n");
			   										}
			   										if (tempdata_mode == "1" && this.deletetaiko == 1){
			   											await fs.appendFile('deleted_beatmaps.txt', filePathTemp+"\\"+file2+"\n");
			   										}
			   										if (tempdata_mode == "2" && this.deletectb == 1){
			   											await fs.appendFile('deleted_beatmaps.txt', filePathTemp+"\\"+file2+"\n");
			   										}
			   										if (tempdata_mode == "3" && this.deletemania == 1){
			   											await fs.appendFile('deleted_beatmaps.txt', filePathTemp+"\\"+file2+"\n");
			   										}
			   									}
			   								}

			   								if (this.checkaudioexists == 1 || this.deleteFilesNotInBeatmap == 1){
			   									if(tempdata[i].startsWith("AudioFilename:") === true){
														var tempdata_audio = tempdata[i].split(":")
														var fullpathaudio = filePathTemp+"\\"+tempdata_audio[1].trim()
														if (this.checkaudioexists == 1){
															scanner.checkFileExists(fullpathaudio,'audio')
														}
														if (this.deleteFilesNotInBeatmap == 1){
															otherFiles.push(tempdata_audio[1].trim())
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
					   											tempdata_sprite[3] = tempdata_sprite[3].replace(/"/g, "").trim()
															    tempSprites.push(tempdata_sprite[3])
																}
															}

															if (this.deletevideos== 1 || this.deleteFilesNotInBeatmap == 1){
																if (tempdata[i].startsWith("1,") === true ||//video
																tempdata[i].startsWith("Video,") === true){
																	//await fs.appendFile('events.txt', tempdata[i]);
																	var tempdata_video = tempdata[i].split(",")
					   											tempdata_video[2] = tempdata_video[2].replace(/"/g, "").trim()
															    tempVideos.push(tempdata_video[2])
																}
															}

															if (this.checkexsitsbg == 1 || this.deletesprites == 1 || this.deleteFilesNotInBeatmap == 1){
					   										if(tempdata[i].startsWith("0,") === true //bg
																){
					   											var tempdata_bg = tempdata[i].split(",")
					   											tempdata_bg[2] = tempdata_bg[2].replace(/"/g, "").trim()
														      tempBgs.push(tempdata_bg[2])
																}
															}

				   									}
				   									
				   								}
				   							}
								    }
								  ////////////
								    /*if (this.deletebeatmapsdublicates == 1){
								    	if (tempdata_beatmapid !== "0" || tempdata_beatmapsetid !== "-1"){
									    	var NewBeatmap = {
									    		"BeatmapID":tempdata_beatmapid,
									    		"BeatmapSetID":tempdata_beatmapsetid,
									    		"BeatmapFilename":tempdatafilename
									    	}
					   						this.BeatmapsDB.push(NewBeatmap)
					   					}
				   					}*/

		   						if (this.deleteEmptyDir == 1){
		   							findEmpty=1
		   						}

		   					}
		   				}
		   			}

		   			
		   			//uniques
		   			tempSprites = tempSprites.filter(function(elem, pos) {
						    return tempSprites.indexOf(elem) == pos;
						})
						tempBgs = tempBgs.filter(function(elem, pos) {
						    return tempBgs.indexOf(elem) == pos;
						})
						tempVideos = tempVideos.filter(function(elem, pos) {
						    return tempVideos.indexOf(elem) == pos;
						})
							
						if (this.deletesprites == 1){
							tempSprites = tempSprites.filter (function(elem){
								var spriteisbg = false
								for (var tempbgcurrent of tempBgs){
									if (tempbgcurrent===elem){
										spriteisbg = true
										break
									}
								}
								//if (spriteisbg) log (spriteisbg+" "+elem)
								return !spriteisbg
							})
							for (var tempsprite of tempSprites){
								var fullpathprite = filePathTemp+"\\"+tempsprite
					      scanner.checkFileExists(fullpathprite,'sprite')
							    
							}
						}

						if (this.deletevideos== 1){
							for (var tempvideo of tempVideos){
								var fullpathvideo = filePathTemp+"\\"+tempvideo
					      scanner.checkFileExists(fullpathvideo,'video')
							    
							}
						}

						if (this.checkexsitsbg == 1){
							for (var tempBg of tempBgs){
								var fullpathbg = filePathTemp+"\\"+tempBg
								scanner.checkFileExists(fullpathbg,'bg')
							}
						}

		   			if (this.deleteEmptyDir == 1 && findEmpty==0){
		   				//log ('delete '+filePathTemp)
		   				await fs.rmdir(filePathTemp, { recursive: true })
		   			}

		   			if (this.deleteFilesNotInBeatmap == 1){
							allFolderFiles = tempSprites.concat(tempBgs).concat(tempVideos).concat(otherFiles)
							await this.checkInNotBeatmapFilesRecursive(filePathTemp,"",allFolderFiles)
						}


		   		}
			} 
   		}

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

	}

}

main = async function(){
	return (await scanner.run())
}
main()