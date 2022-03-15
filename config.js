module.exports = {
	//путь к папке Songs (обратный слеш в пути экранируется еще одним - \\ )
	Songspath: 'F:\\Downloads\\MediaGet Downloads\\Songs',

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
	deletebeatmapsdublicates: 0,
	//удалить все карты стандартной осу
	deletestd: 0,
	//удалить карты тайко
	deletetaiko: 0,
	//удалить карты мании
	deletemania: 1,
	//удалить карты catch the beat
	deletectb: 1,
	//удалить короткие карты
	deleteshortmaps: 1,
	MinHitObjects: 30,//минимальное количество обьектов в карте

	//проверка отсутствующих бекграундов, результаты будут в txt файле
	checkexsitsbg: 1,
	//заменять отсутствующие бг рандомными
	replaceEmptyBG: 0,

	//проверка отсутствующих аудио файлов, результаты будут в txt файле
	checkaudioexists: 1,

	//не удалять файлы (режим отладки скрипта)
	debug: 0,
	debug_cleanlogs: 1,
	//писать в txt файлы, что удалено. Не влияет на checkexsitsbg, checkaudioexists
	logs: 0,
	//заменить ссылки на bloodcat
	bloodcat: 0,
}
