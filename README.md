# Osu-Beatmaps-cleaner
Очищает мусор в картах в игре osu!

Для запуска скрипта предустановите node.js

настройки вначале скрипта

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
	//проверка отсутствующих бекграундов, результаты будут в txt файле
	checkexsitsbg: 1,
	//проверка отсутствующих аудио файлов, результаты будут в txt файле
	checkaudioexists: 1,
	//удалить все карты стандартной осу
	deletestd: 0,
	//удалить карты тайко
	deletetaiko: 1,
	//удалить карты мании
	deletemania: 1,
	//удалить карты catch the beat
	deletectb: 1,
