module.exports = {
	//путь к папке osu
	osu_path: 'E:/osu!',

	///////////////////
	//1 = да, 0 = нет
	///////////////////
	//не удалять файлы (режим отладки скрипта)
	debug: 0,
	//удалить логи перед запуском
	debug_cleanlogs: 1,

	//архивировать файлы перед удалением с сохранением путей
	backup_files: 1,
	backup_path: 'D:/SongsBackup',	

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

	//удалить все карты стандартной осу
	delete_std_beatmaps: 0,

	//удалить карты тайко
	delete_taiko_beatmaps: 0,

	//удалить карты catch the beat
	delete_ctb_beatmaps: 0,

	//удалить карты мании
	delete_mania_beatmaps: 0,

	//Удаляет пустые папки без найденных osu файлов
	delete_empty_directories: 1,

	//поиск дубликатов
	//deletebeatmapsdublicates: 0,


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
