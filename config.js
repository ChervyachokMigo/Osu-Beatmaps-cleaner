module.exports = {
	//путь к папке osu
	osu_path: 'E:/osu!',

	///////////////////
	//1 = да, 0 = нет
	///////////////////

	//архивировать файлы перед удалением с сохранением путей
	backup_files: 1,
	backup_path: 'D:/SongsBackup',

	//не удалять файлы (режим отладки скрипта)
	debug: 0,
	//удалить логи перед запуском
	debug_cleanlogs: 1,

	//ВНИМАНИЕ: это удаляет ВСЕ ФОНЫ с карт
	delete_Backgrounds: 0, ///!!!!!!!!

	//удаляет спрайты, анимацию (сториборды) карт
	delete_BackgroundSprites: 1,
	delete_OtherSprites: 1,
	delete_BackgroundAnimations: 1,
	delete_OtherAnimations: 1,
	//удаляет звуковые семплы
	delete_Samples: 1,	

	//удаляет видео карт
	delete_Videos: 1,

	//удаляет скины, хитсаунды и файлы не относящиеся к карте
	delete_FilesNotInBeatmap: 1,

	//проверка отсутствующих бекграундов, результаты будут в txt файле
	check_missing_bg: 1,

	//Удаляет пустые папки без найденных osu файлов
	//deleteEmptyDir: 1,

	//поиск дубликатов
	//deletebeatmapsdublicates: 0,

	//удалить все карты стандартной осу
	//deletestd: 0,

	//удалить карты тайко
	//deletetaiko: 0,

	//удалить карты мании
	//deletemania: 0,

	//удалить карты catch the beat
	//deletectb: 0,

	//удалить короткие карты
	//deleteshortmaps: 0,
	//MinHitObjects: 0,//минимальное количество обьектов в карте


	//заменять отсутствующие бг рандомными
	//replaceEmptyBG: 0,

	//проверка отсутствующих аудио файлов, результаты будут в txt файле
	//checkaudioexists: 1,


	

	//писать в txt файлы, что удалено. Не влияет на checkexsitsbg, checkaudioexists
	//logs: 0,

	//заменить ссылки на bloodcat
	//bloodcat: 0,
}
